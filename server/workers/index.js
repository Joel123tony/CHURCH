import { DiscoveryWorker } from "./DiscoveryWorker.js";
import { ImportWorker } from "./ImportWorker.js";
import { AiCleaningWorker } from "./AiCleaningWorker.js";
import { ValidationWorker } from "./ValidationWorker.js";
import { DuplicateWorker } from "./DuplicateWorker.js";
import { RecoveryWorker } from "./RecoveryWorker.js";
import { IndexWorker } from "./IndexWorker.js";
import { ModerationWorker } from "./ModerationWorker.js";
import { ProviderHealthProbeWorker } from "./ProviderHealthProbeWorker.js";
import Song from "../models/Song.js";

const repairStuckSongs = async () => {
    try {
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
        const result = await Song.updateMany(
            {
                $or: [
                    { lyricsStatus: "pending" },
                    { status: "processing" }
                ],
                updatedAt: { $lte: fifteenMinsAgo }
            },
            {
                $set: { 
                    lyricsStatus: "failed", 
                    status: "failed",
                    isPendingLyrics: false
                }
            }
        );
        if (result.modifiedCount > 0) {
            console.log(`[WorkerManager] Repaired ${result.modifiedCount} stuck songs (marked as failed).`);
        }
    } catch (err) {
        console.error(`[WorkerManager] Error repairing stuck songs:`, err);
    }
};

const recleanDirtySongs = async () => {
    try {
        const dirtySongs = await Song.find({
            $or: [
                { lyrics: { $regex: /<[^>]+>/ } },
                { lyrics: { $regex: /see more|related songs|leave a reply|new collections/i } }
            ],
            status: "completed",
            sourceUrl: { $exists: true, $ne: "" }
        });

        if (dirtySongs.length > 0) {
            console.log(`[WorkerManager] Found ${dirtySongs.length} dirty songs. Queuing for fresh import and re-cleaning...`);
            const { QueueManager } = await import("../utils/queueManager.js");
            
            for (const song of dirtySongs) {
                song.status = "processing";
                song.lyricsStatus = "pending";
                song.isPendingLyrics = true;
                song.retryCount = 0;
                await song.save();
                
                await QueueManager.addJob("import", {
                    url: song.sourceUrl || song.url,
                    source: song.source,
                    metadata: {
                        title: song.title,
                        titleTamil: song.titleTamil,
                        category: song.category
                    }
                }, song._id);
            }
        }
    } catch (err) {
        console.error(`[WorkerManager] Error re-cleaning dirty songs:`, err);
    }
};

const workers = [
    new DiscoveryWorker(),
    new ImportWorker(),
    new AiCleaningWorker(),
    new ValidationWorker(),
    new DuplicateWorker(),
    new RecoveryWorker(),
    new IndexWorker(),
    new ModerationWorker(),
    new ProviderHealthProbeWorker()
];

let heartbeatMonitor = null;

export const startWorkers = () => {
    console.log("[WorkerManager] Starting all background workers...");
    
    // Repair historically stuck songs
    repairStuckSongs();
    
    // Re-clean existing dirty songs
    recleanDirtySongs();
    
    for (const worker of workers) {
        worker.start();
    }

    if (!heartbeatMonitor) {
        heartbeatMonitor = setInterval(() => {
            const now = Date.now();
            for (const worker of workers) {
                // If a worker hasn't reported a heartbeat in 3x its interval (minimum 30s), restart it
                const threshold = Math.max(worker.intervalMs * 3, 30000);
                if (now - worker.lastHeartbeat > threshold) {
                    console.warn(`[WorkerManager] Worker ${worker.workerType} appears frozen. Auto-restarting...`);
                    worker.stop();
                    setTimeout(() => worker.start(), 1000);
                }
            }
        }, 15000); // Check every 15s
    }
};

export const stopWorkers = () => {
    console.log("[WorkerManager] Stopping all background workers...");
    for (const worker of workers) {
        worker.stop();
    }
    if (heartbeatMonitor) {
        clearInterval(heartbeatMonitor);
        heartbeatMonitor = null;
    }
};

export const getWorkerStats = () => {
    return workers.map(w => ({
        type: w.workerType,
        status: w.status,
        lastHeartbeat: w.lastHeartbeat,
        interval: w.intervalMs
    }));
};
