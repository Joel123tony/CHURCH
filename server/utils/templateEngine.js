export function formatPrayerTemplate(requests, mode = "en-ta") {
  let output = "";

  // =========================
  // 🇬🇧 ENGLISH ONLY (EXACT TEMPLATE)
  // =========================
  if (mode === "en") {
    output += `Prayer request\n\n`;
    output += `Name\n\n`;
    output += `Request\n`;

    return output;
  }

  // =========================
  // 🇮🇳 TAMIL ONLY (EXACT TEMPLATE)
  // =========================
  if (mode === "ta") {
    output += `பிரார்த்தனை கோரிக்கை\n\n`;
    output += `பெயர்\n\n`;
    output += `கோரிக்கை\n`;

    return output;
  }

  // =========================
  // 🌐 ENGLISH + TAMIL (STRICT FORMAT)
  // =========================
  if (mode === "en-ta") {
    output += `Prayer request\n\n`;
    output += `Name\n\n`;
    output += `Request\n\n`;

    output += `------------------------------------------------------------------------------------------\n\n`;

    output += `பிரார்த்தனை கோரிக்கை\n\n`;
    output += `பெயர்\n\n`;
    output += `கோரிக்கை\n`;

    return output;
  }

  // =========================
  // 🔢 MULTIPLE REQUESTS (STRICT FORMAT)
  // =========================
  if (mode === "multi") {
    output += `Prayer request\n\n`;

    requests.forEach((r, i) => {
      output += `${i + 1}\tName\n\n`;
      output += `\tRequest\n\n`;
    });

    output += `----------------------------------------------------------------------------------------------\n\n`;

    output += `பிரார்த்தனை கோரிக்கை\n\n`;

    requests.forEach((r, i) => {
      output += `${i + 1}\tபெயர்\n\n`;
      output += `\tகோரிக்கை\n\n`;
    });

    return output;
  }

  return output;
}