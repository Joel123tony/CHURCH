import cron from 'node-cron';
import { providers } from '../services/songSources/adapterManager.js';
import Song from '../models/Song.js';

export const initSchedulers = () => {
    // Daily Discovery (2 AM)
    cron.schedule('0 2 * * *', async () => {
        console.log("[Scheduler] Running Daily Discovery...");
        for (const { name, provider } of providers) {
            try {
                if (!provider.discoverLatest) continue;
                const urls = await provider.discoverLatest();
                for (const url of urls) {
                    const exists = await Song.findOne({ url });
                    if (!exists) {
                        console.log(`[Scheduler] Discovered new URL from ${name}: ${url}`);
                        // The actual fetching/importing logic would be queued to a background worker here.
                        // We will just fetch it directly for now if it supports fetchSong
                        if (provider.fetchSong) {
                            const songData = await provider.fetchSong(url);
                            if (songData) {
                                await Song.create({
                                    title: songData.titleTamil || songData.titleEnglish,
                                    titleTamil: songData.titleTamil,
                                    titleEnglish: songData.titleEnglish,
                                    lyrics: songData.lyricsTamil,
                                    lyricsTamil: songData.lyricsTamil,
                                    lyricsEnglish: songData.lyricsEnglish,
                                    category: "Tamil Christian Songs",
                                    source: songData.source,
                                    url: songData.sourceUrl,
                                    sourceUrl: songData.sourceUrl,
                                });
                                console.log(`[Scheduler] Imported new song: ${songData.titleTamil}`);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error(`[Scheduler] Error discovering on ${name}:`, err.message);
            }
        }
    });

    // Monthly Cleanup (4 AM on the 1st)
    cron.schedule('0 4 1 * *', async () => {
        console.log("[Scheduler] Running Monthly Cleanup...");
        try {
            // Remove songs with empty lyrics
            const result = await Song.deleteMany({ $or: [{ lyrics: { $exists: false } }, { lyrics: "" }] });
            console.log(`[Scheduler] Deleted ${result.deletedCount} empty songs.`);
        } catch (err) {
            console.error("[Scheduler] Error in cleanup:", err.message);
        }
    });

    console.log("[Scheduler] Cron jobs initialized successfully.");
};
