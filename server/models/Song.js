import mongoose from "mongoose";
import { buildSongPayload } from "../utils/songNormalization.js";

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
    originalLyrics: {
      type: String,
      default: "",
    },
    cleanLyrics: {
      type: String,
      default: "",
    },
    cleanedLyrics: {
      type: String,
      default: "",
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
    aiStatus: {
      type: String,
      enum: ["pending", "processed", "fallback", "failed"],
      default: "pending",
      index: true,
    },
    aiProvider: {
      type: String,
      default: "",
    },
    aiConfidence: {
      type: Number,
      default: 0,
    },
    aiProcessedAt: {
      type: Date,
      default: null,
      index: true,
    },
    aiMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    aiSourceHash: {
      type: String,
      default: "",
      index: true,
    },
    aiEngineVersion: {
      type: String,
      default: "",
    },
    aiPromptVersion: {
      type: String,
      default: "",
    },
    aiConfidenceBand: {
      type: String,
      default: "",
      index: true,
    },
    aiNeedsReview: {
      type: Boolean,
      default: false,
      index: true,
    },
    aiReviewReasons: {
      type: [String],
      default: [],
    },
    aiProcessingTimeMs: {
      type: Number,
      default: 0,
    },
    aiSections: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    aiSearchIndex: {
      type: String,
      default: "",
      index: true,
    },
    extractionMode: {
      type: String,
      default: "",
      index: true,
    },
    extractionConfidence: {
      type: Number,
      default: 0,
      index: true,
    },
    extractionSelectors: {
      type: [String],
      default: [],
    },
    canonicalSong: {
      type: Boolean,
      default: true,
      index: true,
    },
    masterLyrics: {
      type: String,
      default: "",
    },
    providerVariants: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    versionHistory: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    changeHistory: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    fieldConfidence: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    fieldSources: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    recoveryRecommendations: {
      type: [String],
      default: [],
    },
    originalVersions: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    mergedVersion: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    mergeSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    comparisonSummary: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    canonicalHash: {
      type: String,
      default: "",
      index: true,
    },
    masterLyricsSections: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    providerReliability: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    masterSource: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    contentHash: {
      type: String,
      default: "",
      index: true,
    },
    fieldVerification: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    relatedSongs: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    graphSignals: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    moderationStatus: {
      type: String,
      enum: ["approved", "pending", "rejected", "needs_review"],
      default: "approved",
      index: true,
    },
    moderationHistory: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    reviewNotes: {
      type: [String],
      default: [],
    },
    learningFeedback: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    searchRankingSignals: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    revisionNumber: {
      type: Number,
      default: 1,
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
    normalizedTitle: {
      type: String,
      default: "",
      index: true,
    },
    normalizedLyrics: {
      type: String,
      default: "",
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
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
      enum: ["found", "pending", "pending_fetch", "unavailable"],
      default: "found",
    },
    lastChecked: {
      type: Date,
      default: Date.now,
    },
    failReason: {
      type: String,
      default: "",
    },
    failureCategory: {
      type: String,
      enum: ["duplicate", "extraction_failure", "validation_failure", "provider_block", "timeout", "unknown", ""],
      default: "",
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
    },
    providerHistory: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    recoveredAt: {
      type: Date,
      default: null,
      index: true,
    },
    lyricsSource: {
      type: String,
      default: "",
    },
    providerVerified: {
      type: Boolean,
      default: false,
    },
    verificationDate: {
      type: Date,
      default: null,
    },
    verificationConfidence: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

songSchema.pre("validate", function () {
  const payload = buildSongPayload(this.toObject ? this.toObject() : this, {
    source: this.source,
    sourceUrl: this.sourceUrl || this.url,
    category: this.category
  });

  this.title = payload.title;
  this.titleTamil = payload.titleTamil;
  this.titleEnglish = payload.titleEnglish;
  this.lyrics = payload.lyrics;
  this.originalLyrics = payload.originalLyrics;
  this.cleanLyrics = payload.cleanLyrics;
  this.cleanedLyrics = payload.cleanedLyrics;
  this.lyricsTamil = payload.lyricsTamil;
  if (!this.lyricsEnglish && payload.lyricsEnglish) this.lyricsEnglish = payload.lyricsEnglish;
  this.language = payload.language;
  this.author = payload.author;
  this.composer = payload.composer;
  this.lyricist = payload.lyricist;
  this.album = payload.album;
  this.year = payload.year;
  this.keywords = payload.keywords;
  this.themes = payload.themes;
  this.bibleReferences = payload.bibleReferences;
  this.searchKey = payload.searchKey;
  this.normalizedTitle = payload.normalizedTitle;
  this.normalizedLyrics = payload.normalizedLyrics;
  this.slug = this.slug || payload.slug;
  this.aiStatus = this.aiStatus || payload.aiStatus || "pending";
  this.aiProvider = this.aiProvider || payload.aiProvider || "";
  this.aiConfidence = this.aiConfidence || payload.aiConfidence || 0;
  this.aiProcessedAt = this.aiProcessedAt || payload.aiProcessedAt || null;
  this.aiMetadata = this.aiMetadata || payload.aiMetadata || {};
  this.aiSourceHash = this.aiSourceHash || payload.aiSourceHash || "";
  this.aiEngineVersion = this.aiEngineVersion || payload.aiEngineVersion || "";
  this.aiPromptVersion = this.aiPromptVersion || payload.aiPromptVersion || "";
  this.aiConfidenceBand = this.aiConfidenceBand || payload.aiConfidenceBand || "";
  this.aiNeedsReview = typeof this.aiNeedsReview === "boolean" ? this.aiNeedsReview : !!payload.aiNeedsReview;
  this.aiReviewReasons = this.aiReviewReasons || payload.aiReviewReasons || [];
  this.aiProcessingTimeMs = this.aiProcessingTimeMs || payload.aiProcessingTimeMs || 0;
  this.aiSections = this.aiSections || payload.aiSections || [];
  this.aiSearchIndex = this.aiSearchIndex || payload.aiSearchIndex || "";
  this.extractionMode = this.extractionMode || payload.extractionMode || "";
  this.extractionConfidence = this.extractionConfidence || payload.extractionConfidence || 0;
  this.extractionSelectors = this.extractionSelectors || payload.extractionSelectors || [];
  this.canonicalSong = typeof this.canonicalSong === "boolean" ? this.canonicalSong : payload.canonicalSong !== undefined ? payload.canonicalSong : true;
  this.masterLyrics = this.masterLyrics || payload.masterLyrics || "";
  this.providerVariants = this.providerVariants || payload.providerVariants || [];
  this.versionHistory = this.versionHistory || payload.versionHistory || [];
  this.changeHistory = this.changeHistory || payload.changeHistory || [];
  this.fieldConfidence = this.fieldConfidence || payload.fieldConfidence || {};
  this.fieldSources = this.fieldSources || payload.fieldSources || {};
  this.recoveryRecommendations = this.recoveryRecommendations || payload.recoveryRecommendations || [];
  this.originalVersions = this.originalVersions || payload.originalVersions || [];
  this.mergedVersion = this.mergedVersion || payload.mergedVersion || null;
  this.mergeSummary = this.mergeSummary || payload.mergeSummary || {};
  this.comparisonSummary = this.comparisonSummary || payload.comparisonSummary || [];
  this.canonicalHash = this.canonicalHash || payload.canonicalHash || "";
  this.masterLyricsSections = this.masterLyricsSections || payload.masterLyricsSections || [];
  this.providerReliability = this.providerReliability || payload.providerReliability || {};
  this.masterSource = this.masterSource || payload.masterSource || null;
  this.contentHash = this.contentHash || payload.contentHash || "";
  this.fieldVerification = this.fieldVerification || payload.fieldVerification || {};
  this.relatedSongs = this.relatedSongs || payload.relatedSongs || [];
  this.graphSignals = this.graphSignals || payload.graphSignals || {};
  this.moderationStatus = this.moderationStatus || payload.moderationStatus || "approved";
  this.moderationHistory = this.moderationHistory || payload.moderationHistory || [];
  this.reviewNotes = this.reviewNotes || payload.reviewNotes || [];
  this.learningFeedback = this.learningFeedback || payload.learningFeedback || [];
  this.searchRankingSignals = this.searchRankingSignals || payload.searchRankingSignals || {};
  this.revisionNumber = this.revisionNumber || payload.revisionNumber || 1;
  this.providerHistory = this.providerHistory || payload.providerHistory || [];
  this.recoveredAt = this.recoveredAt || payload.recoveredAt || null;
  this.lyricsSource = this.lyricsSource || payload.lyricsSource || "";
  this.providerVerified = typeof this.providerVerified === "boolean" ? this.providerVerified : !!payload.providerVerified;
  this.verificationDate = this.verificationDate || payload.verificationDate || null;
  this.verificationConfidence = this.verificationConfidence || payload.verificationConfidence || 0;
});

// Create a compound text index on titles, lyrics, and keywords for full-text search
songSchema.index(
  { title: "text", titleTamil: "text", titleEnglish: "text", lyrics: "text", lyricsTamil: "text", lyricsEnglish: "text", artist: "text", author: "text", composer: "text", keywords: "text", themes: "text", bibleReferences: "text", searchKey: "text", normalizedTitle: "text" },
  { language_override: "dummy_language_override_field" }
);

// Performance indexes
songSchema.index({ title: 1, normalizedTitle: 1, sourceUrl: 1, url: 1, slug: 1, publishedDate: -1 });
songSchema.index({ themes: 1, language: 1, source: 1 });
songSchema.index({ keywords: 1, language: 1, source: 1 });
songSchema.index({ aiNeedsReview: 1, aiConfidenceBand: 1, aiStatus: 1, status: 1 });
songSchema.index({ aiSourceHash: 1, aiEngineVersion: 1 });
// songSchema.index({ aiSearchIndex: "text", aiReviewReasons: "text", recoveryRecommendations: "text", masterLyrics: "text" });
songSchema.index({ canonicalSong: 1, canonicalHash: 1 });
songSchema.index({ moderationStatus: 1, aiNeedsReview: 1, aiConfidenceBand: 1 });
songSchema.index({ contentHash: 1, source: 1, sourceUrl: 1 }, { sparse: true });

songSchema.pre("save", function(next) {
  if (this.failReason && !this.failureCategory) {
    const reason = this.failReason.toLowerCase();
    if (reason.includes("duplicate") || reason.includes("already exists")) {
      this.failureCategory = "duplicate";
    } else if (reason.includes("extract") || reason.includes("split") || reason.includes("format")) {
      this.failureCategory = "extraction_failure";
    } else if (reason.includes("validat") || reason.includes("noise") || reason.includes("incomplete") || reason.includes("empty")) {
      this.failureCategory = "validation_failure";
    } else if (reason.includes("403") || reason.includes("block") || reason.includes("captcha") || reason.includes("forbidden")) {
      this.failureCategory = "provider_block";
    } else if (reason.includes("timeout") || reason.includes("socket") || reason.includes("hang")) {
      this.failureCategory = "timeout";
    } else {
      this.failureCategory = "unknown";
    }
  }
  if (typeof next === 'function') {
    next();
  }
});

const Song = mongoose.model("Song", songSchema);

export default Song;
