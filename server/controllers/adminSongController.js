import { QueueManager } from "../utils/queueManager.js";
import { detectProvider } from "../services/songSources/adapterManager.js";
import Song from "../models/Song.js";
import JobQueue from "../models/JobQueue.js";
import { scanner } from "../services/backgroundScanner.js";
import { retryService } from "../services/retryService.js";
import { getWorkerStats } from "../workers/index.js";

export const importUrlPreview = async (req, res) => {
    try {
        const { url } = req.body;
        console.log(`[Admin Import] Received URL for queue: ${url}`);
        
        if (!url) return res.status(400).json({ success: false, message: "URL is required" });

        const providerInfo = detectProvider(url);
        const source = providerInfo ? providerInfo.name : "Manual Request";

        // Push to Discovery Queue which handles UUID generation and metadata creation
        await QueueManager.addJob("discovery", {
            url,
            source,
            metadata: {
                title: "Pending Import",
                category: "Manual Request"
            }
        });

        // We return a "queued" preview stub for the UI
        return res.json({ 
            success: true, 
            preview: {
                titleTamil: "Queued for AI Processing...",
                lyricsTamil: "Your song has been added to the background queue. It will appear in your library once AI cleaning and validation are complete.",
                sourceUrl: url
            } 
        });
    } catch (err) {
        console.error("[Admin Import Queue] Error:", err.message);
        return res.status(500).json({ success: false, message: "Failed to queue import" });
    }
};

export const importSongSave = async (req, res) => {
    try {
        const songData = req.body;
        // With the new architecture, manual saves from the UI just skip to validation if they edited it,
        // but for now, we just mock the success so the UI doesn't break if they click save.
        return res.json({ success: true, song: { _id: "queued", ...songData } });
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

        const statsWorkers = getWorkerStats();
        const jobCounts = await JobQueue.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const queueMetrics = { pending: 0, processing: 0, completed: 0, failed: 0, quarantined: 0 };
        jobCounts.forEach(j => { if (queueMetrics[j._id] !== undefined) queueMetrics[j._id] = j.count; });

        return res.json({ 
            success: true, 
            totalSongs, 
            activeSources,
            sourceBreakdown,
            importedToday,
            importedThisWeek,
            artists: artistsCount,
            categories: categoriesCount,
            pendingImports: queueMetrics.pending + queueMetrics.processing,
            failedImports,
            lastImport,
            recentImports,
            status: "idle",
            workers: statsWorkers,
            queueMetrics
        });
    } catch (err) {
        console.error("getImportStatus Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getDashboardData = getImportStatus;

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

export const getWorkerStatus = async (req, res) => {
    try {
        const stats = getWorkerStats();
        
        // Count jobs in each state
        const jobCounts = await JobQueue.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const queueMetrics = {
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0,
            quarantined: 0
        };

        jobCounts.forEach(j => {
            if (queueMetrics[j._id] !== undefined) {
                queueMetrics[j._id] = j.count;
            }
        });

        // Get success rates
        const totalProcessed = queueMetrics.completed + queueMetrics.failed + queueMetrics.quarantined;
        const successRate = totalProcessed > 0 
            ? Math.round((queueMetrics.completed / totalProcessed) * 100) 
            : 0;

        return res.json({ 
            success: true, 
            workers: stats,
            queueMetrics,
            systemHealth: {
                successRate,
                totalProcessed,
                activeWorkers: stats.filter(w => w.status !== "Stopped" && w.status !== "Failed").length
            }
        });
    } catch (err) {
        console.error("getWorkerStatus Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
