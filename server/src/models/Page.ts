import { Schema, model, type InferSchemaType } from "mongoose";

const pageSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    subtitle: String,
    description: String,
    seo: {
      title: String,
      description: String,
      image: String
    },
    visibleInNav: { type: Boolean, default: true },
    published: { type: Boolean, default: false },
    layout: [String]
  },
  { timestamps: true }
);

export type PageDoc = InferSchemaType<typeof pageSchema>;
export const Page = model("Page", pageSchema);

