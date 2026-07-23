import Song from "../models/Song.js";
import { searchOnlineSources } from "./songSources/adapterManager.js";
import { buildSongPayload } from "../utils/songNormalization.js";

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
                const payload = buildSongPayload({
                    ...song.toObject(),
                    ...result,
                    title: result.titleTamil || result.titleEnglish || result.title || song.title,
                    titleTamil: result.titleTamil || result.title || song.titleTamil,
                    titleEnglish: result.titleEnglish || song.titleEnglish || "",
                    lyrics: result.lyricsTamil || result.lyrics || song.lyrics,
                    originalLyrics: result.originalLyrics || song.originalLyrics || song.lyrics || "",
                    cleanLyrics: result.lyricsTamil || result.lyrics || "",
                    cleanedLyrics: result.lyricsTamil || result.lyrics || "",
                    lyricsEnglish: result.lyricsEnglish || song.lyricsEnglish || "",
                    author: result.author || song.author || "",
                    composer: result.composer || song.composer || "",
                    album: result.album || song.album || "",
                    year: result.year || song.year || "",
                    language: result.language || song.language || "Tamil",
                    source: result.source || song.source || "",
                    sourceUrl: result.sourceUrl || song.sourceUrl || song.url || "",
                    aiStatus: result.aiStatus || "fallback",
                    aiProvider: result.aiProvider || "heuristic",
                    aiConfidence: result.aiConfidence || result.confidenceScore || 0,
                    aiMetadata: result.metadata || song.aiMetadata || {},
                    themes: result.themes || song.themes || [],
                    keywords: result.tags || song.keywords || [],
                    bibleReferences: result.scriptureReferences || song.bibleReferences || []
                }, {
                    source: result.source || song.source || "",
                    sourceUrl: result.sourceUrl || song.sourceUrl || song.url || "",
                    category: song.category
                });

                song.title = payload.title;
                song.titleTamil = payload.titleTamil;
                song.titleEnglish = payload.titleEnglish;
                song.lyrics = payload.lyrics;
                song.lyricsTamil = payload.lyricsTamil;
                song.lyricsEnglish = payload.lyricsEnglish;
                song.originalLyrics = payload.originalLyrics;
                song.cleanLyrics = payload.cleanLyrics;
                song.cleanedLyrics = payload.cleanedLyrics;
                song.author = payload.author;
                song.composer = payload.composer;
                song.album = payload.album;
                song.year = payload.year;
                song.language = payload.language;
                song.keywords = payload.keywords;
                song.themes = payload.themes;
                song.bibleReferences = payload.bibleReferences;
                song.searchKey = payload.searchKey;
                song.normalizedTitle = payload.normalizedTitle;
                song.normalizedLyrics = payload.normalizedLyrics;
                song.slug = payload.slug || song.slug;
                song.aiStatus = payload.aiStatus;
                song.aiProvider = payload.aiProvider;
                song.aiConfidence = payload.aiConfidence;
                song.aiProcessedAt = payload.aiProcessedAt || new Date();
                song.aiMetadata = payload.aiMetadata;
                song.lyricsStatus = "found";
                song.status = "completed"; // Full completion
                song.recoveredAt = new Date();
                
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
