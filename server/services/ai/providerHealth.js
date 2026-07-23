import ProviderHealth from "../../models/ProviderHealth.js";
import { getCached, setCached } from "../../utils/cache.js";

const scoreBand = (score = 0) => {
  if (score >= 95) return "Excellent";
  if (score >= 90) return "Strong";
  if (score >= 80) return "Good";
  if (score >= 70) return "Watch";
  return "Weak";
};

const computeHealthScore = (doc = {}) => {
  const total = Math.max(1, doc.totalSamples || 0);
  const successRate = (doc.successCount || 0) / total;
  const failureRate = (doc.failureCount || 0) / total;
  const parsePenalty = (doc.parseFailureCount || 0) / total;
  const missingPenalty = ((doc.missingLyricsCount || 0) + (doc.missingVerseCount || 0)) / total;
  const confidenceAvg = doc.totalConfidence ? doc.totalConfidence / total : 0;
  const responsePenalty = doc.lastResponseMs ? Math.min(20, doc.lastResponseMs / 250) : 0;

  const score = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        (successRate * 60) +
        (confidenceAvg * 0.3) +
        (doc.mergedCount ? Math.min(10, doc.mergedCount / total * 10) : 0) -
        (failureRate * 35) -
        (parsePenalty * 15) -
        (missingPenalty * 18) -
        responsePenalty
      )
    )
  );

  return score;
};

export const recordProviderHealth = async ({
  provider = "Unknown",
  domain = "",
  success = false,
  parsed = true,
  duplicate = false,
  merged = false,
  missingLyrics = false,
  missingVerse = false,
  confidence = 0,
  processingTimeMs = 0,
  cacheHit = false,
  note = ""
} = {}) => {
  const update = {
    provider,
    domain,
    lastSeenAt: new Date(),
    lastResponseMs: processingTimeMs || 0,
    updateCount: 1,
    totalSamples: 1
  };

  if (success) {
    update.successCount = 1;
    update.lastSuccessAt = new Date();
  } else {
    update.failureCount = 1;
    update.lastFailureAt = new Date();
  }

  if (!parsed) update.parseFailureCount = 1;
  if (duplicate) update.duplicateCount = 1;
  if (merged) update.mergedCount = 1;
  if (missingLyrics) update.missingLyricsCount = 1;
  if (missingVerse) update.missingVerseCount = 1;
  if (cacheHit) update.cacheHits = 1;
  if (confidence) update.totalConfidence = confidence;
  if (note) update.notes = [note];
  if (processingTimeMs) update.totalProcessingTimeMs = processingTimeMs;

  const doc = await ProviderHealth.findOneAndUpdate(
    { provider },
    {
      $inc: {
        successCount: update.successCount || 0,
        failureCount: update.failureCount || 0,
        parseFailureCount: update.parseFailureCount || 0,
        duplicateCount: update.duplicateCount || 0,
        mergedCount: update.mergedCount || 0,
        missingLyricsCount: update.missingLyricsCount || 0,
        missingVerseCount: update.missingVerseCount || 0,
        totalConfidence: update.totalConfidence || 0,
        totalProcessingTimeMs: update.totalProcessingTimeMs || 0,
        totalSamples: 1,
        updateCount: 1,
        cacheHits: update.cacheHits || 0
      },
      $set: {
        domain,
        lastSeenAt: update.lastSeenAt,
        ...(update.lastSuccessAt ? { lastSuccessAt: update.lastSuccessAt } : {}),
        ...(update.lastFailureAt ? { lastFailureAt: update.lastFailureAt } : {}),
        ...(update.lastResponseMs ? { lastResponseMs: update.lastResponseMs } : {})
      },
      ...(note ? { $push: { notes: { $each: [note], $slice: -20 } } } : {})
    },
    { upsert: true, returnDocument: "after" }
  );

  doc.healthScore = computeHealthScore(doc);
  doc.reliabilityBand = scoreBand(doc.healthScore);
  await doc.save();
  return doc.toObject();
};

export const getProviderHealthSnapshot = async () => {
  const cached = getCached("provider_health_snapshot");
  if (cached) return cached;
  try {
    const docs = await ProviderHealth.find().sort({ healthScore: -1, successCount: -1 }).lean();
    const snapshot = docs.map((doc) => ({
      ...doc,
      healthScore: doc.healthScore || computeHealthScore(doc),
      reliabilityBand: doc.reliabilityBand || scoreBand(doc.healthScore || 0),
      successRate: doc.totalSamples ? Math.round((doc.successCount / doc.totalSamples) * 100) : 0,
      avgConfidence: doc.totalSamples ? Math.round(doc.totalConfidence / doc.totalSamples) : 0,
      avgProcessingTimeMs: doc.totalSamples ? Math.round(doc.totalProcessingTimeMs / doc.totalSamples) : 0,
      failureRate: doc.totalSamples ? Math.round((doc.failureCount / doc.totalSamples) * 100) : 0
    }));
    setCached("provider_health_snapshot", snapshot, 60);
    return snapshot;
  } catch (error) {
    console.error("⚠️ getProviderHealthSnapshot DB Error:", error.message);
    return [];
  }
};

export const scoreProviderReliability = (doc = {}) => {
  const healthScore = doc.healthScore || computeHealthScore(doc);
  return {
    healthScore,
    reliabilityBand: doc.reliabilityBand || scoreBand(healthScore)
  };
};
