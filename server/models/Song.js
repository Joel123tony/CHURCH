import mongoose from "mongoose";

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    lyrics: {
      type: String,
      required: true,
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
    author: {
      type: String,
      default: "",
    },
    keywords: [{
      type: String,
    }],
  },
  { timestamps: true }
);

// Create a compound text index on title, lyrics, and keywords for full-text search
// Since we have a 'language' field that stores values like "Tamil", we must disable MongoDB's default language override
songSchema.index(
  { title: "text", lyrics: "text", keywords: "text" },
  { language_override: "dummy_language_override_field" }
);

const Song = mongoose.model("Song", songSchema);

export default Song;
