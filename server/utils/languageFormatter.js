import { translate } from "@vitalets/google-translate-api";

// 🔥 translate helper
async function toLang(text, lang) {
  if (lang === "en") return text;

  try {
    const res = await translate(text, { to: lang });
    return res.text;
  } catch {
    return text;
  }
}

// 🧠 MAIN FORMATTER
export async function formatPrayerByMode(requests, mode) {
  let result = [];

  for (const r of requests) {

    let name = r.name;
    let request = r.request;

    let enName = name;
    let taName = name;

    let enReq = request;
    let taReq = request;

    if (mode === "ta") {
      taName = await toLang(name, "ta");
      taReq = await toLang(request, "ta");
    }

    if (mode === "en") {
      enName = await toLang(name, "en");
      enReq = await toLang(request, "en");
    }

    if (mode === "en-ta") {
      taName = await toLang(name, "ta");
      taReq = await toLang(request, "ta");

      enName = await toLang(name, "en");
      enReq = await toLang(request, "en");
    }

    result.push({
      enName,
      taName,
      enReq,
      taReq
    });
  }

  return result;
}
