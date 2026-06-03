import { Schema, model, type InferSchemaType } from "mongoose";

const buttonSchema = new Schema(
  {
    label: String,
    link: String
  },
  { _id: false }
);

const sectionSchema = new Schema(
  {
    pageSlug: { type: String, required: true, index: true },
    key: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: String,
    description: String,
    richText: String,
    backgroundImage: String,
    backgroundVideo: String,
    ctaButtons: [buttonSchema],
    blocks: [Schema.Types.Mixed],
    order: { type: Number, default: 0 },
    hidden: { type: Boolean, default: false },
    published: { type: Boolean, default: false },
    duplicatedFrom: String
  },
  { timestamps: true }
);

sectionSchema.index({ pageSlug: 1, order: 1 });

export type SectionDoc = InferSchemaType<typeof sectionSchema>;
export const Section = model("Section", sectionSchema);
