import { Schema, model, type InferSchemaType } from "mongoose";

const prayerRequestSchema = new Schema(
  {
    name: String,
    email: String,
    message: { type: String, required: true },
    status: { type: String, enum: ["pending", "archived", "completed"], default: "pending" },
    notes: String
  },
  { timestamps: true }
);

export type PrayerRequestDoc = InferSchemaType<typeof prayerRequestSchema>;
export const PrayerRequest = model("PrayerRequest", prayerRequestSchema);

