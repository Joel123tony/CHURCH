import { searchYouTubeVideos } from "./youtubeService.js";
import Song from "../models/Song.js";
import stringSimilarity from "string-similarity";

const SEARCH_QUERIES = [
    "New Tamil Christian Song",
    "John Jebaraj official",
    "Benny Joshua official",
    "Giftson Durai",
    "Tamil Christian Worship Live"
];

const NOISE_WORDS = [
    "official video",
    "official music video",
    "live",
    "4k",
    "hd",
    "lyrics video",
    "new song 2025",
    "new song",
    "tamil christian song",
    "tamil gospel song",
    "cover",
    "performance",
    "lyric video",
    "official lyric video",
    "official audio"
];

export const cleanYouTubeTitle = (title) => {
    let clean = title;
    
    for (const word of NOISE_WORDS) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        clean = clean.replace(regex, "");
    }
    
    clean = clean.replace(/[|\-\[\]\(\)]/g, " ");
    clean = clean.replace(/\s+/g, " ").trim();
    
    return clean;
};

export const normalizeForComparison = (str) => {
    if (!str) return "";
    return str.toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, "").trim();
};

export const isDuplicate = async (cleanTitle, artist) => {
    const exactMatch = await Song.findOne({ titleTamil: cleanTitle });
    if (exactMatch) return true;
    
    const allTitles = await Song.find({}, 'titleTamil titleEnglish');
    if (allTitles.length === 0) return false;
    
    const targets = allTitles.map(s => normalizeForComparison(s.titleTamil || s.titleEnglish)).filter(Boolean);
    const query = normalizeForComparison(cleanTitle);
    
    if (targets.length > 0 && query.length > 3) {
        const match = stringSimilarity.findBestMatch(query, targets);
        if (match.bestMatch.rating > 0.95) {
            return true;
        }
    }
    
    return false;
};

export const runTrendingDiscovery = async () => {
    console.log("[YT-Discovery] Starting daily trending discovery...");
    let discoveredCount = 0;
    
    for (const query of SEARCH_QUERIES) {
        console.log(`[YT-Discovery] Searching for: "${query}"`);
        try {
            const videos = await searchYouTubeVideos(query, 10);
            
            for (const video of videos) {
                if (!video.videoId) continue;
                
                const ytUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
                
                const existingUrl = await Song.findOne({ $or: [{ youtubeUrl: ytUrl }, { url: ytUrl }] });
                if (existingUrl) continue;
                
                const rawTitle = video.title;
                const cleanTitle = cleanYouTubeTitle(rawTitle);
                
                if (cleanTitle.length < 3) continue;
                
                const duplicate = await isDuplicate(cleanTitle, video.channelTitle);
                if (duplicate) {
                    console.log(`[YT-Discovery] Skipping duplicate: ${cleanTitle}`);
                    continue;
                }
                
                await Song.create({
                    title: cleanTitle,
                    titleTamil: cleanTitle,
                    titleEnglish: cleanTitle,
                    artist: video.channelTitle || "",
                    youtubeUrl: ytUrl,
                    url: ytUrl,
                    sourceUrl: ytUrl,
                    source: "YouTube",
                    thumbnail: video.thumbnail,
                    publishedDate: new Date(video.publishedAt),
                    lyricsStatus: "pending",
                    status: "completed",
                    category: "Tamil Christian Songs"
                });
                
                console.log(`[YT-Discovery] 🆕 Discovered & added: ${cleanTitle}`);
                discoveredCount++;
            }
        } catch (err) {
            console.error(`[YT-Discovery] Error searching "${query}":`, err.message);
        }
    }
    
    console.log(`[YT-Discovery] Discovery complete. Found ${discoveredCount} new songs.`);
    return discoveredCount;
};
