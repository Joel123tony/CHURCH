import { providers, detectProvider } from "../services/songSources/adapterManager.js";
import Song from "../models/Song.js";
import { scanner } from "../services/backgroundScanner.js";
import { retryService } from "../services/retryService.js";

export const importUrlPreview = async (req, res) => {
    try {
        const { url } = req.body;
        console.log(`[Admin Import] Received URL: ${url}`);
        
        if (!url) return res.status(400).json({ success: false, message: "URL is required", details: "No URL provided in the request body." });

        const providerInfo = detectProvider(url);
        console.log(`[Admin Import] Detected provider info:`, providerInfo ? providerInfo.name : "null");
        
        if (!providerInfo || !providerInfo.provider.fetchSong) {
            return res.status(400).json({ 
                success: false, 
                message: "Unsupported provider", 
                details: "The provided URL does not match any of our supported song providers (e.g. World Tamil Christians, TamilChristianSongs)." 
            });
        }

        const provider = providerInfo.provider;
        console.log(`[Admin Import] Selected adapter for ${providerInfo.name}. Fetching...`);
        
        const songData = await provider.fetchSong(url);
        console.log(`[Admin Import] Adapter response successful for: ${songData.titleTamil || "Unknown Title"}`);

        return res.json({ success: true, preview: songData });
    } catch (err) {
        console.error("[Admin Import] Final Error:", err.message);
        
        // Return 404 for provider errors (like not found on page or parser rejection)
        if (err.message.includes("Provider Error") || err.message.includes("sanitizer")) {
            return res.status(404).json({ 
                success: false, 
                message: "Lyrics not found on page", 
                details: err.message 
            });
        }
        
        return res.status(500).json({ 
            success: false, 
            message: "Failed to parse page or network error", 
            details: err.message 
        });
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
        
        const sourceBreakdown = await Song.aggregate([
            { $group: { _id: "$source", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        const activeSources = sourceBreakdown.length;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0,0,0,0);

        const importedToday = await Song.countDocuments({ importedAt: { $gte: startOfToday } });
        const importedThisWeek = await Song.countDocuments({ importedAt: { $gte: startOfWeek } });

        const uniqueArtists = await Song.distinct("artist");
        const artistsCount = uniqueArtists.filter(a => a && a.trim() !== "").length;

        const uniqueCategories = await Song.distinct("category");
        const categoriesCount = uniqueCategories.filter(c => c && c.trim() !== "").length;

        const failedImports = await Song.countDocuments({ scrapeStatus: "failed" });
        
        const lastImportDoc = await Song.findOne().sort({ importedAt: -1 }).select("importedAt");
        const lastImport = lastImportDoc ? lastImportDoc.importedAt : null;

        const recentImports = await Song.find().sort({ importedAt: -1 }).limit(10).select("title titleTamil source importedAt");

        return res.json({ 
            success: true, 
            totalSongs, 
            activeSources,
            sourceBreakdown,
            importedToday,
            importedThisWeek,
            artists: artistsCount,
            categories: categoriesCount,
            pendingImports: 0,
            failedImports,
            lastImport,
            recentImports,
            status: "idle" 
        });
    } catch (err) {
        console.error("getImportStatus Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const startLibraryScan = async (req, res) => {
    try {
        if (scanner.isRunning) {
            return res.status(400).json({ success: false, message: "Scan is already running." });
        }
        scanner.startScan();
        return res.json({ success: true, message: "Scan started successfully." });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getScanStatus = async (req, res) => {
    try {
        return res.json({ success: true, scanStatus: scanner.getStatus() });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getFailedImports = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const skip = (page - 1) * limit;

        const query = { status: "failed" };
        if (search) {
            query.$or = [
                { url: { $regex: search, $options: "i" } },
                { sourceUrl: { $regex: search, $options: "i" } },
                { source: { $regex: search, $options: "i" } },
                { failReason: { $regex: search, $options: "i" } },
                { title: { $regex: search, $options: "i" } }
            ];
        }

        const totalRecords = await Song.countDocuments(query);
        const data = await Song.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const retryStatus = retryService.getStatus();

        return res.json({ 
            success: true, 
            data,
            page,
            totalPages: Math.ceil(totalRecords / limit),
            totalRecords,
            hasNext: page * limit < totalRecords,
            hasPrevious: page > 1,
            stats: {
                failed: totalRecords,
                recovered: retryStatus.recovered,
                retryQueue: retryStatus.total - retryStatus.retried,
                lastRetry: retryStatus.durationMs > 0 ? "Just now" : "N/A"
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const deleteFailedImport = async (req, res) => {
    try {
        const { id } = req.params;
        await Song.findByIdAndDelete(id);
        return res.json({ success: true, message: "Deleted successfully" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getRecentImports = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const skip = (page - 1) * limit;

        const query = {};
        if (search) {
            query.$or = [
                { titleTamil: { $regex: search, $options: "i" } },
                { titleEnglish: { $regex: search, $options: "i" } },
                { title: { $regex: search, $options: "i" } },
                { artist: { $regex: search, $options: "i" } },
                { source: { $regex: search, $options: "i" } },
                { album: { $regex: search, $options: "i" } }
            ];
        }

        const totalRecords = await Song.countDocuments(query);
        const data = await Song.find(query)
            .sort({ importedAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select("title titleTamil source importedAt artist album");

        return res.json({
            success: true,
            data,
            page,
            totalPages: Math.ceil(totalRecords / limit),
            totalRecords,
            hasNext: page * limit < totalRecords,
            hasPrevious: page > 1
        });
    } catch (err) {
        console.error("getRecentImports Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const retryAllFailed = async (req, res) => {
    try {
        const started = await retryService.startRetryAll();
        if (!started) return res.status(400).json({ success: false, message: "Retry already running or no failed imports." });
        return res.json({ success: true, message: "Retry started" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const retrySelectedFailed = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !ids.length) return res.status(400).json({ success: false, message: "No IDs provided" });
        const started = await retryService.startRetrySelected(ids);
        if (!started) return res.status(400).json({ success: false, message: "Retry already running." });
        return res.json({ success: true, message: "Retry started" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getRetryStatus = async (req, res) => {
    try {
        return res.json({ success: true, status: retryService.getStatus() });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
