import { QueueManager } from "../utils/queueManager.js";

export class BaseWorker {
    constructor(workerType, intervalMs = 5000) {
        this.workerType = workerType;
        this.intervalMs = intervalMs;
        this.isRunning = false;
        this.timer = null;
        this.lastHeartbeat = Date.now();
        this.status = "Idle";
    }

    async processJob(job) {
        throw new Error("processJob() must be implemented by subclass");
    }

    async poll() {
        if (!this.isRunning) return;
        this.lastHeartbeat = Date.now();

        try {
            const job = await QueueManager.getNextJob(this.workerType);
            if (job) {
                this.status = "Busy";
                console.log(`[${this.workerType}] Picked up job ${job._id}`);
                try {
                    await this.processJob(job);
                    await QueueManager.completeJob(job._id);
                    console.log(`[${this.workerType}] Completed job ${job._id}`);
                } catch (err) {
                    console.error(`[${this.workerType}] Failed job ${job._id}:`, err.message);
                    
                    const isHardReject = err.message.includes("Hard Reject") || err.message.includes("Archive");
                    
                    if (isHardReject) {
                        await QueueManager.quarantineJob(job._id, err.message);
                    } else {
                        // Pass to Smart Retry logic
                        await QueueManager.failJob(job._id, err.message, true);
                    }
                }
                
                this.status = "Idle";
                // Immediately poll again if a job was found (drain queue fast)
                setTimeout(() => this.poll(), 0);
                return;
            }
        } catch (err) {
            this.status = "Failed";
            console.error(`[${this.workerType}] Polling error:`, err.message);
        }

        // If no job was found, wait the interval before polling again
        if (this.isRunning) {
            this.timer = setTimeout(() => this.poll(), this.intervalMs);
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.status = "Idle";
        this.lastHeartbeat = Date.now();
        console.log(`[${this.workerType}] Worker started...`);
        this.poll();
    }

    stop() {
        this.isRunning = false;
        this.status = "Stopped";
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        console.log(`[${this.workerType}] Worker stopped.`);
    }
}
