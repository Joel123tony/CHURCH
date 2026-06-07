import mongoose from "mongoose";

const PastorSchema = new mongoose.Schema({
  name: String,
  joinedYear: String,
  leftYear: String,
  details: String,
  photo: String,
  isCurrent: { type: Boolean, default: false }
});

export default mongoose.model("Pastor", PastorSchema);