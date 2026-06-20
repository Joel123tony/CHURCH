const TAMIL_RE = /[\u0B80-\u0BFF]/;

const EXACT_EN_PRAYER_BLOCK =
  "Please pray, as our Father in heaven taught us to pray, our Father in heaven, hallowed be your name. Your kingdom come. Give us today our daily bread. Forgive us our sins as we forgive those who sin against us.";

const EXACT_TA_PRAYER_BLOCK =
  "ஜெபியுங்கள், எங்கள் பரலோகத் தகப்பன் எப்படி ஜெபிக்க நினைத்தாரோ அதைப் போல, பரலோகத்திலிருக்கிற எங்கள் பிதாவே, உமது நாமம் பரிசுத்தப்படுத்தப்படட்டும். உமது ராஜ்யம் வருக. எங்களுடைய அன்றாட உணவை இந்த நாளில் எங்களுக்குக் கொடுங்கள். எங்களுக்கு எதிராக குற்றம் செய்பவர்களை நாங்கள் மன்னிப்பது போல, எங்கள் குற்றங்களை எங்களுக்கு மன்னியும்.";

const EN_TO_TA_PHRASES = [
  ["Please uphold the following requests in prayer.", "தயவுசெய்து கீழே உள்ள வேண்டுதல்களை ஜெபத்தில் நினைவில் கொள்ளுங்கள்."],
  ["Please uphold these requests in prayer.", "தயவுசெய்து இந்த வேண்டுதல்களை ஜெபத்தில் நினைவில் கொள்ளுங்கள்."],
  ["Please pray, as our Father in heaven taught us to pray,", "ஜெபியுங்கள், எங்கள் பரலோகத் தகப்பன் எப்படி ஜெபிக்க நினைத்தாரோ அதைப் போல,"],
  ["Our Father in heaven", "பரலோகத்திலிருக்கிற எங்கள் பிதாவே"],
  ["hallowed be your name", "உமது நாமம் பரிசுத்தப்படுத்தப்படட்டும்"],
  ["your kingdom come", "உமது ராஜ்யம் வருக"],
  ["give us today our daily bread", "எங்களுடைய அன்றாட உணவை இந்த நாளில் எங்களுக்குக் கொடுங்கள்"],
  [
    "forgive us our sins as we forgive those who sin against us",
    "எங்களுக்கு எதிராக குற்றம் செய்பவர்களை நாங்கள் மன்னிப்பது போல, எங்கள் குற்றங்களை எங்களுக்கு மன்னியும்",
  ],
  ["Prayer Requests", "ஜெப விண்ணப்பங்கள்"],
  ["Methodist Tamil Church", "மெதடிஸ்ட் தமிழ் திருச்சபை"],
  ["Name", "பெயர்"],
  ["Request", "கோரிக்கை"],
];

const TA_TO_EN_PHRASES = [
  ["தயவுசெய்து கீழே உள்ள வேண்டுதல்களை ஜெபத்தில் நினைவில் கொள்ளுங்கள்.", "Please uphold the following requests in prayer."],
  ["தயவுசெய்து இந்த வேண்டுதல்களை ஜெபத்தில் நினைவில் கொள்ளுங்கள்.", "Please uphold these requests in prayer."],
  ["ஜெபியுங்கள், எங்கள் பரலோகத் தகப்பன் எப்படி ஜெபிக்க நினைத்தாரோ அதைப் போல,", "Please pray, as our Father in heaven taught us to pray,"],
  ["பரலோகத்திலிருக்கிற எங்கள் பிதாவே", "Our Father in heaven"],
  ["உமது நாமம் பரிசுத்தப்படுத்தப்படட்டும்", "hallowed be your name"],
  ["உமது ராஜ்யம் வருக", "your kingdom come"],
  ["எங்களுடைய அன்றாட உணவை இந்த நாளில் எங்களுக்குக் கொடுங்கள்", "give us today our daily bread"],
  [
    "எங்களுக்கு எதிராக குற்றம் செய்பவர்களை நாங்கள் மன்னிப்பது போல, எங்கள் குற்றங்களை எங்களுக்கு மன்னியும்",
    "forgive us our sins as we forgive those who sin against us",
  ],
  ["ஜெப விண்ணப்பங்கள்", "Prayer Requests"],
  ["மெதடிஸ்ட் தமிழ் திருச்சபை", "Methodist Tamil Church"],
  ["பெயர்", "Name"],
  ["கோரிக்கை", "Request"],
];

