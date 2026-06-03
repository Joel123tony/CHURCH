import { Schema, model, type InferSchemaType } from "mongoose";

const eventSchema = new Schema(
  {
    banner: String,
    title: { type: String, required: true },
    date: { type: Date, required: true },
    time: String,
    location: String,
    description: String,
    registrationLink: String,
    archived: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export type EventDoc = InferSchemaType<typeof eventSchema>;
export const Event = model("Event", eventSchema);

