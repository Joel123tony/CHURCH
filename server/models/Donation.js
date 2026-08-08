import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Anonymous",
    },
    email: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
      min: [10, "Minimum donation amount is INR 10"],
    },
    currency: {
      type: String,
      default: "INR",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Successful", "Failed"],
      default: "Pending",
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      default: "",
    },
    razorpaySignature: {
      type: String,
      default: "",
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      default: "", // Can be filled if razorpay provides it, usually just 'Razorpay'
    },
  },
  { timestamps: true }
);

export default mongoose.model("Donation", donationSchema);
