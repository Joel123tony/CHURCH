import Song from "../models/Song.js";
import { searchOnlineSources } from "./songSources/adapterManager.js";
import { extractLyricsFromHtml } from "../utils/lyricsExtractor.js";

const MAX_RECOVERY_ATTEMPTS = 5;

export const runLyricsRecovery = async () => {
    console.log("[LyricsRecovery] Starting daily lyrics recovery for pending songs...");
    
    // Find songs that are pending and either never tried or nextRetryAt is past
    const query = {
        lyricsStatus: "pending",
        retryCount: { $lt: MAX_RECOVERY_ATTEMPTS },
        $or: [
            { nextRetryAt: null },
            { nextRetryAt: { $lte: new Date() } }
        ]
    };
    
    const pendingSongs = await Song.find(query).limit(50); // limit to 50 a day so we don't spam providers
    
    if (pendingSongs.length === 0) {
        console.log("[LyricsRecovery] No pending songs require recovery at this time.");
        return 0;
    }
    
    let recoveredCount = 0;
    
    for (const song of pendingSongs) {
        console.log(`[LyricsRecovery] Attempting to recover lyrics for: "${song.title}" (Attempt ${song.retryCount + 1})`);
        
        try {
            // Stage 1: Try our primary providers via Adapter Manager
            const result = await searchOnlineSources(song.title);
            
            if (result && result.lyricsTamil) {
                // Success! We found it.
                song.lyrics = result.lyricsTamil;
                song.lyricsTamil = result.lyricsTamil;
                song.lyricsEnglish = result.lyricsEnglish || "";
                song.lyricsStatus = "found";
                song.status = "completed"; // Full completion
                
                await song.save();
                recoveredCount++;
                console.log(`[LyricsRecovery] ✅ Successfully recovered lyrics for "${song.title}" from ${result.source}`);
            } else {
                throw new Error("No lyrics found across primary providers.");
            }
        } catch (err) {
            console.error(`[LyricsRecovery] ❌ Failed to recover "${song.title}":`, err.message);
            // Increment retry and backoff (try again in 24 hours)
            song.retryCount += 1;
            const nextDay = new Date();
            nextDay.setDate(nextDay.getDate() + 1);
            song.nextRetryAt = nextDay;
            
            await song.save();
        }
    }
    
    console.log(`[LyricsRecovery] Complete. Recovered ${recoveredCount}/${pendingSongs.length} songs.`);
    return recoveredCount;
};
