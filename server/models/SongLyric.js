import mongoose from "mongoose";

const songLyricSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    titleTamil: {
      type: String,
      trim: true,
    },
    titleEnglish: {
      type: String,
      trim: true,
    },
    normalizedTitle: {
      type: String,
      trim: true,
    },
    lyricsText: {
      type: String,
      required: true,
    },
    lyricsThanglish: {
      type: String,
      default: "",
    },
    thanglishStatus: {
      type: String,
      enum: ["available", "needs_review"],
      default: "needs_review"
    },
    thanglishSource: {
      type: String,
      enum: ["generated", "manual", "extracted"]
    },
    originalFileUrl: {
      type: String,
      required: true,
    },
    originalFileType: {
      type: String,
      enum: ["txt", "ppt", "pptx"],
      required: true,
    },
    originalFileName: {
      type: String,
      default: "Unknown",
    },
    fileHash: {
      type: String,
      trim: true,
      index: true,
    },
    generatedPptUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient searching and sorting
songLyricSchema.index({ title: 1 });
songLyricSchema.index({ titleTamil: 1 });
songLyricSchema.index({ titleEnglish: 1 });
songLyricSchema.index({ normalizedTitle: 1 });
songLyricSchema.index({ createdAt: -1 });

export default mongoose.model("SongLyric", songLyricSchema);
