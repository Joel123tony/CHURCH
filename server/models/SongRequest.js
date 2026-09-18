import mongoose from "mongoose";

const songRequestSchema = new mongoose.Schema(
  {
    songName: {
      type: String,
      required: [true, "Song name is required"],
      trim: true,
    },
    details: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "added", "rejected"],
      default: "pending",
    }
  },
  { 
    timestamps: { createdAt: "requestedAt", updatedAt: "updatedAt" } 
  }
);

const SongRequest = mongoose.model("SongRequest", songRequestSchema);

export default SongRequest;
