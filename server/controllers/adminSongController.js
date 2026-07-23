import axios from "axios";
import { detectProvider } from "../services/songSources/adapterManager.js";
import Song from "../models/Song.js";
import JobQueue from "../models/JobQueue.js";
import { scanner } from "../services/backgroundScanner.js";
import { retryService } from "../services/retryService.js";
import { getWorkerStats } from "../workers/index.js";
import { buildSongPayload, prepareSongForClient, normalizeLyricsText } from "../utils/songNormalization.js";
import { extractLyricsFromHtml } from "../utils/lyricsExtractor.js";
import { getProviderHealthSnapshot } from "../services/ai/providerHealth.js";
import ProviderRegistry from "../models/ProviderRegistry.js";
import SongRelationship from "../models/SongRelationship.js";
import { discoverProviderCandidates, upsertDiscoveredProvider } from "../services/providerDiscovery.js";
import { collectPlatformMetrics } from "../services/observability.js";
import { createBackupCheckpoint } from "../services/backupService.js";
import { refreshGraphForLibrary, refreshSongRelationships } from "../services/knowledgeGraph.js";
import { queueSongForReview, approveSongRevision, rejectSongRevision, recordSongCorrection } from "../services/reviewWorkflow.js";

export const importUrlPreview = async (req, res) => {
    try {
        const { url } = req.body;
        console.log(`[Admin Import] Received URL for queue: ${url}`);
        
        if (!url) return res.status(400).json({ success: false, message: "URL is required" });

        const providerInfo = detectProvider(url);
        const source = providerInfo ? providerInfo.name : "Manual Request";
        let previewData = null;

        if (providerInfo?.provider?.extractSong) {
            const extracted = await providerInfo.provider.extractSong(url);
            if (Array.isArray(extracted) && extracted.length > 0) {
              previewData = extracted[0];
            } else if (extracted && !Array.isArray(extracted)) {
              previewData = extracted;
            }
        }

        if (!previewData) {
            const response = await axios.get(url, {
                headers: { "User-Agent": "Mozilla/5.0" },
                timeout: 15000
            });
            const html = response.data;
            const extracted = await extractLyricsFromHtml(html, url);
            previewData = Array.isArray(extracted) && extracted.length > 0 ? extracted[0] : null;
        }

        if (!previewData) {
            previewData = {
                title: "Pending Import",
                titleTamil: "Pending Import",
                lyrics: "",
                originalLyrics: "",
                source,
                sourceUrl: url,
                category: "Manual Request",
                aiStatus: "failed",
                aiProvider: "heuristic"
            };
        }

        const preview = buildSongPayload(previewData, {
            source,
            sourceUrl: url,
            category: previewData.category || "Tamil Christian Songs"
        });

        return res.json({ 
            success: true, 
            preview
        });
    } catch (err) {
        console.error("[Admin Import Queue] Error:", err.message);
        return res.status(500).json({ success: false, message: "Failed to queue import" });
    }
};

