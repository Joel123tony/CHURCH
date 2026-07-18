import mongoose from "mongoose";

const songSearchCacheSchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    results: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    source: {
      type: String,
      default: null,
    },
    searchedAt: {
      type: Date,
      default: Date.now,
      expires: "7d", // Automatically delete after 7 days
    }
  }
);

songSearchCacheSchema.index({ query: 1 });

const SongSearchCache = mongoose.model("SongSearchCache", songSearchCacheSchema);

export default SongSearchCache;
