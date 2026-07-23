import { normalizeLyricsText } from "../../utils/songNormalization.js";

const COMMON_JUNK_PATTERNS = [
  /^(read more|share|like|follow|subscribe|watch now|click here|download|save|print|email|send|tweet|pin it)$/i,
  /^(home|about|contact|blog|category|tag|search|menu|navigation|lyrics|songs|albums|artists|login|register)$/i,
  /^(copyright|all rights reserved|powered by|privacy policy|terms of service|disclaimer|cookie policy)$/i,
  /^https?:\/\//i,
  /\bfacebook\b|\binstagram\b|\byoutube\b|\btwitter\b|\bwhatsapp\b|\bpinterest\b/i,
  /tamil christians songs/i,
  /god medias/i,
  /tamil christian worship/i,
  /world tamil christians/i,
  /tamilchristian\.com/i,
  /the god's music/i,
  /ccli/i,
  /^\d+\s*views$/i,
  /^added by/i,
  /^sung by/i,
  /related songs/i,
  /leave a comment/i
];

const fixBrokenEncoding = (text = "") => {
  if (!text) return "";
  if (/Ã|Â|â€™|â€“|â€”|à®|à¤/.test(text)) {
    try {
      const repaired = Buffer.from(text, "latin1").toString("utf8");
      if (repaired && repaired.length >= Math.min(text.length, 12)) {
        return repaired;
      }
    } catch {
      // ignore and fall through
    }
  }
  return text;
};

export const cleanLyricsText = (input = "") => {
  const repaired = fixBrokenEncoding(String(input || ""));
  const normalized = normalizeLyricsText(repaired);
  return normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !COMMON_JUNK_PATTERNS.some((pattern) => pattern.test(line)))
    .join("\n");
};

export const detectSections = (lyrics = "") => {
  if (lyrics.trim() === "pending_fetch") {
    return [];
  }
  const lines = cleanLyricsText(lyrics).split("\n").map((line) => line.trim()).filter(Boolean);
  const sections = [];
  let current = [];
  let currentLabel = "Verse 1";
  let verseIndex = 1;

  const pushCurrent = () => {
    if (current.length === 0) return;
    sections.push({ label: currentLabel, lines: [...current] });
    current = [];
  };

  for (const line of lines) {
    const labelMatch = line.toLowerCase().match(/^(verse\s*\d+|chorus|bridge|intro|ending|refrain)\b/i);
    if (labelMatch) {
      pushCurrent();
      const raw = labelMatch[1].toLowerCase();
      currentLabel = raw.startsWith("verse") ? `Verse ${raw.match(/\d+/)?.[0] || verseIndex}` : raw[0].toUpperCase() + raw.slice(1);
      if (raw.startsWith("verse")) verseIndex += 1;
      continue;
    }

    current.push(line);
  }

  pushCurrent();

  if (sections.length === 0 && lines.length > 0) {
    const chunkSize = Math.max(4, Math.ceil(lines.length / 4));
    for (let i = 0; i < lines.length; i += chunkSize) {
      const chunk = lines.slice(i, i + chunkSize);
      sections.push({ label: i === 0 ? "Verse 1" : `Verse ${Math.floor(i / chunkSize) + 1}`, lines: chunk });
    }
  }

  return sections;
};

export const structureLyrics = (lyrics = "") => {
  if (lyrics.trim() === "pending_fetch") return "pending_fetch";
  const sections = detectSections(lyrics);
  return sections
    .map((section) => `${section.label}\n${section.lines.join("\n")}`.trim())
    .join("\n\n")
    .trim();
};
