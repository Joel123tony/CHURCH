import { DiscoveryWorker } from "./DiscoveryWorker.js";
import { ImportWorker } from "./ImportWorker.js";
import { AiCleaningWorker } from "./AiCleaningWorker.js";
import { ValidationWorker } from "./ValidationWorker.js";
import { DuplicateWorker } from "./DuplicateWorker.js";
import { RecoveryWorker } from "./RecoveryWorker.js";
import { IndexWorker } from "./IndexWorker.js";

const workers = [
    new DiscoveryWorker(),
    new ImportWorker(),
    new AiCleaningWorker(),
    new ValidationWorker(),
    new DuplicateWorker(),
    new RecoveryWorker(),
    new IndexWorker()
];

let heartbeatMonitor = null;

export const startWorkers = () => {
    console.log("[WorkerManager] Starting all background workers...");
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
