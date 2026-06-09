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
      type: String,
      default: "",
    },

    joinedYear: {
      type: Number,
      default: null,
    },

    leftYear: {
      type: Number,
      default: null,
    },

    number: {
      type: String,
      default: "",
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Pastor = mongoose.model("Pastor", pastorSchema);

export default Pastor;