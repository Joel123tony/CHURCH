import mongoose from "mongoose";

const providerHealthSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    domain: {
      type: String,
      default: "",
      index: true
    },
    successCount: {
      type: Number,
      default: 0
    },
    failureCount: {
      type: Number,
      default: 0
    },
    parseFailureCount: {
      type: Number,
      default: 0
    },
    duplicateCount: {
      type: Number,
      default: 0
    },
    mergedCount: {
      type: Number,
      default: 0
    },
    missingLyricsCount: {
      type: Number,
      default: 0
    },
    missingVerseCount: {
      type: Number,
      default: 0
    },
    totalConfidence: {
      type: Number,
      default: 0
    },
    totalProcessingTimeMs: {
      type: Number,
      default: 0
    },
    totalSamples: {
      type: Number,
      default: 0
    },
    updateCount: {
      type: Number,
      default: 0
    },
    cacheHits: {
      type: Number,
      default: 0
    },
    lastSuccessAt: {
      type: Date,
      default: null
    },
    lastFailureAt: {
      type: Date,
      default: null
    },
    lastSeenAt: {
      type: Date,
      default: null
    },
    lastResponseMs: {
      type: Number,
      default: 0
    },
    healthScore: {
      type: Number,
      default: 0
    },
    reliabilityBand: {
      type: String,
      default: "Unknown",
      index: true
    },
    notes: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

providerHealthSchema.index({ provider: 1, domain: 1 });

const ProviderHealth = mongoose.model("ProviderHealth", providerHealthSchema);

export default ProviderHealth;
