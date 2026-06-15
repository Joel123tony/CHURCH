import { transliterate } from "transliteration";
import translate from "@vitalets/google-translate-api";

// -----------------------------
// 🔤 SMART NAME CLEANER
// -----------------------------
export function cleanName(name) {
  if (!name) return "";

  const map = {
    joe: "ஜோ",
    john: "ஜான்",
    paul: "பால்",
    joseph: "ஜோசப்",
    david: "டேவிட்",
    michael: "மைக்கேல்"
  };

  return name
    .toLowerCase()
    .split(" ")
    .map(n => map[n] || transliterate(n))
    .join(" ");
}

// -----------------------------
// ✂️ PRAYER TEXT CLEANER
// -----------------------------
export function cleanPrayerText(text) {
  if (!text) return "";

  return text
    // remove bible-style long phrases
    .replace(/our father in heaven/gi, "")
    .replace(/amen/gi, "")
    .replace(/lord we pray/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// -----------------------------
// 🌍 TRANSLATION SAFE
// -----------------------------
async function translateSafe(text, to) {
  try {
    const res = await translate(text, { to });
    return res.text;
  } catch {
    return text;
  }
}

// -----------------------------
// 🚀 MAIN CLEAN ENGINE
// -----------------------------
export async function cleanPrayerEngine(requests) {
  let result = [];

  for (const r of requests) {
    const cleanNameTA = cleanName(r.name);

    const cleaned = cleanPrayerText(r.request);

    const ta = await translateSafe(cleaned, "ta");
    const en = await translateSafe(cleaned, "en");

    result.push({
      nameEN: r.name,
      nameTA: cleanNameTA,
      requestEN: en,
      requestTA: ta
    });
  }

  return result;
}