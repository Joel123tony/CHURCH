import { BaseWorker } from "./BaseWorker.js";
import { QueueManager } from "../utils/queueManager.js";
import Song from "../models/Song.js";
import { isMissingTitle } from "../utils/lyricsExtractor.js";

export class ValidationWorker extends BaseWorker {
    constructor() {
        super("validation", 5000); 
    }

    async processJob(job) {
        const { aiResult, url } = job.payload;
        const songId = job.songId;

        const song = await Song.findById(songId);
        if (!song) {
            throw new Error(`Song metadata not found for ID: ${songId}`);
        }

        console.log(`[ValidationWorker] Validating AI output for: ${song.title}`);

        const cleanTitle = aiResult.title || song.title;
        const cleanLyrics = (aiResult.lyrics || "").trim();

        // Calculate Quality Score
        let score = 100;
        if (aiResult.containsSeo) score -= 30;
        if (aiResult.containsRelatedSongs) score -= 30;
        if (aiResult.containsMetadata) score -= 20;
        if (aiResult.containsChords) score -= 20;

        const lowerLyrics = cleanLyrics.toLowerCase();
        if (lowerLyrics.includes("trending")) score -= 30;
        if (lowerLyrics.includes("god medias") || lowerLyrics.includes("tamil christians songs")) score -= 30;

        let rejectionReason = null;

        // Hard Rejections
        if (aiResult.containsRelatedSongs) rejectionReason = "Contains Related Songs";
        if (aiResult.containsSeo) rejectionReason = "Contains SEO";
        if (aiResult.containsMetadata) rejectionReason = "Contains Metadata";
        if (isMissingTitle(cleanTitle)) rejectionReason = "Invalid Title";
        if (cleanTitle.length < 2) rejectionReason = "Title too short";
        
        const invalidTitles = [
            "unknown title", "untitled", "home", "lyrics", "tamil christian songs", "wordpress", 
            "archive", "category", "search"
        ];
        if (invalidTitles.some(t => cleanTitle.toLowerCase().includes(t))) {
            rejectionReason = `Invalid Title keyword found: ${cleanTitle}`;
        }
        
        const lyricsLines = cleanLyrics.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lyricsLines.length < 2) rejectionReason = "Lyrics too short (< 2 lines)";
        if (cleanLyrics.length < 50) rejectionReason = "Lyrics too short (< 50 chars)";
        if (aiResult.confidenceScore && aiResult.confidenceScore < 80) rejectionReason = `Low confidence score (${aiResult.confidenceScore})`;

        // The user requested minimum 95 for the new architecture
        if (score < 95) {
            rejectionReason = `Lyrics Quality Score too low (${score}/100)`;
        }

        if (rejectionReason) {
            if (aiResult.extractedFrom === "description" || aiResult.extractedFrom === "captions" || song.sourceUrl?.includes("youtube.com")) {
                console.warn(`[ValidationWorker] YouTube extraction failed validation (${rejectionReason}). Moving to Pending Lyrics.`);
                song.isPendingLyrics = true;
                song.lyricsStatus = "pending";
                await song.save();
                return; // Gracefully complete the job since we handled the fallback state
            } else {
                throw new Error(`Hard Reject: ${rejectionReason}`);
            }
        }

        // Pass validation! Update the song
        song.lyrics = cleanLyrics;
        song.lyricsTamil = cleanLyrics;
        
        // Save youtube metadata if present in payload
        if (job.payload.metadata) {
            song.youtubeMetadata = { ...job.payload.metadata, confidenceScore: aiResult.confidenceScore, extractedFrom: aiResult.extractedFrom };
        }
        if (cleanTitle && cleanTitle !== song.title) {
            song.titleTamil = cleanTitle;
        }
        song.qualityScore = score;
        song.lyricsStatus = "found";
        
        await song.save();
        console.log(`[ValidationWorker] Validated and saved lyrics for: ${song.title}`);

        // Queue for Duplicate Detection
        await QueueManager.addJob("duplicate_detection", {
            url
        }, song._id);
    }
}
