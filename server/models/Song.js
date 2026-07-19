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
    composer: {
      type: String,
      default: "",
    },
    lyricist: {
      type: String,
      default: "",
    },
    duration: {
      type: String,
      default: "",
    },
    thumbnail: {
      type: String,
      default: "",
    },
    youtubeUrl: {
      type: String,
      sparse: true,
      unique: true,
    },
    youtubeMetadata: {
      videoId: String,
      channelName: String,
      uploadDate: String,
      thumbnail: String,
      viewCount: Number,
      confidenceScore: Number,
      extractedFrom: String
    },
    isPendingLyrics: {
      type: Boolean,
      default: false,
    },
    keywords: [{
      type: String,
    }],
    themes: [{
      type: String,
    }],
    bibleReferences: [{
      type: String,
    }],
    searchKey: {
      type: String,
      index: true,
    },
    uuid: {
      type: String,
      unique: true,
      sparse: true,
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Song',
      default: null,
    },
    qualityScore: {
      type: Number,
      default: 0,
    },
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
    lyricsStatus: {
      type: String,
      enum: ["found", "pending"],
      default: "found",
    },
    lastChecked: {
      type: Date,
      default: Date.now,
    },
    failReason: {
      type: String,
    },
    httpStatus: {
      type: Number,
    },
    lyricsLength: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "recovering"],
      default: "completed",
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    nextRetryAt: {
      type: Date,
      default: null,
    },
    isPublished: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);

// Create a compound text index on titles, lyrics, and keywords for full-text search
songSchema.index(
  { title: "text", titleTamil: "text", titleEnglish: "text", lyrics: "text", lyricsTamil: "text", lyricsEnglish: "text", artist: "text", keywords: "text", searchKey: "text" },
  { language_override: "dummy_language_override_field" }
);

// Performance indexes
songSchema.index({ title: 1, sourceUrl: 1, publishedDate: -1 });

const Song = mongoose.model("Song", songSchema);

export default Song;
