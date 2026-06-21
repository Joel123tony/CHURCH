import express from "express";
import { formatPrayerByMode } from "../utils/languageFormatter.js";

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

const buildMessage = (formatted, mode) => {
  const header = buildHeader(mode);

  if (!Array.isArray(formatted) || formatted.length === 0) {
    return header.trim();
  }

  if (mode === "ta") {
    return [
      header,
      ...formatted.map(
        (item, index) =>
          `${index + 1}. பெயர்: ${item.taName || item.enName || "-"}\nகோரிக்கை: ${item.taReq || item.enReq || "-"}`
      ),
    ].join("\n\n");
  }

  if (mode === "en-ta") {
    return [
      header,
      ...formatted.map((item, index) => {
        const englishBlock = [
          `${index + 1}. Name: ${item.enName || item.taName || "-"}`,
          `Request: ${item.enReq || item.taReq || "-"}`,
        ].join("\n");

        const tamilBlock = [
          `${index + 1}. பெயர்: ${item.taName || item.enName || "-"}`,
          `கோரிக்கை: ${item.taReq || item.enReq || "-"}`,
        ].join("\n");

        return `${englishBlock}\n\n${tamilBlock}`;
      }),
    ].join("\n\n----------------------------------------\n\n");
  }

  return [
    header,
    ...formatted.map(
      (item, index) =>
        `${index + 1}. Name: ${item.enName || item.taName || "-"}\nRequest: ${item.enReq || item.taReq || "-"}`
    ),
  ].join("\n\n");
};

router.post("/format", async (req, res) => {
  try {
    const { requests, mode = "en-ta" } = req.body;

    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Requests must be a non-empty array",
      });
    }

    const normalizedMode = ["en", "ta", "en-ta"].includes(mode) ? mode : "en-ta";
    const formatted = await formatPrayerByMode(requests, normalizedMode);
    const output = buildMessage(formatted, normalizedMode);

    return res.json({
      success: true,
      template: output,
      whatsapp: output,
      voice: output.replace(/\n/g, " "),
      data: formatted,
      mode: normalizedMode,
    });
  } catch (err) {
    console.error("Prayer API Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error while processing prayer requests",
      error: err.message,
    });
  }
});

export default router;
