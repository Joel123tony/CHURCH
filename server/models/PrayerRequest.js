import mongoose from "mongoose";

const prayerRequestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      default: "",
    },

    request: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "prayed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "PrayerRequest",
  prayerRequestSchema
);