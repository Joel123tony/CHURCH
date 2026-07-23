import mongoose from "mongoose";

const songRelationshipSchema = new mongoose.Schema(
  {
    fromSong: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Song",
      required: true,
      index: true
    },
    toSong: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Song",
      required: true,
      index: true
    },
    relationType: {
      type: String,
      enum: [
        "similar_title",
        "alternate_title",
        "translation",
        "medley",
        "remix",
        "same_composer",
        "same_author",
        "same_album",
        "same_ministry",
        "same_scripture",
        "same_theme"
      ],
      required: true,
      index: true
    },
    score: {
      type: Number,
      default: 0,
      index: true
    },
    reasons: {
      type: [String],
      default: []
    },
    canonical: {
      type: Boolean,
      default: false,
      index: true
    },
    source: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

songRelationshipSchema.index({ fromSong: 1, toSong: 1, relationType: 1 }, { unique: true });

const SongRelationship = mongoose.model("SongRelationship", songRelationshipSchema);

export default SongRelationship;
