import { Schema, model, type InferSchemaType } from "mongoose";

const mediaAssetSchema = new Schema(
  {
    type: { type: String, enum: ["image", "video"], required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    thumbUrl: String,
    width: Number,
    height: Number,
    createdBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export type MediaAssetDoc = InferSchemaType<typeof mediaAssetSchema>;
export const MediaAsset = model("MediaAsset", mediaAssetSchema);

