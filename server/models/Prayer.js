import mongoose from "mongoose";

const prayerSchema = new mongoose.Schema({
  name: String,
  nameTamil: String,
  request: String,
  requestTamil: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Prayer", prayerSchema);