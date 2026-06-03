import { Schema, model, type InferSchemaType } from "mongoose";

const sermonSchema = new Schema(
  {
    slug: { type: String, unique: true, index: true },
    title: { type: String, required: true },
    description: String,
    speaker: String,
    publishDate: Date,
    thumbnailUrl: String,
    videoUrl: { type: String, required: true },
    youtubeVideoId: { type: String, required: true, unique: true, index: true },
    duration: String,
    featured: { type: Boolean, default: false },
    source: { type: String, enum: ["youtube", "manual"], default: "youtube" },
    liveRecording: { type: Boolean, default: false },
    tags: [String]
  },
  { timestamps: true }
);

export type SermonDoc = InferSchemaType<typeof sermonSchema>;
export const Sermon = model("Sermon", sermonSchema);
