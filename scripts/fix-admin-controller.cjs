const fs = require('fs');

let txt = fs.readFileSync('d:/MY_SITES/Chruch_web/server/controllers/adminSongController.js', 'utf8');
const startIdx = txt.indexOf('export const getImportStatus');
const endIdx = txt.indexOf('export const getDashboardData');

const newFunc = `export const getImportStatus = async (req, res) => {
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

`;
txt = txt.substring(0, startIdx) + newFunc + txt.substring(endIdx);
fs.writeFileSync('d:/MY_SITES/Chruch_web/server/controllers/adminSongController.js', txt);
console.log('Fixed');
