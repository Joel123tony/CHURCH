import { Schema, model, type InferSchemaType } from "mongoose";

const pastorSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    position: { type: String, required: true },
    startYear: Number,
    endYear: Number,
    biography: String,
    mainPhoto: String,
    galleryPhotos: [String],
    currentPastor: { type: Boolean, default: false },
    youtubeChannelId: String,
    youtubePlaylistId: String
  },
  { timestamps: true }
);

export type PastorDoc = InferSchemaType<typeof pastorSchema>;
export const Pastor = model("Pastor", pastorSchema);

