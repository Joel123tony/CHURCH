import mongoose from "mongoose";

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
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
    lyrics: {
      type: String,
    },
    lyricsTamil: {
      type: String,
    },
    lyricsEnglish: {
      type: String,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    language: {
      type: String,
      default: "Tamil",
    },
    source: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
      unique: true,
    },
    artist: {
      type: String,
      default: "",
    },
    album: {
      type: String,
      default: "",
    },
    year: {
      type: String,
      default: "",
    },
    author: {
      type: String,
      default: "",
    },
    keywords: [{
      type: String,
    }],
    importedAt: {
      type: Date,
      default: Date.now,
    },
    publishedDate: {
      type: Date,
    },
    sourceUrl: {
      type: String,
    },
    scrapeStatus: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },
    lyricsLength: {
      type: Number,
    },
  },
  { timestamps: true }
);

// Create a compound text index on titles, lyrics, and keywords for full-text search
songSchema.index(
  { title: "text", titleTamil: "text", titleEnglish: "text", lyrics: "text", lyricsTamil: "text", lyricsEnglish: "text", artist: "text", keywords: "text" },
  { language_override: "dummy_language_override_field" }
);

// Performance indexes
songSchema.index({ title: 1, sourceUrl: 1, publishedDate: -1 });

const Song = mongoose.model("Song", songSchema);

export default Song;
