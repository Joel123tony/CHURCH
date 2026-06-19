import express from "express";
import { cleanPrayerEngine } from "../utils/prayerCleaner.js";

const router = express.Router();

const buildHeader = (mode) => {
  if (mode === "ta") {
    return [
      "*METHODIST TAMIL CHURCH*",
      "*PRAYER REQUESTS*",
      "",
      "தயவுசெய்து கீழே உள்ள வேண்டுதல்களை ஜெபத்தில் நினைவில் கொள்ளுங்கள்.",
      "",
    ].join("\n");
  }

  if (mode === "en-ta") {
    return [
      "*METHODIST TAMIL CHURCH*",
      "*PRAYER REQUESTS / ஜெப விண்ணப்பங்கள்*",
      "",
      "Please uphold the following requests in prayer.",
      "",
    ].join("\n");
  }

  return [
    "*METHODIST TAMIL CHURCH*",
    "*PRAYER REQUESTS*",
    "",
    "Please uphold the following requests in prayer.",
    "",
  ].join("\n");
};

const buildMessage = (cleaned, mode) => {
  const header = buildHeader(mode);

  if (!Array.isArray(cleaned) || !cleaned.length) return header.trim();

  if (mode === "ta") {
    return [
      header,
      ...cleaned.map(
        (item, index) =>
          `${index + 1}. பெயர்: ${item.nameTA || item.nameEN || "-"}\nகோரிக்கை: ${item.requestTA || item.requestEN || "-"}`
      ),
    ].join("\n\n");
  }

  if (mode === "en-ta") {
    return [
      header,
      ...cleaned.map((item, index) => {
        const enBlock = [
          `${index + 1}. Name: ${item.nameEN || item.nameTA || "-"}`,
          `Request: ${item.requestEN || item.requestTA || "-"}`,
        ].join("\n");

        const taBlock = [
          `${index + 1}. பெயர்: ${item.nameTA || item.nameEN || "-"}`,
          `கோரிக்கை: ${item.requestTA || item.requestEN || "-"}`,
        ].join("\n");

        return `${enBlock}\n\n${taBlock}`;
      }),
    ].join("\n\n----------------------------------------\n\n");
  }

  return [
    header,
    ...cleaned.map(
      (item, index) =>
        `${index + 1}. Name: ${item.nameEN || item.nameTA || "-"}\nRequest: ${item.requestEN || item.requestTA || "-"}`
    ),
  ].join("\n\n");
};

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
    const output = buildMessage(cleaned, mode);

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
