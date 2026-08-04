import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Untitled",
      trim: true,
    },

    eventDate: {
      type: Date,
      default: null,
    },

    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },

    url: {
      type: String,
      required: true,
    },

    public_id: {
      type: String,
      required: true,
    },

    thumbnail: {
      type: String,
      default: null,
    },

    folder: {
      type: String,
      default: null,
    },

    size: {
      type: Number,
      default: null, // bytes
    },

    duration: {
      type: Number,
      default: null, // seconds for videos
    },

    dimensions: {
      width: { type: Number, default: null },
      height: { type: Number, default: null },
    },

    /* =========================
       HOMEPAGE GALLERY SYSTEM
       null = hidden
       1-4 = shown on homepage
    ========================= */
    clientPriority: {
      type: Number,
      default: null,
      min: 1,
      max: 4,
    },
  },
  {
    timestamps: true,
  }
);

gallerySchema.index({ clientPriority: 1 });

export default mongoose.model(
  "Gallery",
  gallerySchema
);