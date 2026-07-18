import { providers } from "../services/songSources/adapterManager.js";
import Song from "../models/Song.js";

// Determine which provider matches the URL best
const getProviderForUrl = (url) => {
    if (url.includes("worldtamilchristians.com")) {
        return providers.find(p => p.name === "World Tamil Christians")?.provider;
    }
    if (url.includes("tamilchristiansongs.in")) {
        return providers.find(p => p.name === "TamilChristianSongs.in")?.provider;
    }
    return null;
};

export const importUrlPreview = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ success: false, message: "URL is required" });

        const provider = getProviderForUrl(url);
        if (!provider || !provider.fetchSong) {
            return res.status(400).json({ success: false, message: "No supported provider found for this URL" });
        }

        const songData = await provider.fetchSong(url);
        if (!songData) {
            return res.status(404).json({ success: false, message: "Failed to extract lyrics from URL" });
        }

        return res.json({ success: true, preview: songData });
    } catch (err) {
        console.error("importUrlPreview Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const importSongSave = async (req, res) => {
    try {
        const songData = req.body;
        if (!songData || !songData.title || !songData.lyricsTamil) {
            return res.status(400).json({ success: false, message: "Invalid song data" });
        }

        // Duplicate check
        const existing = await Song.findOne({ url: songData.sourceUrl });
        if (existing) {
            return res.status(409).json({ success: false, message: "Song already exists in database" });
        }

        const newSong = await Song.create({
            title: songData.titleTamil || songData.titleEnglish || songData.title,
            titleTamil: songData.titleTamil,
            titleEnglish: songData.titleEnglish,
            lyrics: songData.lyricsTamil,
            lyricsTamil: songData.lyricsTamil,
            lyricsEnglish: songData.lyricsEnglish,
            category: "Tamil Christian Songs",
            source: songData.source || "Manual Import",
            url: songData.sourceUrl,
            sourceUrl: songData.sourceUrl,
            artist: songData.artist || "",
        });

        return res.json({ success: true, song: newSong });
    } catch (err) {
        console.error("importSongSave Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getImportStatus = async (req, res) => {
    try {
        const totalSongs = await Song.countDocuments();
        const sources = await Song.aggregate([
            { $group: { _id: "$source", count: { $sum: 1 } } }
        ]);
        
        return res.json({ 
            success: true, 
            totalSongs, 
            sources,
            status: "idle" 
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
