import { BaseWorker } from "./BaseWorker.js";
import { QueueManager } from "../utils/queueManager.js";
import Song from "../models/Song.js";
import axios from "axios";
import { searchOnlineSources, searchOnlineSourcesAcrossProviders, detectProvider } from "../services/songSources/adapterManager.js";

export class ImportWorker extends BaseWorker {
    constructor() {
        super("import", 5000); 
    }

    async processJob(job) {
        const { url } = job.payload;
        const songId = job.songId;

        const song = await Song.findById(songId);
        if (!song) {
            throw new Error(`Song metadata not found for ID: ${songId}`);
        }

        song.status = "processing";
        await song.save();

        console.log(`[ImportWorker] Fetching raw HTML for: ${song.title} (${url})`);

        let html = "";
        let finalUrl = url;

        try {
            // Check if primary URL is a special provider like YouTube
            const providerInfo = detectProvider(finalUrl);
            if (providerInfo && providerInfo.name === "YouTube") {
                html = await providerInfo.provider.fetchSong(finalUrl);
                if (!html) throw new Error("YouTube fetchSong returned null", { cause: new Error(`Provider returned empty content for ${finalUrl}`) });
            } else {
                const response = await axios.get(finalUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                    timeout: 15000
                });
                html = response.data;
            }
        } catch (err) {
            console.error(`[ImportWorker] Primary URL failed (${finalUrl}): ${err.message}`);
            console.log(`[ImportWorker] Attempting multi-source fallback for: ${song.title}`);
            
            // Fallback: search other providers for the same title
            const fallbackCandidates = await searchOnlineSourcesAcrossProviders(song.title, 3);
            const fallbackResult = fallbackCandidates[0] || await searchOnlineSources(song.title);
            if (fallbackCandidates.length > 0 || (fallbackResult && fallbackResult.sourceUrl && fallbackResult.sourceUrl !== finalUrl)) {
                if (fallbackCandidates.length > 0) {
                    const mergedText = fallbackCandidates
                        .map((candidate) => candidate.lyricsTamil || candidate.cleanedLyrics || candidate.lyrics || "")
                        .filter(Boolean)
                        .join("\n\n");
                    html = JSON.stringify({
                        isAiMergedSource: true,
                        rawText: mergedText,
                        candidates: fallbackCandidates,
                        metadata: {
                            title: song.title,
                            titleTamil: song.titleTamil,
                            titleEnglish: song.titleEnglish,
                            source: fallbackCandidates[0]?.source || "Fallback Search",
                            sourceUrl: fallbackCandidates[0]?.sourceUrl || finalUrl
                        }
                    });
                    finalUrl = fallbackCandidates[0]?.sourceUrl || finalUrl;
                } else if (fallbackResult) {
                    console.log(`[ImportWorker] Found fallback URL: ${fallbackResult.sourceUrl}`);
                    finalUrl = fallbackResult.sourceUrl;
                    
                    const fallbackProvider = detectProvider(finalUrl);
                    if (fallbackProvider && fallbackProvider.name === "YouTube") {
                        html = await fallbackProvider.provider.fetchSong(finalUrl);
                    } else {
                        const fbResponse = await axios.get(finalUrl, {
                            headers: { 'User-Agent': 'Mozilla/5.0' },
                            timeout: 15000
                        });
                        html = fbResponse.data;
                    }
                    
                    if (!html) throw new Error("Fallback fetch returned empty content", { cause: err });
                }
                
                // Update song with new source
                song.sourceUrl = finalUrl;
                song.url = finalUrl;
                song.source = fallbackCandidates[0]?.source || fallbackResult?.source || "Fallback Search";
                song.providerHistory = [
                    ...(song.providerHistory || []),
                    ...fallbackCandidates.map((candidate) => ({
                        source: candidate.source || candidate.provider || "Fallback Search",
                        url: candidate.sourceUrl || candidate.url || finalUrl,
                        status: "candidate",
                        checkedAt: new Date()
                    }))
                ];
                await song.save();
            } else {
                // If NO fallback is found, check retries
                console.warn(`[ImportWorker] No sources found for "${song.title}".`);
                const maxRetries = 5;
                if ((song.retryCount || 0) >= maxRetries) {
                    console.error(`[ImportWorker] Max retries reached for "${song.title}". Marking as unavailable.`);
                    song.lyricsStatus = "unavailable";
                    song.isPendingLyrics = false;
                    song.lyricsTamil = "unavailable";
                    song.lyrics = "unavailable";
                    song.status = "completed";
                } else {
                    console.warn(`[ImportWorker] Moving to Pending Lyrics queue for future retry.`);
                    song.isPendingLyrics = true;
                    song.lyricsStatus = "pending";
                }
                
                await song.save();
                
                // We do not throw an error here, because we've handled it.
                // We just return early and consider this job "completed" in terms of its queue lifecycle.
                return;
            }
        }

        // Queue for AI Cleaning
        await QueueManager.addJob("ai_cleaning", {
            html,
            url: finalUrl,
            source: song.source,
            category: song.category,
            title: song.title,
            titleTamil: song.titleTamil,
            titleEnglish: song.titleEnglish
        }, song._id);

        console.log(`[ImportWorker] Fetched content and queued for AI cleaning: ${song.title}`);
    }
}
