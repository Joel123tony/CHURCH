import mongoose from "mongoose";

const songSearchLogSchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
    },
    found: {
      type: Boolean,
      required: true,
      default: false,
    },
    source: {
      type: String,
      default: "None",
    },
    responseTime: {
      type: Number, // In milliseconds
      default: 0,
    },
    searchedAt: {
      type: Date,
      default: Date.now,
    }
  }
);

const SongSearchLog = mongoose.model("SongSearchLog", songSearchLogSchema);

export default SongSearchLog;
