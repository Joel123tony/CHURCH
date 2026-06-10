import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Untitled",
      trim: true,
    },

    mediaType: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },

    url: {
      type: String,
      required: true,
    },

    public_id: {
      type: String,
      required: true,
    },

    // 🔥 NEW: homepage control system
    clientPriority: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Gallery", gallerySchema);