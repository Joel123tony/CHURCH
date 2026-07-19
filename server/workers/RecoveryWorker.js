import { BaseWorker } from "./BaseWorker.js";
import JobQueue from "../models/JobQueue.js";
import Song from "../models/Song.js";

export class RecoveryWorker extends BaseWorker {
    constructor() {
        super("recovery", 15000); 
    }

    async processJob(job) {
        // Recovery Worker scans for failed songs and requeues them if lyrics are pending
        // but it doesn't process standard queue items.
        // Wait, the Smart Retry system is actually built into QueueManager.failJob() 
        // which automatically updates nextRunAt based on exponential backoff.
        // The QueueManager.getNextJob() automatically picks them up when nextRunAt <= now!
        
        // This recovery worker specifically scans for songs marked "pending" lyrics 
        // that have fallen out of the queue entirely, pushing them back into discovery or import.
        
        console.log(`[RecoveryWorker] Scanning for stranded pending songs...`);

        const strandedSongs = await Song.find({
            lyricsStatus: "pending",
            status: "pending",
            retryCount: { $lt: 5 } // Arbitrary cap for now
        }).limit(50);

        for (const song of strandedSongs) {
            // Check if it has a pending job in JobQueue
            const existingJob = await JobQueue.findOne({
                songId: song._id,
                status: { $in: ["pending", "processing"] }
            });

            if (!existingJob) {
                console.log(`[RecoveryWorker] Requeuing stranded song: ${song.title}`);
                const { QueueManager } = await import("../utils/queueManager.js");
                await QueueManager.addJob("import", {
                    url: song.sourceUrl || song.url
                }, song._id);
                song.retryCount += 1;
                await song.save();
            }
        }
    }
}
