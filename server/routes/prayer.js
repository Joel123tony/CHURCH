import express from "express";
import { cleanPrayerEngine } from "../utils/prayerCleaner.js";

const router = express.Router();

router.post("/format", async (req, res) => {
  try {
    const { requests, mode = "en-ta" } = req.body;

    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Requests must be a non-empty array"
      });
    }

    const cleaned = await cleanPrayerEngine(requests);

    let output = "";

    // =========================
    // 🌐 ENGLISH ONLY
    // =========================
    if (mode === "en") {
      output += `*METHODIST TAMIL CHURCH*\n*PRAYER REQUESTS*\n\n`;

      cleaned.forEach((r, i) => {
        output += `${i + 1}. Name: ${r.nameEN}\n`;
        output += `Request: ${r.requestEN}\n\n`;
      });
    }

    // =========================
    // 🇮🇳 TAMIL ONLY
    // =========================
    if (mode === "ta") {
      output += `*மெதடிஸ்ட் தமிழ் திருச்சபை*\n*ஜெப விண்ணப்பங்கள்*\n\n`;

      cleaned.forEach((r, i) => {
        output += `${i + 1}. பெயர்: ${r.nameTA}\n`;
        output += `கோரிக்கை: ${r.requestTA}\n\n`;
      });
    }

    // =========================
    // 🌐 EN + TA
    // =========================
    if (mode === "en-ta") {
      output += `*METHODIST TAMIL CHURCH*\n*PRAYER REQUESTS / ஜெப விண்ணப்பங்கள்*\n\n`;

      cleaned.forEach((r, i) => {
        output += `${i + 1}. ${r.nameTA}\n\n`;
        output += `${r.requestTA}\n`;
        output += `${r.requestEN}\n\n`;
        output += `--------------------------\n\n`;
      });
    }

    // =========================
    // 🔢 MULTI MODE
    // =========================
    if (mode === "multi") {
      output += `*METHODIST TAMIL CHURCH*\n*PRAYER REQUESTS*\n\n`;

      cleaned.forEach((r, i) => {
        output += `${i + 1}\tName\n\tRequest\n\n`;
      });

      output += `------------------------------------\n\n`;

      output += `*ஜெப விண்ணப்பங்கள்*\n\n`;

      cleaned.forEach((r, i) => {
        output += `${i + 1}\tபெயர்\n\tகோரிக்கை\n\n`;
      });
    }

    res.json({
      success: true,
      template: output,
      whatsapp: output,
      voice: output.replace(/\n/g, " "),
      data: cleaned,
      mode
    });

  } catch (err) {
    console.error("Prayer API Error:", err);

    res.status(500).json({
      success: false,
      message: "Server error while processing prayer requests",
      error: err.message
    });
  }
});

export default router;