import mongoose from "mongoose";

const GallerySchema = new mongoose.Schema(
  {
    title: String,
    mediaType: {
      type: String,
      enum: ["image", "video"],
    },

    url: String,
    public_id: String, // Cloudinary image/video id

    showInClient: {
      type: Boolean,
      default: false,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Gallery", GallerySchema);