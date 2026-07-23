import { BaseWorker } from "./BaseWorker.js";
import JobQueue from "../models/JobQueue.js";
import Song from "../models/Song.js";

export class RecoveryWorker extends BaseWorker {
    constructor() {
        super("recovery", 15000); 
    }

    async processJob(job) {
        console.log(`[RecoveryWorker] Scanning for stranded pending songs...`);

        const query = job.songId
            ? { _id: job.songId }
            : {
                $or: [
                    { lyricsStatus: "pending" },
                    { lyricsStatus: "pending_fetch" },
                    { isPendingLyrics: true }
                ]
            };

        const strandedSongs = await Song.find(query).limit(job.songId ? 1 : 50);
        const now = Date.now();

        for (const song of strandedSongs) {
            if ((song.retryCount || 0) >= 5) {
                console.error(`[RecoveryWorker] Permanently failing song: ${song.title} after 5 retries.`);
                song.lyricsStatus = "unavailable";
                song.isPendingLyrics = false;
                song.lyricsTamil = "unavailable";
                song.lyrics = "unavailable";
                song.status = "completed";
                await song.save();
                continue;
            }

            // Exponential backoff: retryCount^2 * 5 minutes
            const backoffMs = Math.pow(song.retryCount || 0, 2) * 5 * 60 * 1000;
            const timeSinceLastUpdate = now - new Date(song.updatedAt).getTime();
            
            if (timeSinceLastUpdate < backoffMs && !job.songId) {
                continue; // Skip this song until backoff expires
            }

            // Check if it has a pending job in JobQueue
            const existingJob = await JobQueue.findOne({
                songId: song._id,
                status: { $in: ["pending", "processing"] }
            });

            if (!existingJob) {
                console.log(`[RecoveryWorker] Requeuing stranded song: ${song.title} (Retry ${song.retryCount || 0})`);
                const { QueueManager } = await import("../utils/queueManager.js");
                await QueueManager.addJob("import", {
                    url: song.sourceUrl || song.url,
                    recoveryReason: job.payload?.reason || "AI recovery"
                }, song._id);
                song.retryCount = (song.retryCount || 0) + 1;
                await song.save();
            }
        }
    }
}
