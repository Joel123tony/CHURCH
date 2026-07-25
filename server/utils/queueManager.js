import JobQueue from "../models/JobQueue.js";

const LOCK_TIME_MS = 5 * 60 * 1000; // 5 minutes

export const QueueManager = {
    /**
     * Enqueue a new job
     */
    addJob: async (type, payload, songId = null) => {
        const job = new JobQueue({
            type,
            payload,
            songId,
            status: "pending",
            nextRunAt: Date.now()
        });
        await job.save();
        return job;
    },

    /**
     * Fetch the next available job for a specific worker type
     */
    getNextJob: async (type) => {
        const now = new Date();
        const job = await JobQueue.findOneAndUpdate(
            {
                type,
                status: { $in: ["pending", "processing"] },
                nextRunAt: { $lte: now },
                $or: [
                    { lockedUntil: null },
                    { lockedUntil: { $lte: now } }
                ]
            },
            {
                $set: {
                    status: "processing",
                    lockedUntil: new Date(now.getTime() + LOCK_TIME_MS)
                }
            },
            { sort: { nextRunAt: 1 }, returnDocument: 'after' }
        );
        return job;
    },

    /**
     * Mark a job as completed
     */
    completeJob: async (jobId) => {
        await JobQueue.findByIdAndUpdate(jobId, {
            status: "completed",
            lockedUntil: null
        });
    },

    /**
     * Mark a job as failed, automatically triggering retry logic
     */
    failJob: async (jobId, errorMsg, isRecoverable = true) => {
        const job = await JobQueue.findById(jobId);
        if (!job) return;

        // Auto-detect permanent failures from error message
        const lowerError = (errorMsg || "").toLowerCase();
        if (
            lowerError.includes("404") || 
            lowerError.includes("410") || 
            lowerError.includes("malformed") || 
            lowerError.includes("deleted") ||
            lowerError.includes("hard reject")
        ) {
            isRecoverable = false;
        }

        job.attempts += 1;
        job.lastError = errorMsg;
        job.lockedUntil = null;

        if (!isRecoverable || job.attempts >= job.maxAttempts) {
            job.status = "quarantined";
        } else {
            job.status = "pending";
            // Smart Retry logic (exponential backoff)
            const delays = [1, 5, 15, 60, 360, 1440, 4320, 10080]; // in minutes
            const delayMinutes = delays[Math.min(job.attempts - 1, delays.length - 1)];
            job.nextRunAt = new Date(Date.now() + delayMinutes * 60 * 1000);
        }

        await job.save();
    },

    /**
     * Move a job directly to quarantine
     */
    quarantineJob: async (jobId, reason) => {
        await JobQueue.findByIdAndUpdate(jobId, {
            status: "quarantined",
            lastError: reason,
            lockedUntil: null
        });
    }
};
