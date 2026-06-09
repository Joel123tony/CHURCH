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
      required: true, // Cloudinary ID (for delete)
    },

    showInClient: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Gallery", gallerySchema);