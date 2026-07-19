import { BaseWorker } from "./BaseWorker.js";
import { QueueManager } from "../utils/queueManager.js";
import Song from "../models/Song.js";
import crypto from "crypto";
import * as cheerio from "cheerio";
import { cleanLyricsWithAI } from "../services/aiLyricsCleaner.js";

export class AiCleaningWorker extends BaseWorker {
    constructor() {
        super("ai_cleaning", 5000); 
    }

    async processJob(job) {
        const { html, url } = job.payload;
        const songId = job.songId;

        const song = await Song.findById(songId);
        if (!song) {
            throw new Error(`Song metadata not found for ID: ${songId}`);
        }

        let rawText = "";
        let isYouTube = false;
        let youtubeMetadata = null;

        try {
            const parsed = JSON.parse(html);
            if (parsed.isYouTubeSource) {
                isYouTube = true;
                rawText = html; // Pass the JSON string straight to AI
                youtubeMetadata = parsed.metadata;
            }
        } catch (e) {
            // Not JSON, parse as HTML
        }

        if (!isYouTube) {
            // Fast extraction of main content area to feed AI
            const $ = cheerio.load(html);
            const contentArea = $('.post-inner, .entry-content, .post-content, article, .td-post-content, .site-main, main, #contents').first();
            
            if (contentArea.length) {
                contentArea.find('.sharedaddy, .yarpp-related, #comments, .nav-links, header, footer, style, script, iframe, nav').remove();
                let rawHtml = contentArea.html() || "";
                rawHtml = rawHtml.replace(/<\/(p|div|h[1-6]|li|ul|ol|table)>/gi, '\n').replace(/<br\s*[\/]?>/gi, '\n');
                rawText = cheerio.load(rawHtml).text();
            } else {
                rawText = $.text();
            }
        }

        console.log(`[AiCleaningWorker] Invoking AI for: ${song.title}`);
        
        const aiResult = await cleanLyricsWithAI(rawText);

        if (aiResult.valid === false) {
            throw new Error(`Hard Reject: AI Rejected Import: ${aiResult.reason || "Archive Page"}`);
        }

        if (aiResult.multiSong && aiResult.songs && aiResult.songs.length > 0) {
            console.log(`[AiCleaningWorker] Multi-song detected! Splitting into ${aiResult.songs.length} independent jobs.`);
            
            for (let i = 0; i < aiResult.songs.length; i++) {
                const s = aiResult.songs[i];
                // Create a separate Song record for each
                const splitSong = new Song({
                    uuid: crypto.randomUUID(),
                    title: s.title || `Split Song ${i + 1}`,
                    titleTamil: s.title || `Split Song ${i + 1}`,
                    artist: song.artist,
                    source: song.source,
                    sourceUrl: url,
                    url: `${url}#split-${i}`,
                    category: song.category,
                    lyricsStatus: "pending",
                    status: "processing"
                });
                await splitSong.save();

                // Queue each split song for validation immediately
                // Construct a mock aiResult for validation
                const splitAiResult = {
                    valid: true,
                    multiSong: false,
                    title: s.title,
                    lyrics: s.lyrics,
                    language: s.language || "ta",
                    containsRelatedSongs: aiResult.containsRelatedSongs || false,
                    containsSeo: aiResult.containsSeo || false,
                    containsNavigation: aiResult.containsNavigation || false,
                    containsChords: aiResult.containsChords || false,
                    containsMetadata: aiResult.containsMetadata || false
                };

                await QueueManager.addJob("validation", {
                    aiResult: splitAiResult,
                    url
                }, splitSong._id);
            }

            // Since the original job was just an archive container, we can quarantine the parent
            throw new Error("Hard Reject: Multi-Song Archive Page. Split successfully.");
        }

        // Single Song processing
        // Queue for validation
        await QueueManager.addJob("validation", {
            aiResult,
            url,
            metadata: youtubeMetadata
        }, song._id);

        console.log(`[AiCleaningWorker] AI completed successfully, queued for validation: ${song.title}`);
    }
}
