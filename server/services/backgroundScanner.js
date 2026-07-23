import { providers } from "./songSources/adapterManager.js";
import Song from "../models/Song.js";
import { retryService } from "./retryService.js";
import { normalizeTitle } from "../utils/lyricsExtractor.js";
import { buildSongPayload } from "../utils/songNormalization.js";

const getFingerprint = (lyrics) => {
    if (!lyrics) return "";
    return lyrics.replace(/\s+/g, '').substring(0, 30).toLowerCase();
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async (fn, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err) {
            if (i === retries - 1) throw err;
            await delay(1000 * (i + 1)); // Exponential backoff
        }
    }
};

class BackgroundScanner {
    constructor() {
        this.isRunning = false;
        this.status = {
            totalDiscovered: 0,
            totalQueued: 0,
            totalProcessing: 0,
            totalImported: 0,
            totalDuplicates: 0,
            totalFailed: 0,
            totalSkipped: 0,
            successRate: 0,
            avgExtractionTime: 0,
            collectionPagesFound: 0,
            childSongUrlsExtracted: 0,
            invalidPagesRejected: 0,
            providers: {}
        };
        this.initProviders();
    }

    initProviders() {
        providers.forEach(p => {
            this.status.providers[p.name] = {
                discovered: 0,
                queued: 0,
                processing: 0,
                imported: 0,
                duplicates: 0,
                failed: 0,
                skipped: 0,
                collectionsFound: 0,
                childUrlsExtracted: 0,
                invalidRejected: 0,
                queue: [],
                known: new Set(),
                discoveryDone: false,
                status: "Idle",
                totalExtractionTime: 0,
                extractions: 0
            };
        });
    }

    getStatus() {
        // Strip out internal queue/known properties before sending to client
        const safeProviders = {};
        for (const [name, data] of Object.entries(this.status.providers)) {
            const safeData = { ...data };
            const successRate = data.extractions > 0 ? ((data.imported / data.extractions) * 100).toFixed(1) : 0;
            const avgTime = data.extractions > 0 ? (data.totalExtractionTime / data.extractions).toFixed(0) : 0;
            
            safeProviders[name] = {
                ...safeData,
                remaining: data.queued + data.processing,
                successRate: `${successRate}%`,
                avgExtractionTime: `${avgTime}ms`
            };
        }

        return {
            isRunning: this.isRunning,
            ...this.status,
            totalRemaining: this.status.totalQueued + this.status.totalProcessing,
            providers: safeProviders
        };
    }

    async startScan() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.initProviders();
        this.updateTotals();

