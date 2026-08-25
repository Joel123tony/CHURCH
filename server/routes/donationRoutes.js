import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import Donation from "../models/Donation.js";
import auth from "../middleware/auth.js";
import { sendEmail } from "../utils/sendEmail.js";

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return "";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const router = express.Router();

// Utility to initialize Razorpay (using dummy keys if not in env to prevent crash)
const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials missing in environment variables.");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Create Razorpay Order
router.post("/create-order", async (req, res) => {
  try {
    const { amount, name, email, phone } = req.body;

    if (!amount || amount < 10) {
      return res.status(400).json({ error: "Invalid amount. Minimum ₹10." });
    }

    const instance = getRazorpayInstance();

    // Razorpay amount is in paise (₹1 = 100 paise)
    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await instance.orders.create(options);

    // Save pending donation in DB
    const donation = new Donation({
      name: name || "Anonymous",
      email: email || "",
      phone: phone || "",
      amount,
      razorpayOrderId: order.id,
      paymentStatus: "Pending",
    });

    await donation.save();

    res.json(order);
  } catch (error) {
    console.error("CREATE ORDER ERROR");
    console.error(error);
    console.error(error.stack);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Verify Payment
router.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error("Razorpay secret key is missing in environment variables.");
    }

    // Verify Signature
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      // Payment is successful
      const donation = await Donation.findOne({ razorpayOrderId: razorpay_order_id });

      if (!donation) {
        return res.status(404).json({ error: "Donation record not found" });
      }

      if (donation.paymentStatus === "Successful") {
        // Idempotency check: if already processed by webhook, just return success
        return res.json({ status: "success", message: "Payment already verified successfully" });
      }

      donation.paymentStatus = "Successful";
      donation.razorpayPaymentId = razorpay_payment_id;
      donation.razorpaySignature = razorpay_signature;
      donation.transactionDate = new Date();
      donation.paymentMethod = "Razorpay";
      await donation.save();

      // Send email receipt if email exists
      if (donation.email) {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #531B24; text-align: center;">Methodist Tamil Church</h2>
            <h3 style="text-align: center; color: #4CAF50;">Donation Received Successfully!</h3>
            <p>Dear ${donation.name},</p>
            <p>Thank you so much for your generous giving. Your support helps sustain our worship services, outreach programs, and community ministries.</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Amount:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatCurrency(donation.amount)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Transaction ID:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${razorpay_payment_id}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Date:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date().toLocaleDateString()}</td>
              </tr>
            </table>
            <p style="margin-top: 20px; text-align: center; color: #666; font-size: 14px;">God bless you abundantly!</p>
          </div>
        `;
        // Fire and forget
        sendEmail(donation.email, "Thank you for your Donation - MTC", emailHtml).catch(console.error);
      }

      return res.json({ status: "success", message: "Payment verified successfully" });
    } else {
      // Signature mismatch
      const donation = await Donation.findOne({ razorpayOrderId: razorpay_order_id });
      if (donation) {
        donation.paymentStatus = "Failed";
        await donation.save();
      }
      return res.status(400).json({ status: "failure", error: "Invalid signature" });
    }
  } catch (error) {
    console.error("Razorpay Verify Error:", error);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

// Get all donations
router.get("/", auth, async (req, res) => {
  try {
    const donations = await Donation.find().sort({ transactionDate: -1 });
    res.json(donations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get donation stats
router.get("/stats", auth, async (req, res) => {
  try {
    const now = new Date();

    // Start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Start of this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalStats, todayStats, monthStats, successCount, failedCount, pendingCount, totalTransactions] = await Promise.all([
      Donation.aggregate([
        { $match: { paymentStatus: "Successful" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Donation.aggregate([
        { $match: { paymentStatus: "Successful", transactionDate: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Donation.aggregate([
        { $match: { paymentStatus: "Successful", transactionDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Donation.countDocuments({ paymentStatus: "Successful" }),
      Donation.countDocuments({ paymentStatus: "Failed" }),
      Donation.countDocuments({ paymentStatus: "Pending" }),
      Donation.countDocuments()
    ]);

    res.json({
      totalDonations: totalStats[0]?.total || 0,
      todayDonations: todayStats[0]?.total || 0,
      monthDonations: monthStats[0]?.total || 0,
      successCount,
      failedCount,
      pendingCount,
      totalTransactions
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export const donationWebhookHandler = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.warn("Webhook secret not configured. Skipping webhook verification.");
      return res.status(200).send("OK");
    }

    const signature = req.headers["x-razorpay-signature"];
    if (!signature) {
      return res.status(400).send("No signature found");
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body.toString("utf-8"))
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).send("Invalid signature");
    }

    const payload = JSON.parse(req.body.toString("utf-8"));
    const event = payload.event;
    
    if (event === "payment.captured") {
      const payment = payload.payload.payment.entity;
      const razorpay_order_id = payment.order_id;
      const razorpay_payment_id = payment.id;

      const donation = await Donation.findOne({ razorpayOrderId: razorpay_order_id });
      
      if (donation && donation.paymentStatus !== "Successful") {
        donation.paymentStatus = "Successful";
        donation.razorpayPaymentId = razorpay_payment_id;
        donation.transactionDate = new Date();
        donation.paymentMethod = payment.method || "Razorpay";
        await donation.save();

        if (donation.email) {
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #531B24; text-align: center;">Methodist Tamil Church</h2>
              <h3 style="text-align: center; color: #4CAF50;">Donation Received Successfully!</h3>
              <p>Dear ${donation.name},</p>
              <p>Thank you so much for your generous giving. Your support helps sustain our worship services, outreach programs, and community ministries.</p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Amount:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatCurrency(donation.amount)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Transaction ID:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;">${razorpay_payment_id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Date:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date().toLocaleDateString()}</td>
                </tr>
              </table>
              <p style="margin-top: 20px; text-align: center; color: #666; font-size: 14px;">God bless you abundantly!</p>
            </div>
          `;
          sendEmail(donation.email, "Thank you for your Donation - MTC", emailHtml).catch(console.error);
        }
      }
    }
    
    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).send("Internal Server Error");
  }
};

export default router;
