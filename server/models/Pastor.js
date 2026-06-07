import mongoose from "mongoose";

const pastorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    joinedYear: {
      type: Number,
      required: true,
    },
    leftYear: {
      type: Number,
      default: null,
    },
    details: {
      type: String,
      default: "",
    },
    image: {
      url: {
        type: String,
        default: "",
      },
      public_id: {
        type: String,
        default: null,
      },
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

pastorSchema.virtual("photo").get(function () {
  return this.image?.url || "";
});

export default mongoose.models.Pastor || mongoose.model("Pastor", pastorSchema);
