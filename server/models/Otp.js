import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true,
  },
  otpHash: { 
    type: String, 
    required: true,
  },
  attempts: {
    type: Number,
    default: 0
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: 600 // Automatically delete document after 600 seconds (10 minutes)
  }
});

export default mongoose.model("Otp", otpSchema);
