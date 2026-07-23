import mongoose from "mongoose";

const providerRegistrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    baseUrl: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["active", "disabled", "pending", "rejected"],
      default: "disabled",
      index: true
    },
    type: {
      type: String,
      enum: ["wordpress", "rss", "sitemap", "api", "html", "youtube", "unknown"],
      default: "unknown",
      index: true
    },
    discoverySignals: {
      type: [String],
      default: []
    },
    parserHints: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    benchmark: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    lastSeenAt: {
      type: Date,
      default: null
    },
    discoveredAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    approvedAt: {
      type: Date,
      default: null
    },
    approvedBy: {
      type: String,
      default: ""
    },
    rejectReason: {
      type: String,
      default: ""
    },
    healthScore: {
      type: Number,
      default: 0,
      index: true
    },
    reliabilityBand: {
      type: String,
      default: "Unknown",
      index: true
    },
    selectorVersion: {
      type: String,
      default: "v1"
    },
    successRate: {
      type: Number,
      default: 0
    },
    fallbackCount: {
      type: Number,
      default: 0
    },
    extractionConfidence: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

providerRegistrySchema.index({ domain: 1, baseUrl: 1 }, { unique: true });

const ProviderRegistry = mongoose.model("ProviderRegistry", providerRegistrySchema);

export default ProviderRegistry;