        this.runScan().then(() => {
            this.isRunning = false;
            console.log("[BackgroundScanner] Scan completed successfully. Triggering auto-retry for transient failures...");
            retryService.startRetryAll();
        }).catch((err) => {
            this.isRunning = false;
            console.error("[BackgroundScanner] Scan aborted due to fatal error:", err);
        });
    }

    async runScan() {
        const CONCURRENCY = 8; // 8 parallel workers per provider

        for (const { name, provider } of providers) {
            if (!provider.discoverAll || !provider.fetchSong) {
                this.status.providers[name].status = "Skipped (Unsupported)";
                continue;
            }

            console.log(`[BackgroundScanner] Starting provider: ${name}`);
            const pStatus = this.status.providers[name];
            pStatus.status = "Running";

            // 1. Start Discovery in background
            provider.discoverAll((foundSoFar) => {
                for (const url of foundSoFar) {
                    if (!pStatus.known.has(url)) {
                        pStatus.known.add(url);
                        pStatus.queue.push(url);
                        pStatus.discovered++;
                        pStatus.queued++;
                        this.updateTotals();
                    }
                }
            }).then((allUrls) => {
                // Final sync in case callback missed anything
                for (const url of allUrls) {
                    if (!pStatus.known.has(url)) {
                        pStatus.known.add(url);
                        pStatus.queue.push(url);
                        pStatus.discovered++;
                        pStatus.queued++;
                    }
                }
                pStatus.discoveryDone = true;
                this.updateTotals();
            }).catch(() => {
                console.error(`[BackgroundScanner] Discovery error for ${name}`);
                pStatus.discoveryDone = true;
            });

            // 2. Start Workers
            const workers = Array(CONCURRENCY).fill().map(() => this.worker(name, provider));
            
            // Wait for all workers to finish for this provider before moving to the next
            // (Alternatively, we could run all providers concurrently, but this protects the server/MongoDB)
            await Promise.all(workers);
            
            pStatus.status = "Completed";
            this.updateTotals();
        }
    }

    async worker(name, provider) {
        const pStatus = this.status.providers[name];
        
        while (this.isRunning) {
            if (pStatus.queue.length === 0) {
                if (pStatus.discoveryDone) break; // No more URLs coming
                await delay(500); // Wait for discovery
                continue;
            }

            const url = pStatus.queue.shift();
            pStatus.queued--;
            pStatus.processing++;
            this.updateTotals();

            await this.processUrl(url, name, provider, pStatus);

            pStatus.processing--;
            this.updateTotals();
        }
    }

    async processUrl(url, name, provider, pStatus) {
        console.log(`[Scanner] [${name}] Started: ${url}`);
        const startTime = Date.now();
        
        try {
            // Check if collection page
            if (provider.isCollectionPage && provider.isCollectionPage(url)) {
                console.log(`[Scanner] [${name}] Collection detected: ${url}`);
                pStatus.collectionsFound++;
                
                const childUrls = await withRetry(() => provider.extractCollection(url), 3);
                if (childUrls && childUrls.length > 0) {
                    for (const cUrl of childUrls) {
                        if (!pStatus.known.has(cUrl)) {
                            pStatus.known.add(cUrl);
                            pStatus.queue.push(cUrl);
                            pStatus.discovered++;
                            pStatus.queued++;
                            pStatus.childUrlsExtracted++;
                        }
                    }
                }
                return; // Collection processed, urls queued
            }

            // Reject if explicitly invalid page
            if (provider.isSongPage && !provider.isSongPage(url)) {
                console.log(`[Scanner] [${name}] Rejected Invalid Page: ${url}`);
                pStatus.invalidRejected++;
                return;
            }

            // Download & Extract
            console.log(`[Scanner] [${name}] Download & Extract: ${url}`);
            
            // extractSong can return an array of songs, fallback to fetchSong for older providers
            const extractedData = await withRetry(() => provider.extractSong ? provider.extractSong(url) : provider.fetchSong(url), 3);
            const songsArray = Array.isArray(extractedData) ? extractedData : [extractedData];

            for (const songData of songsArray) {
                // Validate
                if (!songData || !songData.lyricsTamil) {
                    console.log(`[Scanner] [${name}] Invalid song data, missing lyrics`);
                    pStatus.failed++;
                    continue; // Skip this one, maybe other songs on the page are fine
                }

                // Check exact URL first
                const existingUrl = await Song.findOne({ url: songData.sourceUrl || url }).lean();
                if (existingUrl) {
                    console.log(`[Scanner] [${name}] Duplicate: Exact URL match for ${songData.sourceUrl || url}`);
                    pStatus.duplicates++;
                    continue;
                }

                // Fingerprint & Title duplicate check
                const normTitle = normalizeTitle(songData.titleTamil || songData.titleEnglish || "");
                if (normTitle) {
                    const possibleDuplicates = await Song.find({ 
                        $or: [
                            { titleTamil: { $regex: new RegExp(`^${normTitle}$`, 'i') } },
                            { titleEnglish: { $regex: new RegExp(`^${normTitle}$`, 'i') } }
                        ]
                    }).lean();
                    
                    const fp = getFingerprint(songData.lyricsTamil);
                    let isDuplicate = false;
                    
                    for (const dup of possibleDuplicates) {
                        const dupFp = getFingerprint(dup.lyricsTamil);
                        if (fp && dupFp && fp === dupFp) {
                            isDuplicate = true;
                            break;
                        }
                    }

                    if (isDuplicate) {
                        console.log(`[Scanner] [${name}] Duplicate: Title/Fingerprint match for ${songData.titleTamil}`);
                        pStatus.duplicates++;
                        continue;
                    }
                }

                // Save
                const payload = buildSongPayload({
                    ...songData,
                    title: songData.titleTamil || songData.titleEnglish || songData.title || "Unknown Title",
                    titleTamil: songData.titleTamil || songData.title || "",
                    titleEnglish: songData.titleEnglish || "",
                    lyrics: songData.lyricsTamil || songData.lyrics || "",
                    originalLyrics: songData.originalLyrics || songData.lyricsTamil || songData.lyrics || "",
                    cleanLyrics: songData.cleanLyrics || songData.lyricsTamil || songData.lyrics || "",
                    cleanedLyrics: songData.cleanedLyrics || songData.lyricsTamil || songData.lyrics || "",
                    lyricsEnglish: songData.lyricsEnglish || "",
                    category: "Tamil Christian Songs",
                    source: songData.source || name,
                    url: songData.sourceUrl || url,
                    sourceUrl: songData.sourceUrl || url,
                    artist: songData.artist || "",
                    scrapeStatus: "success",
                    status: "completed",
                    isPublished: true,
                    aiStatus: songData.aiStatus || "processed",
                    aiProvider: songData.aiProvider || "heuristic",
                    aiConfidence: songData.aiConfidence || songData.confidenceScore || 0,
                    aiMetadata: songData.aiMetadata || {},
                    providerHistory: songData.providerHistory || [{ source: songData.source || name, url: songData.sourceUrl || url, status: "success", checkedAt: new Date() }]
                }, {
                    source: songData.source || name,
                    sourceUrl: songData.sourceUrl || url,
                    category: "Tamil Christian Songs"
                });

                await Song.create(payload);

                console.log(`[Scanner] [${name}] Saved successfully: ${songData.titleTamil || "Song"}`);
                pStatus.imported++;
            }

        } catch (err) {
            console.error(`[Scanner] [${name}] Failed: ${url} - ${err.message}`);
            pStatus.failed++;
            
            try {
                const httpStatus = err.response?.status || 500;
                const isRec = retryService.isRecoverable(err.message, httpStatus);
                const docStatus = isRec ? "recovering" : "failed";
                
                await Song.create(buildSongPayload({
                    title: "Failed Import",
                    category: "Unknown",
                    source: name,
                    url: url,
                    sourceUrl: url,
                    scrapeStatus: "failed",
                    failReason: err.message,
                    httpStatus: httpStatus,
                    status: docStatus,
                    retryCount: 0,
                    nextRetryAt: isRec ? new Date() : null,
                    isPublished: false,
                    aiStatus: "failed",
                    aiProvider: "heuristic",
                    aiConfidence: 0,
                    aiMetadata: {}
                }, {
                    source: name,
                    sourceUrl: url,
                    category: "Unknown"
                }));
            } catch {
              // If the failure record cannot be persisted, continue scan recovery flow.
            }
        } finally {
            const timeTaken = Date.now() - startTime;
            pStatus.totalExtractionTime += timeTaken;
            pStatus.extractions++;
        }
    }

    updateTotals() {
        let tDisc = 0, tQ = 0, tProc = 0, tImp = 0, tDup = 0, tFail = 0, tSkip = 0;
        let tExtractions = 0, tTime = 0;
        let tCollections = 0, tChildUrls = 0, tInvalid = 0;
        
        for (const key in this.status.providers) {
            const p = this.status.providers[key];
            tDisc += p.discovered;
            tQ += p.queued;
            tProc += p.processing;
            tImp += p.imported;
            tDup += p.duplicates;
            tFail += p.failed;
            tSkip += p.skipped;
            tExtractions += p.extractions;
            tTime += p.totalExtractionTime;
            
            tCollections += (p.collectionsFound || 0);
            tChildUrls += (p.childUrlsExtracted || 0);
            tInvalid += (p.invalidRejected || 0);
        }

        this.status.totalDiscovered = tDisc;
        this.status.totalQueued = tQ;
        this.status.totalProcessing = tProc;
        this.status.totalImported = tImp;
        this.status.totalDuplicates = tDup;
        this.status.totalFailed = tFail;
        this.status.totalSkipped = tSkip;
        
        this.status.collectionPagesFound = tCollections;
        this.status.childSongUrlsExtracted = tChildUrls;
        this.status.invalidPagesRejected = tInvalid;
        
        this.status.successRate = tExtractions > 0 ? ((tImp / tExtractions) * 100).toFixed(1) + "%" : "0%";
        this.status.avgExtractionTime = tExtractions > 0 ? Math.floor(tTime / tExtractions) + "ms" : "0ms";
    }
}

export const scanner = new BackgroundScanner();
