import mongoose from "mongoose";

const pastorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      default: "Pastor",
      trim: true,
    },

    bio: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      url: {
        type: String,
        default: "",
      },

      public_id: {
        type: String,
        default: "",
      },
    },

    joinedYear: {
      type: Number,
      required: true,
    },

    leftYear: {
      type: Number,
      default: null,
    },

    serviceHistory: {
      type: [
        {
          role: { type: String, default: "Pastor" },
          joinedYear: { type: Number, required: true },
          leftYear: { type: Number, default: null },
        },
      ],
      default: [],
    },

    // ✅ FIXED
    education: {
      type: [String],
      default: [],
    },

    church: {
      type: String,
      default: "Methodist Tamil Church Padikuppam",
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    number: {
      type: String,
      default: "",
      trim: true,
    },

    isCurrent: {
      type: Boolean,
      default: false,
    },

    active: {
      type: Boolean,
      default: true,
    },

    photo: {
      type: String,
      default: "",
    },

    details: {
      type: String,
      default: "",
    },

    currentPastor: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

pastorSchema.index({ active: 1, joinedYear: -1 });
pastorSchema.index({ isCurrent: 1 });

export default mongoose.model("Pastor", pastorSchema);