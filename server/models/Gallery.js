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

export default mongoose.model(
  "Gallery",
  gallerySchema
);