export const importSongSave = async (req, res) => {
    try {
        const songData = buildSongPayload(req.body, {
            source: req.body.source || "Manual Request",
            sourceUrl: req.body.sourceUrl || req.body.url || "",
            category: req.body.category || "Tamil Christian Songs"
        });

        const existing = await Song.findOne({
            $or: [
                { url: songData.url },
                { sourceUrl: songData.sourceUrl },
                { slug: songData.slug }
            ]
        });

        const payload = {
            ...songData,
            lyricsLength: normalizeLyricsText(songData.lyrics || "").length,
            status: "completed",
            scrapeStatus: "success",
            lyricsStatus: "found",
            isPublished: true,
            importedAt: songData.importedAt || new Date()
        };

        let song;
        if (existing) {
            Object.assign(existing, payload);
            song = await existing.save();
        } else {
            song = await Song.create(payload);
        }

        return res.json({ success: true, song: prepareSongForClient(song.toObject ? song.toObject() : song) });
    } catch (err) {
        console.error("importSongSave Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getImportStatus = async (req, res) => {
    try {
        const totalSongs = await Song.countDocuments({ isPublished: true });
        
        const sourceBreakdown = await Song.aggregate([
            { $match: { isPublished: true } },
            { $group: { _id: "$source", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        const activeSources = sourceBreakdown.length;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0,0,0,0);

        const importedToday = await Song.countDocuments({ importedAt: { $gte: startOfToday }, isPublished: true });
        const importedThisWeek = await Song.countDocuments({ importedAt: { $gte: startOfWeek }, isPublished: true });
        const recoveredToday = await Song.countDocuments({ recoveredAt: { $gte: startOfToday } });

        const uniqueArtists = await Song.distinct("artist");
        const artistsCount = uniqueArtists.filter(a => a && a.trim() !== "").length;

        const uniqueCategories = await Song.distinct("category");
        const categoriesCount = uniqueCategories.filter(c => c && c.trim() !== "").length;

        const failedImports = await JobQueue.countDocuments({ type: 'import', status: 'failed' });
        const recoveringImports = await JobQueue.countDocuments({ type: 'recovery', status: 'pending' });
        
        const aiQueue = await JobQueue.countDocuments({ type: 'ai_cleaning', status: { $in: ["pending", "failed"] } });
        const aiProcessed = await JobQueue.countDocuments({ type: 'ai_cleaning', status: 'completed' });
        const aiNeedsReview = await Song.countDocuments({ aiNeedsReview: true, isPublished: true });
        
        const recoveryQueue = await JobQueue.countDocuments({ type: 'recovery', status: 'pending' });
        
        const aiAverage = await Song.aggregate([
            { $match: { isPublished: true, aiConfidence: { $gt: 0 } } },
            { $group: {
                _id: null,
                avgConfidence: { $avg: "$aiConfidence" },
                avgProcessingTime: { $avg: "$aiProcessingTimeMs" }
            }}
        ]);
        const confidenceBands = await Song.aggregate([
            { $match: { isPublished: true } },
            { $group: { _id: "$aiConfidenceBand", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        const aiProviders = await Song.aggregate([
            { $match: { isPublished: true } },
            { $group: { _id: "$aiProvider", count: { $sum: 1 }, avgConfidence: { $avg: "$aiConfidence" } } },
            { $sort: { count: -1 } }
        ]);
        
        const providerHealth = await getProviderHealthSnapshot();
        const providerHealthTotals = providerHealth.reduce((acc, item) => {
            acc.totalSamples += item.totalSamples || 0;
            acc.mergedCount += item.mergedCount || 0;
            acc.cacheHits += item.cacheHits || 0;
            return acc;
        }, { totalSamples: 0, mergedCount: 0, cacheHits: 0 });
        
        const mergeSuccessRate = providerHealthTotals.totalSamples > 0
            ? Math.round((providerHealthTotals.mergedCount / providerHealthTotals.totalSamples) * 100)
            : 0;
        const aiCacheHitRate = providerHealthTotals.totalSamples > 0
            ? Math.round((providerHealthTotals.cacheHits / providerHealthTotals.totalSamples) * 100)
            : 0;
            
        const moderationQueue = await JobQueue.countDocuments({ type: 'moderation', status: 'pending' });
        const providerRegistryCount = await ProviderRegistry.countDocuments();
        const relationshipCount = await SongRelationship.countDocuments();
        const platformMetrics = await collectPlatformMetrics();
        
        const lastImportDoc = await Song.findOne().sort({ importedAt: -1 }).select("importedAt title titleTamil source");
        const lastImport = lastImportDoc ? {
            time: lastImportDoc.importedAt,
            title: lastImportDoc.title || lastImportDoc.titleTamil || "",
            source: lastImportDoc.source || ""
        } : null;

        const recentImports = await Song.find().sort({ importedAt: -1 }).limit(10).select("title titleTamil source importedAt status isPublished aiStatus").lean();
        
        const queueMetrics = {
            import: await JobQueue.countDocuments({ type: 'import', status: 'pending' }),
            ai_cleaning: aiQueue,
            validation: await JobQueue.countDocuments({ type: 'validation', status: 'pending' }),
            recovery: recoveryQueue
        };
        const workers = getWorkerStats();
        const scanProgress = scanner.getStatus();

        return res.json({
            success: true,
            stats: {
                totalSongs,
                activeSources,
                importedToday,
                importedThisWeek,
                recoveredToday,
                artistsCount,
                categoriesCount,
                failedImports,
                recoveringImports,
                aiProcessed,
                aiNeedsReview,
                aiQueue,
                recoveryQueue,
                avgConfidence: aiAverage[0]?.avgConfidence ? Math.round(aiAverage[0].avgConfidence) : 0,
                avgProcessingTime: aiAverage[0]?.avgProcessingTime ? Math.round(aiAverage[0].avgProcessingTime) : 0,
                mergeSuccessRate,
                aiCacheHitRate,
                moderationQueue,
                providerRegistryCount,
                relationshipCount,
                platformMetrics
            },
            sourceBreakdown,
            confidenceBands,
            aiProviders,
            providerHealth,
            recentImports,
            lastImport,
            queueMetrics,
            workers,
            scanProgress: {
                backgroundScan: scanProgress.isRunning
            }
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
    } catch {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getScanStatus = async (req, res) => {
    try {
        return res.json({ success: true, scanStatus: scanner.getStatus() });
    } catch {
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
    } catch {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const deleteFailedImport = async (req, res) => {
    try {
        const { id } = req.params;
        await Song.findByIdAndDelete(id);
        return res.json({ success: true, message: "Deleted successfully" });
    } catch {
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
    } catch {
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
    } catch {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getRetryStatus = async (req, res) => {
    try {
        return res.json({ success: true, status: retryService.getStatus() });
    } catch {
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
        const providerHealth = await getProviderHealthSnapshot();
        const providerHealthTotals = providerHealth.reduce((acc, item) => {
            acc.totalSamples += item.totalSamples || 0;
            acc.mergedCount += item.mergedCount || 0;
            acc.cacheHits += item.cacheHits || 0;
            return acc;
        }, { totalSamples: 0, mergedCount: 0, cacheHits: 0 });
        const mergeSuccessRate = providerHealthTotals.totalSamples > 0
            ? Math.round((providerHealthTotals.mergedCount / providerHealthTotals.totalSamples) * 100)
            : 0;
        const aiCacheHitRate = providerHealthTotals.totalSamples > 0
            ? Math.round((providerHealthTotals.cacheHits / providerHealthTotals.totalSamples) * 100)
            : 0;
        const moderationQueue = await Song.countDocuments({
            $or: [
                { moderationStatus: "pending" },
                { moderationStatus: "needs_review" },
                { aiNeedsReview: true }
            ]
        });
        const platformMetrics = await collectPlatformMetrics();

        return res.json({ 
            success: true, 
            workers: stats,
            queueMetrics,
            aiProcessed: await Song.countDocuments({ aiStatus: { $in: ["processed", "fallback"] } }),
            aiFailed: await Song.countDocuments({ aiStatus: "failed" }),
            providerHealth,
            mergeSuccessRate,
            aiCacheHitRate,
            moderationQueue,
            platformMetrics,
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

export const getPlatformHealth = async (req, res) => {
    try {
        const metrics = await collectPlatformMetrics();
        const providerHealth = await getProviderHealthSnapshot();
        return res.json({
            success: true,
            metrics,
            providerHealth
        });
    } catch (err) {
        console.error("getPlatformHealth Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getModerationQueue = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        const query = {
            $or: [
                { moderationStatus: "pending" },
                { moderationStatus: "needs_review" },
                { aiNeedsReview: true }
            ]
        };
        const [songs, total] = await Promise.all([
            Song.find(query).sort({ updatedAt: -1, aiConfidence: 1 }).skip(skip).limit(limit).lean(),
            Song.countDocuments(query)
        ]);
        return res.json({
            success: true,
            data: songs.map((song) => prepareSongForClient(song)),
            page,
            totalPages: Math.max(1, Math.ceil(total / limit)),
            totalRecords: total
        });
    } catch (err) {
        console.error("getModerationQueue Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const moderateSong = async (req, res) => {
    try {
        const { id } = req.params;
        const { action = "approve", notes = [], before = {}, after = {} } = req.body || {};
        const actor = req.user?.name || req.user?.email || req.user?.sub || "admin";

        let result = null;
        if (action === "approve") {
            result = await approveSongRevision(id, { actor, notes });
        } else if (action === "reject") {
            result = await rejectSongRevision(id, { actor, notes });
        } else if (action === "correct") {
            result = await recordSongCorrection(id, { actor, notes, before, after });
        } else if (action === "queue") {
            result = await queueSongForReview(id, { actor, notes: Array.isArray(notes) ? notes : [String(notes || "")] });
        }

        if (!result) {
            return res.status(404).json({ success: false, message: "Song not found" });
        }

        return res.json({ success: true, song: prepareSongForClient(result) });
    } catch (err) {
        console.error("moderateSong Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getProviderRegistry = async (req, res) => {
    try {
        const providers = await ProviderRegistry.find().sort({ healthScore: -1, discoveredAt: -1 }).lean();
        return res.json({ success: true, providers });
    } catch (err) {
        console.error("getProviderRegistry Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const approveProviderRegistry = async (req, res) => {
    try {
        const { id } = req.params;
        const actor = req.user?.name || req.user?.email || req.user?.sub || "admin";
        const updated = await ProviderRegistry.findByIdAndUpdate(id, {
            status: "active",
            approvedAt: new Date(),
            approvedBy: actor,
            rejectReason: ""
        }, { new: true });
        if (!updated) {
            return res.status(404).json({ success: false, message: "Provider not found" });
        }
        return res.json({ success: true, provider: updated });
    } catch (err) {
        console.error("approveProviderRegistry Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const rejectProviderRegistry = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason = "" } = req.body || {};
        const updated = await ProviderRegistry.findByIdAndUpdate(id, {
            status: "rejected",
            rejectReason: reason
        }, { new: true });
        if (!updated) {
            return res.status(404).json({ success: false, message: "Provider not found" });
        }
        return res.json({ success: true, provider: updated });
    } catch (err) {
        console.error("rejectProviderRegistry Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const runProviderDiscovery = async (req, res) => {
    try {
        const seeds = (await ProviderRegistry.find().select("baseUrl").lean()).map((provider) => provider.baseUrl).filter(Boolean);
        const discovered = await discoverProviderCandidates(seeds.length > 0 ? seeds : [
            "https://www.worldtamilchristians.com",
            "https://tamilchristiansongs.in",
            "http://tamilchristianworship.com",
            "https://www.tamilchristian.com"
        ]);
        const saved = [];
        for (const candidate of discovered) {
            saved.push(await upsertDiscoveredProvider(candidate));
        }
        return res.json({ success: true, discovered: saved.filter(Boolean) });
    } catch (err) {
        console.error("runProviderDiscovery Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const refreshKnowledgeGraph = async (req, res) => {
    try {
        const results = await refreshGraphForLibrary(100);
        return res.json({ success: true, refreshed: results.length, results });
    } catch (err) {
        console.error("refreshKnowledgeGraph Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const refreshSongGraph = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await refreshSongRelationships(id);
        if (!result) {
            return res.status(404).json({ success: false, message: "Song not found" });
        }
        return res.json({ success: true, result });
    } catch (err) {
        console.error("refreshSongGraph Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const createSystemBackup = async (req, res) => {
    try {
        const checkpoint = await createBackupCheckpoint(req.body?.label || "manual");
        return res.json({ success: true, checkpoint });
    } catch (err) {
        console.error("createSystemBackup Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getSongDebug = async (req, res) => {
    try {
        const { id } = req.params;
        const song = await Song.findById(id).lean();
        if (!song) return res.status(404).json({ success: false, message: "Song not found" });

        const jobs = await JobQueue.find({ songId: id }).sort({ createdAt: -1 }).lean();
        
        return res.json({
            success: true,
            debug: {
                songId: song._id,
                title: song.title,
                lyricsStatus: song.lyricsStatus,
                isPendingLyrics: song.isPendingLyrics,
                retryCount: song.retryCount,
                providerHistory: song.providerHistory || [],
                originalVersions: song.originalVersions || [],
                aiReviewReasons: song.aiReviewReasons || [],
                recoveryRecommendations: song.recoveryRecommendations || [],
                aiConfidenceBand: song.aiConfidenceBand,
                status: song.status,
                jobs: jobs.map(j => ({
                    type: j.jobType,
                    status: j.status,
                    createdAt: j.createdAt,
                    updatedAt: j.updatedAt,
                    error: j.error
                }))
            }
        });
    } catch (err) {
        console.error("getSongDebug Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
