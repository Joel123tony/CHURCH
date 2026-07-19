import { BaseWorker } from "./BaseWorker.js";
import { QueueManager } from "../utils/queueManager.js";
import Song from "../models/Song.js";
import axios from "axios";
import { searchOnlineSources, detectProvider } from "../services/songSources/adapterManager.js";

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

        console.log(`[ImportWorker] Fetching raw HTML for: ${song.title} (${url})`);

        let html = "";
        let finalUrl = url;

        try {
            // Check if primary URL is a special provider like YouTube
            const providerInfo = detectProvider(finalUrl);
            if (providerInfo && providerInfo.name === "YouTube") {
                html = await providerInfo.provider.fetchSong(finalUrl);
                if (!html) throw new Error("YouTube fetchSong returned null");
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
            const fallbackResult = await searchOnlineSources(song.title);
            if (fallbackResult && fallbackResult.sourceUrl && fallbackResult.sourceUrl !== finalUrl) {
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
                
                if (!html) throw new Error("Fallback fetch returned empty content");
                
                // Update song with new source
                song.sourceUrl = finalUrl;
                song.url = finalUrl;
                song.source = fallbackResult.source || "Fallback Search";
                await song.save();
            } else {
                // If NO fallback is found, flag as pending lyrics so it can be retried later
                console.warn(`[ImportWorker] No sources found for "${song.title}". Moving to Pending Lyrics queue.`);
                song.isPendingLyrics = true;
                song.lyricsStatus = "pending";
                await song.save();
                
                // We do not throw an error here, because we've handled it by setting isPendingLyrics.
                // We just return early and consider this job "completed" in terms of its queue lifecycle.
                return;
            }
        }

        // Queue for AI Cleaning
        await QueueManager.addJob("ai_cleaning", {
            html,
            url: finalUrl
        }, song._id);

        console.log(`[ImportWorker] Fetched content and queued for AI cleaning: ${song.title}`);
    }
}
