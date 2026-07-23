import { BaseWorker } from "./BaseWorker.js";
import Song from "../models/Song.js";
import { approveSongRevision, rejectSongRevision, queueSongForReview, recordSongCorrection } from "../services/reviewWorkflow.js";

export class ModerationWorker extends BaseWorker {
    constructor() {
        super("moderation", 10000);
    }

    async processJob(job) {
        const songId = job.songId;
        const song = await Song.findById(songId);
        if (!song) {
            throw new Error(`Song metadata not found for ID: ${songId}`);
        }

        const action = job.payload?.action || "queue";
        const actor = job.payload?.actor || "system";
        const notes = Array.isArray(job.payload?.notes) ? job.payload.notes : [job.payload?.reason || ""].filter(Boolean);

        if (action === "approve") {
            await approveSongRevision(songId, { actor, notes });
        } else if (action === "reject") {
            await rejectSongRevision(songId, { actor, notes });
        } else if (action === "correct") {
            await recordSongCorrection(songId, { actor, notes, before: job.payload?.before || {}, after: job.payload?.after || {} });
        } else {
            await queueSongForReview(songId, {
                actor,
                reason: job.payload?.reason || "Moderation review required",
                notes
            });
        }
    }
}