const EN_NAME_TO_TA = [
  ["joe", "ஜோ"],
  ["josh", "ஜோஷ்"],
  ["john", "ஜான்"],
  ["paul", "பால்"],
  ["joseph", "ஜோசப்"],
  ["david", "டேவிட்"],
  ["michael", "மைக்கேல்"],
  ["stephen", "ஸ்டீபன்"],
];

const TA_NAME_TO_EN = [
  ["ஜோ", "Joe"],
  ["ஜோஷ்", "Josh"],
  ["ஜான்", "John"],
  ["பால்", "Paul"],
  ["ஜோசப்", "Joseph"],
  ["டேவிட்", "David"],
  ["மைக்கேல்", "Michael"],
  ["ஸ்டீபன்", "Stephen"],
];

const canonicalize = (text = "") =>
  String(text)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0B80-\u0BFF]+/g, "");

const isTamil = (text = "") => TAMIL_RE.test(text);

const normalizeText = (text = "") => String(text).replace(/\s+/g, " ").trim();

const applyPhraseMap = (text, map) => {
  const sorted = [...map].sort((a, b) => b[0].length - a[0].length);
  let output = text;

  for (const [from, to] of sorted) {
    const pattern = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    output = output.replace(pattern, to);
  }

  return output;
};

const localTranslate = (text, targetLanguage) => {
  const normalized = normalizeText(text);
  if (!normalized) return "";

  const canonical = canonicalize(normalized);
  const enCanonical = canonicalize(EXACT_EN_PRAYER_BLOCK);
  const taCanonical = canonicalize(EXACT_TA_PRAYER_BLOCK);

  if (targetLanguage === "en" && canonical.includes(taCanonical)) return EXACT_EN_PRAYER_BLOCK;
  if (targetLanguage === "ta" && canonical.includes(enCanonical)) return EXACT_TA_PRAYER_BLOCK;

  if (targetLanguage === "ta") {
    return applyPhraseMap(normalized, EN_TO_TA_PHRASES);
  }

  if (targetLanguage === "en") {
    return applyPhraseMap(normalized, TA_TO_EN_PHRASES);
  }

  return normalized;
};

export async function translatePrayerText(text, targetLanguage) {
  const normalized = normalizeText(text);
  if (!normalized) return "";

  if (isTamil(normalized) && targetLanguage === "ta") return normalized;
  if (!isTamil(normalized) && targetLanguage === "en") return normalized;

  const localResult = localTranslate(normalized, targetLanguage);
  if (localResult && localResult !== normalized) return localResult;

  const lowered = normalized.toLowerCase();
  if (targetLanguage === "ta") {
    const match = EN_NAME_TO_TA.find(([from]) => lowered === from);
    if (match) return match[1];
  }

  if (targetLanguage === "en") {
    const match = TA_NAME_TO_EN.find(([from]) => normalized === from);
    if (match) return match[1];
  }

  return normalized;
}

export async function translatePrayerItems(items = [], mode = "en") {
  const targetModes =
    mode === "both" ? ["en", "ta"] : mode === "tamil" ? ["ta"] : ["en"];

  return Promise.all(
    items.map(async (item) => {
      const name = normalizeText(item?.name);
      const request = normalizeText(item?.request);

      const [requestEN, requestTA, nameEN, nameTA] = await Promise.all([
        targetModes.includes("en") ? translatePrayerText(request, "en") : Promise.resolve(request),
        targetModes.includes("ta") ? translatePrayerText(request, "ta") : Promise.resolve(request),
        targetModes.includes("en") ? translatePrayerText(name, "en") : Promise.resolve(name),
        targetModes.includes("ta") ? translatePrayerText(name, "ta") : Promise.resolve(name),
      ]);

      return {
        nameEN: nameEN || name,
        nameTA: nameTA || name,
        requestEN: requestEN || request,
        requestTA: requestTA || request,
      };
    })
  );
}
