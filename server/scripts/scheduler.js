import cron from 'node-cron';
import { providers } from '../services/songSources/adapterManager.js';
import Song from '../models/Song.js';
import { runTrendingDiscovery } from '../services/youtubeDiscovery.js';
import { runLyricsRecovery } from '../services/lyricsRecovery.js';
import { discoverProviderCandidates, upsertDiscoveredProvider } from '../services/providerDiscovery.js';
import { refreshGraphForLibrary } from '../services/knowledgeGraph.js';
import { createBackupCheckpoint } from '../services/backupService.js';

export const initSchedulers = () => {
    // Daily Discovery from Existing Providers (2 AM)
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

    // Daily Autonomous Provider Discovery (1:30 AM)
    cron.schedule('30 1 * * *', async () => {
        console.log("[Scheduler] Running Autonomous Provider Discovery...");
        try {
            const seedUrls = providers
                .map(({ domain }) => domain ? `https://${domain.replace(/^https?:\/\//, '').replace(/^www\./, '')}` : null)
                .filter(Boolean);
            const discovered = await discoverProviderCandidates(seedUrls);
            for (const candidate of discovered) {
                await upsertDiscoveredProvider(candidate);
            }
        } catch (err) {
            console.error("[Scheduler] Provider discovery failed:", err.message);
        }
    });

    // Daily Trending YouTube Discovery (3 AM)
    cron.schedule('0 3 * * *', async () => {
        console.log("[Scheduler] Running Daily YouTube Trending Discovery...");
        await runTrendingDiscovery();
    });

    // Daily Lyrics Recovery (4 AM)
    cron.schedule('0 4 * * *', async () => {
        console.log("[Scheduler] Running Daily Lyrics Recovery...");
        await runLyricsRecovery();
    });

    // Daily Knowledge Graph Refresh (4:30 AM)
    cron.schedule('30 4 * * *', async () => {
        console.log("[Scheduler] Refreshing knowledge graph...");
        try {
            await refreshGraphForLibrary(100);
        } catch (err) {
            console.error("[Scheduler] Knowledge graph refresh failed:", err.message);
        }
    });

    // Nightly Backup Checkpoint (1 AM)
    cron.schedule('0 1 * * *', async () => {
        console.log("[Scheduler] Creating platform backup checkpoint...");
        try {
            await createBackupCheckpoint("nightly");
        } catch (err) {
            console.error("[Scheduler] Backup checkpoint failed:", err.message);
        }
    });

    // Monthly Cleanup (5 AM on the 1st)
    cron.schedule('0 5 1 * *', async () => {
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
