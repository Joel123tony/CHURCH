import Song from "../models/Song.js";
import { detectProvider } from "./songSources/adapterManager.js";
import { buildSongPayload } from "../utils/songNormalization.js";

const RETRY_INTERVALS_SEC = [0, 30, 120, 300, 900, 1800, 3600, 7200];

class RetryService {
    constructor() {
        this.isRunning = false;
        this.status = {
            total: 0,
            retried: 0,
            recovered: 0,
            failed: 0,
            skipped: 0,
            durationMs: 0
        };
        this.startTime = 0;
        this.startAutoRetryLoop();
    }

    startAutoRetryLoop() {
        setInterval(async () => {
            if (this.isRunning) return;
            try {
                const now = new Date();
                const dueForRetry = await Song.find({
                    status: "recovering",
                    nextRetryAt: { $lte: now }
                }).select("_id").lean();

                if (dueForRetry.length > 0) {
                    console.log(`[RetryService] Auto-retry loop found ${dueForRetry.length} songs due for retry.`);
                    const ids = dueForRetry.map(s => s._id);
                    await this.startRetrySelected(ids, true);
                }
            } catch (err) {
                console.error("[RetryService] Auto-retry loop error:", err);
            }
        }, 60 * 1000); // Check every minute
    }

    isRecoverable(reason, httpStatus) {
        if (!reason && !httpStatus) return true;
        
        const r = (reason || "").toLowerCase();
        
        // Known recoverable HTTP statuses
        const recoverableStatuses = [500, 502, 503, 504, 429];
        if (httpStatus && recoverableStatuses.includes(httpStatus)) return true;

        // Known recoverable errors
        if (r.includes("timeout") || 
            r.includes("network error") || 
            r.includes("econnreset") || 
            r.includes("enotfound") || 
            r.includes("ehostunreach") || 
            r.includes("etimedout")) {
            return true;
        }

        // Everything else (404, 410, parsing issues, duplicate, unsupported) is permanent
        return false;
    }

    getStatus() {
        const currentDuration = this.isRunning ? (Date.now() - this.startTime) : this.status.durationMs;
        return {
            ...this.status,
            isRunning: this.isRunning,
            durationMs: currentDuration
        };
    }

