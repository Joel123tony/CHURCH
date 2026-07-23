import os from "os";
import mongoose from "mongoose";
import Song from "../models/Song.js";
import JobQueue from "../models/JobQueue.js";
import ProviderHealth from "../models/ProviderHealth.js";

export const collectPlatformMetrics = async () => {
  const [totalSongs, reviewQueue, processingQueue, failedQueue, providerCount] = await Promise.all([
    Song.countDocuments({ isPublished: true }),
    Song.countDocuments({ moderationStatus: "pending" }),
    JobQueue.countDocuments({ status: "processing" }),
    JobQueue.countDocuments({ status: "failed" }),
    ProviderHealth.countDocuments()
  ]);

  const queueCounts = await JobQueue.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  const queue = { pending: 0, processing: 0, completed: 0, failed: 0, quarantined: 0 };
  queueCounts.forEach((item) => {
    if (queue[item._id] !== undefined) queue[item._id] = item.count;
  });

  const aiStats = await Song.aggregate([
    { $match: { isPublished: true, aiConfidence: { $gt: 0 } } },
    {
      $group: {
        _id: null,
        avgConfidence: { $avg: "$aiConfidence" },
        avgAiTime: { $avg: "$aiProcessingTimeMs" },
        aiProcessed: { $sum: { $cond: [{ $in: ["$aiStatus", ["processed", "fallback"]] }, 1, 0] } }
      }
    }
  ]);

  const providerHealth = await ProviderHealth.find().sort({ healthScore: -1 }).lean();
  const mergedSongs = await Song.countDocuments({ canonicalSong: true, canonicalHash: { $ne: "" } });

  let dbLatencyMs = 0;
  try {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      dbLatencyMs = Date.now() - start;
    }
  } catch {
    dbLatencyMs = 0;
  }

  const memory = process.memoryUsage();
  return {
    timestamp: new Date(),
    songs: {
      total: totalSongs,
      merged: mergedSongs,
      reviewQueue
    },
    queue,
    providers: {
      scanned: providerCount,
      failures: providerHealth.reduce((sum, item) => sum + (item.failureCount || 0), 0),
      health: providerHealth
    },
    ai: {
      processed: aiStats[0]?.aiProcessed || 0,
      avgConfidence: Math.round(aiStats[0]?.avgConfidence || 0),
      avgProcessingTimeMs: Math.round(aiStats[0]?.avgAiTime || 0)
    },
    runtime: {
      uptimeSeconds: Math.round(process.uptime()),
      memoryUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
      memoryTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
      loadAverage: os.loadavg().map((value) => Number(value.toFixed(2))),
      dbLatencyMs
    },
    throughput: {
      importsPerHour: queue.completed,
      providerFailuresPerHour: providerHealth.reduce((sum, item) => sum + (item.failureCount || 0), 0)
    },
    status: dbLatencyMs > 500 ? "degraded" : "healthy",
    processingQueue,
    failedQueue
  };
};
