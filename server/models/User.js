import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  passwordHash: { type: String },
  role: { type: String, default: "admin" }
});

export default mongoose.model("User", userSchema);