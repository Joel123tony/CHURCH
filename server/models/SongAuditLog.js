import mongoose from "mongoose";

const songAuditLogSchema = new mongoose.Schema(
  {
    songId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Song",
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    actor: {
      type: String,
      default: "system",
      index: true
    },
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    notes: {
      type: [String],
      default: []
    },
    source: {
      type: String,
      default: ""
    },
    sourceUrl: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

songAuditLogSchema.index({ songId: 1, action: 1, createdAt: -1 });

const SongAuditLog = mongoose.model("SongAuditLog", songAuditLogSchema);

export default SongAuditLog;
