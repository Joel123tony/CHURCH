import mongoose from "mongoose";

const jobQueueSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      index: true,
      enum: [
        "discovery",
        "provider_discovery",
        "adaptive_scrape",
        "import",
        "ai_cleaning",
        "validation",
        "duplicate_detection",
        "recovery",
        "indexing",
        "knowledge_graph",
        "moderation",
        "backup",
        "monitoring",
        "reindex"
      ]
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    status: {
      type: String,
      required: true,
      index: true,
      enum: ["pending", "processing", "completed", "failed", "quarantined"],
      default: "pending"
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 5
    },
    lastError: {
      type: String
    },
    nextRunAt: {
      type: Date,
      index: true,
      default: Date.now
    },
    lockedUntil: {
      type: Date,
      index: true,
      default: null
    },
    songId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Song',
      index: true,
      sparse: true
    }
  },
  { timestamps: true }
);

const JobQueue = mongoose.model("JobQueue", jobQueueSchema);

export default JobQueue;
