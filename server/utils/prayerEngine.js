import { transliterate } from "transliteration";
import { franc } from "franc";
import { translate } from "@vitalets/google-translate-api";

// 🧠 CHURCH NAME ENGINE (SMART)
function smartName(name) {
  if (!name) return "";

  const map = {
    john: "ஜான்",
    paul: "பால்",
    joseph: "ஜோசப்",
    david: "டேவிட்",
    michael: "மைக்கேல்",
    peter: "பேதுரு",
    james: "ஜேம்ஸ்",
    joe: "ஜோ"
  };

  return name
    .toLowerCase()
    .split(" ")
    .map(n => map[n] || transliterate(n))
    .join(" ");
}

// 🌍 DETECT LANGUAGE
function detectLang(text) {
  const lang = franc(text || "");
  if (lang === "tam") return "ta";
  if (lang === "eng") return "en";
  return "auto";
}

// 🌐 TRANSLATION SAFE
async function translateSafe(text, to) {
  try {
    const res = await translate(text, { to });
    return res.text;
  } catch {
    return text;
  }
}

// 🚀 MAIN ENGINE
export async function processPrayers(list) {
  let result = [];
  let whatsapp = "🙏 PRAYER REQUEST\n\n";

  let count = 1;

  for (const item of list) {
    const nameEN = item.name;
    const nameTA = smartName(item.name);

    const reqEN = await translateSafe(item.request, "en");
    const reqTA = await translateSafe(item.request, "ta");

    result.push({
      nameEN,
      nameTA,
      reqEN,
      reqTA
    });

    whatsapp += `
${count}. Name / பெயர்: ${nameTA}
   Request / வேண்டுகோள்:
   ${reqTA}

-------------------------
`;

    count++;
  }

  return {
    data: result,
    whatsapp,
    voiceReady: whatsapp.replace(/\n/g, " ")
  };
}
