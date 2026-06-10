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

    education: {
      type: String,
      default: "",
      trim: true,
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

    currentPastor: {
      type: Boolean,
      default: false,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Pastor", pastorSchema);