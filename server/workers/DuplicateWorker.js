import { BaseWorker } from "./BaseWorker.js";
import { QueueManager } from "../utils/queueManager.js";
import Song from "../models/Song.js";

export class DuplicateWorker extends BaseWorker {
    constructor() {
        super("duplicate_detection", 10000); 
    }

    async processJob(job) {
        const songId = job.songId;

        const song = await Song.findById(songId);
        if (!song) {
            throw new Error(`Song metadata not found for ID: ${songId}`);
        }

        console.log(`[DuplicateWorker] Checking duplicates for: ${song.title}`);

        // Advanced duplicate detection using AI canonical signals
        let possibleDupe = await Song.findOne({
            _id: { $ne: song._id },
            $or: [
                { canonicalHash: song.canonicalHash },
                { normalizedTitle: song.normalizedTitle }
            ],
            duplicateOf: null,
            status: "completed"
        });

        if (!possibleDupe) {
            // Fuzzy matching using title similarity, alternate spellings, and transliterations
            const stringSimilarity = (await import('string-similarity')).default || (await import('string-similarity'));
            const candidates = await Song.find({
                _id: { $ne: song._id },
                duplicateOf: null,
                status: "completed"
            }).select("title titleEnglish titleTamil");

            const songTitle = (song.titleEnglish || song.title || "").toLowerCase();
            
            if (songTitle && candidates.length > 0) {
                let bestMatch = null;
                let highestScore = 0;

                for (const candidate of candidates) {
                    const cTitle = (candidate.titleEnglish || candidate.title || "").toLowerCase();
                    if (!cTitle) continue;
                    
                    const score = stringSimilarity.compareTwoStrings(songTitle, cTitle);
                    if (score > highestScore) {
                        highestScore = score;
                        bestMatch = candidate;
                    }
                }

                if (highestScore > 0.85) {
                    console.log(`[DuplicateWorker] Fuzzy match found: ${songTitle} == ${bestMatch.titleEnglish || bestMatch.title} (${highestScore})`);
                    possibleDupe = await Song.findById(bestMatch._id);
                }
            }
        }

        if (possibleDupe) {
            console.log(`[DuplicateWorker] Found duplicate! Merging ${song.title} under ${possibleDupe._id}`);
            song.duplicateOf = possibleDupe._id;
            // Transfer metadata if missing on primary
            if (!possibleDupe.youtubeUrl && song.youtubeUrl) possibleDupe.youtubeUrl = song.youtubeUrl;
            if (!possibleDupe.sourceUrl && song.sourceUrl) possibleDupe.sourceUrl = song.sourceUrl;
            
            // Push provider history
            if (song.providerHistory && song.providerHistory.length > 0) {
                possibleDupe.providerHistory = [...(possibleDupe.providerHistory || []), ...song.providerHistory];
            }
            
            await possibleDupe.save();
        }

        song.status = "completed"; // Final successful state
        await song.save();

        // Queue for indexing
        await QueueManager.addJob("indexing", {}, song._id);
        console.log(`[DuplicateWorker] Duplicate check complete for: ${song.title}`);
    }
}