    async processQueue(queue, concurrency = 5) {
        const workers = Array(concurrency).fill(null).map(async () => {
            while (queue.length > 0) {
                const songId = queue.pop();
                try {
                    const song = await Song.findById(songId);
                    if (song.status !== "failed" && song.status !== "recovering") {
                        this.status.skipped++;
                        continue;
                    }

                    if (!this.isRecoverable(song.failReason, song.httpStatus)) {
                        // If it somehow got into the queue but is permanent, mark it failed.
                        if (song.status === "recovering") {
                             song.status = "failed";
                             await song.save();
                        }
                        this.status.skipped++;
                        continue;
                    }

                    const providerInfo = detectProvider(song.url || song.sourceUrl);
                    if (!providerInfo || (!providerInfo.provider.fetchSong && !providerInfo.provider.extractSong)) {
                        song.failReason = "Unsupported Provider for retry";
                        await song.save();
                        this.status.skipped++;
                        continue;
                    }

                    this.status.retried++;

                    try {
                        const fetcher = providerInfo.provider.extractSong || providerInfo.provider.fetchSong;
                        let songData = await fetcher(song.url || song.sourceUrl);
                        
                        if (Array.isArray(songData)) {
                            if (songData.length === 0) throw new Error("No songs found");
                            // For retrying a single failed URL that turned out to be an array, 
                            // we just recover the first one into this song record.
                            songData = songData[0];
                        }
                        
                        // Successfully fetched, update the record
                        const payload = buildSongPayload({
                            ...song.toObject(),
                            ...songData,
                            title: songData.titleTamil || songData.titleEnglish || songData.title || song.title,
                            titleTamil: songData.titleTamil || song.titleTamil,
                            titleEnglish: songData.titleEnglish || song.titleEnglish || "",
                            lyrics: songData.lyricsTamil || songData.lyrics || song.lyrics,
                            originalLyrics: songData.originalLyrics || song.originalLyrics || song.lyrics || "",
                            cleanLyrics: songData.cleanLyrics || songData.lyricsTamil || song.lyrics,
                            cleanedLyrics: songData.cleanedLyrics || songData.lyricsTamil || song.lyrics,
                            lyricsEnglish: songData.lyricsEnglish || song.lyricsEnglish || "",
                            artist: songData.artist || song.artist || "",
                            album: songData.album || song.album || "",
                            author: songData.author || song.author || "",
                            composer: songData.composer || song.composer || "",
                            language: songData.language || song.language || "Tamil",
                            source: songData.source || song.source || "",
                            sourceUrl: songData.sourceUrl || song.sourceUrl || song.url || "",
                            aiStatus: songData.aiStatus || song.aiStatus || "fallback",
                            aiProvider: songData.aiProvider || song.aiProvider || "heuristic",
                            aiConfidence: songData.aiConfidence || song.aiConfidence || 0,
                            aiMetadata: songData.aiMetadata || song.aiMetadata || {},
                            themes: songData.themes || song.themes || [],
                            keywords: songData.keywords || song.keywords || [],
                            bibleReferences: songData.bibleReferences || song.bibleReferences || []
                        }, {
                            source: songData.source || song.source || "",
                            sourceUrl: songData.sourceUrl || song.sourceUrl || song.url || "",
                            category: song.category
                        });

                        song.title = payload.title;
                        song.titleTamil = payload.titleTamil;
                        song.titleEnglish = payload.titleEnglish;
                        song.lyrics = payload.lyrics;
                        song.lyricsTamil = payload.lyricsTamil;
                        song.lyricsEnglish = payload.lyricsEnglish;
                        song.originalLyrics = payload.originalLyrics;
                        song.cleanLyrics = payload.cleanLyrics;
                        song.cleanedLyrics = payload.cleanedLyrics;
                        song.artist = payload.artist;
                        song.album = payload.album;
                        song.author = payload.author;
                        song.composer = payload.composer;
                        song.language = payload.language;
                        song.keywords = payload.keywords;
                        song.themes = payload.themes;
                        song.bibleReferences = payload.bibleReferences;
                        song.searchKey = payload.searchKey;
                        song.normalizedTitle = payload.normalizedTitle;
                        song.normalizedLyrics = payload.normalizedLyrics;
                        song.slug = payload.slug || song.slug;
                        song.aiStatus = payload.aiStatus;
                        song.aiProvider = payload.aiProvider;
                        song.aiConfidence = payload.aiConfidence;
                        song.aiProcessedAt = payload.aiProcessedAt || new Date();
                        song.aiMetadata = payload.aiMetadata;
                        song.status = "completed";
                        song.isPublished = true;
                        song.failReason = "";
                        song.httpStatus = 200;
                        song.recoveredAt = new Date();
                        await song.save();

                        this.status.recovered++;
                    } catch (fetchErr) {
                        // Still failed
                        song.failReason = fetchErr.message;
                        song.httpStatus = fetchErr.status || fetchErr.response?.status || 500;
                        
                        if (this.isRecoverable(song.failReason, song.httpStatus)) {
                            const nextRetryCount = (song.retryCount || 0) + 1;
                            
                            if (nextRetryCount >= RETRY_INTERVALS_SEC.length) {
                                // Exceeded max retries -> permanent failure
                                song.status = "failed";
                                song.retryCount = nextRetryCount;
                                console.log(`[RetryService] Retry exhausted for ${song.url}, marking as permanently failed.`);
                            } else {
                                // Still recovering, backoff
                                song.status = "recovering";
                                song.retryCount = nextRetryCount;
                                const delaySeconds = RETRY_INTERVALS_SEC[nextRetryCount];
                                song.nextRetryAt = new Date(Date.now() + delaySeconds * 1000);
                            }
                        } else {
                            // Hit a permanent error during retry (e.g. now it's 404)
                            song.status = "failed";
                        }
                        
                        await song.save();
                        this.status.failed++;
                    }
                } catch (err) {
                    console.error("[RetryService] Worker error:", err);
                    this.status.failed++;
                }
            }
        });

        await Promise.all(workers);
    }

    async startRetrySelected(ids, isAuto = false) {
        if (this.isRunning) return false;
        
        this.isRunning = true;
        this.startTime = Date.now();
        
        // Only reset status if it's a manual trigger to avoid wiping it instantly from UI during auto-retries
        if (!isAuto) {
            this.status = {
                total: ids.length,
                retried: 0,
                recovered: 0,
                failed: 0,
                skipped: 0,
                durationMs: 0
            };
        } else {
            // For auto, just increment total to process
            this.status.total += ids.length;
        }

        const queue = [...ids];
        this.processQueue(queue, 5).then(() => {
            this.status.durationMs = Date.now() - this.startTime;
            this.isRunning = false;
        }).catch(err => {
            console.error("[RetryService] startRetrySelected fatal:", err);
            this.isRunning = false;
        });
        
        return true;
    }

    async startRetryAll() {
        if (this.isRunning) return false;

        const failedSongs = await Song.find({ status: { $in: ["failed", "recovering"] } }).select("_id").lean();
        const ids = failedSongs.map(s => s._id);

        if (ids.length === 0) return false;

        this.isRunning = true;
        this.startTime = Date.now();
        this.status = {
            total: ids.length,
            retried: 0,
            recovered: 0,
            failed: 0,
            skipped: 0,
            durationMs: 0
        };

        const queue = [...ids];
        
        this.processQueue(queue, 5).then(() => {
            this.status.durationMs = Date.now() - this.startTime;
            this.isRunning = false;
        }).catch(err => {
            console.error("[RetryService] startRetryAll fatal:", err);
            this.isRunning = false;
        });

        return true;
    }
}

export const retryService = new RetryService();
