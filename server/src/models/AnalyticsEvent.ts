import { Schema, model, type InferSchemaType } from "mongoose";

const analyticsEventSchema = new Schema(
  {
    type: { type: String, required: true },
    entityType: String,
    entityId: String,
    path: String,
    searchTerm: String,
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export type AnalyticsEventDoc = InferSchemaType<typeof analyticsEventSchema>;
export const AnalyticsEvent = model("AnalyticsEvent", analyticsEventSchema);

