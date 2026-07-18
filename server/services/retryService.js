import Song from "../models/Song.js";
import { detectProvider } from "./songSources/adapterManager.js";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class RetryService {
    constructor() {
        this.isRunning = false;
        this.status = {
            total: 0,
            retried: 0,
            recovered: 0,
            failed: 0,
            skipped: 0,
            durationMs: 0
        };
        this.startTime = 0;
    }

    isRecoverable(reason) {
        if (!reason) return true;
        const r = reason.toLowerCase();
        // Do not retry these:
        if (r.includes("duplicate") || r.includes("unsupported") || r.includes("invalid html") || r.includes("not a song page")) {
            return false;
        }
        return true;
    }

    getStatus() {
        const currentDuration = this.isRunning ? (Date.now() - this.startTime) : this.status.durationMs;
        return {
            ...this.status,
            isRunning: this.isRunning,
            durationMs: currentDuration
        };
    }

    async processQueue(queue, concurrency = 5) {
        const workers = Array(concurrency).fill(null).map(async () => {
            while (queue.length > 0) {
                const songId = queue.pop();
                try {
                    const song = await Song.findById(songId);
                    if (!song || song.status !== "failed") {
                        this.status.skipped++;
                        continue;
                    }

                    if (!this.isRecoverable(song.failReason)) {
                        this.status.skipped++;
                        continue;
                    }

                    const providerInfo = detectProvider(song.url || song.sourceUrl);
                    if (!providerInfo || !providerInfo.provider.fetchSong) {
                        this.status.skipped++;
                        continue;
                    }

                    this.status.retried++;

                    try {
                        const songData = await providerInfo.provider.fetchSong(song.url || song.sourceUrl);
                        
                        // Successfully fetched, update the record
                        song.title = songData.titleTamil || songData.titleEnglish || songData.title;
                        song.titleTamil = songData.titleTamil;
                        song.titleEnglish = songData.titleEnglish;
                        song.lyrics = songData.lyricsTamil;
                        song.lyricsTamil = songData.lyricsTamil;
                        song.lyricsEnglish = songData.lyricsEnglish;
                        song.artist = songData.artist || song.artist || "";
                        song.album = songData.album || song.album || "";
                        song.status = "completed";
                        song.isPublished = true;
                        song.failReason = "";
                        song.httpStatus = 200;
                        await song.save();

                        this.status.recovered++;
                    } catch (fetchErr) {
                        // Still failed
                        song.failReason = fetchErr.message;
                        song.httpStatus = fetchErr.status || 500;
                        await song.save();
                        this.status.failed++;
                    }
                } catch (err) {
                    console.error("[RetryService] Worker error:", err);
                    this.status.failed++;
                }
            }
        });

        await Promise.all(workers);
    }

    async startRetrySelected(ids) {
        if (this.isRunning) return false;
        
        this.isRunning = true;
        this.startTime = Date.now();
        this.status = {
            total: ids.length,
            retried: 0,
            recovered: 0,
            failed: 0,
            skipped: 0,
            durationMs: 0
        };

        const queue = [...ids];
        this.processQueue(queue, 5).then(() => {
            this.status.durationMs = Date.now() - this.startTime;
            this.isRunning = false;
        }).catch(err => {
            console.error("[RetryService] startRetrySelected fatal:", err);
            this.isRunning = false;
        });
        
        return true;
    }

    async startRetryAll() {
        if (this.isRunning) return false;

        const failedSongs = await Song.find({ status: "failed" }).select("_id").lean();
        const ids = failedSongs.map(s => s._id);

        if (ids.length === 0) return false;

        this.isRunning = true;
        this.startTime = Date.now();
        this.status = {
            total: ids.length,
            retried: 0,
            recovered: 0,
            failed: 0,
            skipped: 0,
            durationMs: 0
        };

        const queue = [...ids];
        
        this.processQueue(queue, 5).then(() => {
            this.status.durationMs = Date.now() - this.startTime;
            this.isRunning = false;
        }).catch(err => {
            console.error("[RetryService] startRetryAll fatal:", err);
            this.isRunning = false;
        });

        return true;
    }
}

export const retryService = new RetryService();
