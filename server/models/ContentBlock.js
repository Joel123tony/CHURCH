import mongoose from "mongoose";

const ContentBlockSchema = new mongoose.Schema({
  key: {
    type: String,
    unique: true
  },

  data: {
    type: Object,
    default: {}
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

ContentBlockSchema.index({ key: 1 });

export default mongoose.model("ContentBlock", ContentBlockSchema);