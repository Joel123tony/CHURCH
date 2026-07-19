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

        // Simple duplicate detection for now: Check exact title match 
        // (Excluding the current song itself and already marked duplicates)
        const possibleDupe = await Song.findOne({
            _id: { $ne: song._id },
            title: song.title,
            duplicateOf: null
        });

        if (possibleDupe) {
            console.log(`[DuplicateWorker] Found duplicate! Merging ${song.title} under ${possibleDupe._id}`);
            song.duplicateOf = possibleDupe._id;
            // Transfer metadata if missing on primary
            if (!possibleDupe.youtubeUrl && song.youtubeUrl) {
                possibleDupe.youtubeUrl = song.youtubeUrl;
                await possibleDupe.save();
            }
        }

        song.status = "completed"; // Final successful state
        await song.save();

        // Queue for indexing
        await QueueManager.addJob("indexing", {}, song._id);
        console.log(`[DuplicateWorker] Duplicate check complete for: ${song.title}`);
    }
}
