import fetch from "node-fetch";

// ─── Terminology Glossary (Overrides for strict quality) ─────────────


// ─── In-memory translation cache ───────────────────────────────────
const cache = new Map();

function cacheKey(text, target) {
  return `${target}:${text}`;
}

// ─── Translate a batch of texts via Google Translate (free endpoint) ─
async function translateBatch(texts, targetLang = "ta", sourceLang = "en") {
  const results = [];

  // Google's free endpoint handles one text at a time reliably.
  // We batch by combining with a unique separator, then splitting.
  const SEPARATOR = "\n__SEP__\n"; // string separator that survives translation
  const chunk = texts.join(SEPARATOR);

  try {
    const url = new URL("https://translate.googleapis.com/translate_a/single");
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", sourceLang);
    url.searchParams.set("tl", targetLang);
    url.searchParams.set("dt", "t");

    const body = new URLSearchParams();
    body.append("q", chunk);

    const res = await fetch(url.toString(), {
      method: "POST",
      body: body,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!res.ok) {
      throw new Error(`Google Translate responded with ${res.status}`);
    }

    const data = await res.json();

    // Response format: [[["translated","original",...], ...], ...]
    const translatedChunk = (data?.[0] || [])
      .map((seg) => seg?.[0] || "")
      .join("");

    const parts = translatedChunk.split(/\s*__SEP__\s*/i);

    for (let i = 0; i < texts.length; i++) {
      results.push(parts[i]?.trim() || texts[i]);
    }
  } catch (err) {
    console.error("Translation batch failed:", err.message);
    // On failure, return original texts (graceful fallback)
    return texts.map((t) => t);
  }

  return results;
}

// ─── Controller ────────────────────────────────────────────────────
export async function translate(req, res) {
  try {
    const { texts, targetLang = "ta" } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "texts must be a non-empty array of strings",
      });
    }

    // Limit batch size to prevent abuse
    if (texts.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Maximum 200 texts per request",
      });
    }

    const results = new Array(texts.length);
    const uncachedIndices = [];
    const uncachedTexts = [];

    // Check cache and glossary for each text
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      // Skip empty/whitespace-only strings
      if (!text || !text.trim()) {
        results[i] = text;
        continue;
      }

      // 2. Check Cache
      const key = cacheKey(text, targetLang);
      if (cache.has(key)) {
        results[i] = cache.get(key);
      } else {
        uncachedIndices.push(i);
        uncachedTexts.push(text);
      }
    }

    // Translate uncached texts in chunks of 50
    if (uncachedTexts.length > 0) {
      const CHUNK_SIZE = 50;

      for (let start = 0; start < uncachedTexts.length; start += CHUNK_SIZE) {
        const batchTexts = uncachedTexts.slice(start, start + CHUNK_SIZE);
        const batchIndices = uncachedIndices.slice(start, start + CHUNK_SIZE);
        const translated = await translateBatch(batchTexts, targetLang);

        for (let j = 0; j < batchTexts.length; j++) {
          const globalIdx = batchIndices[j];
          results[globalIdx] = translated[j];
          // Cache the result
          cache.set(cacheKey(batchTexts[j], targetLang), translated[j]);
        }
      }
    }

    return res.json({
      success: true,
      translations: results,
    });
  } catch (err) {
    console.error("Translation endpoint error:", err);
    return res.status(500).json({
      success: false,
      message: "Translation failed",
      translations: req.body?.texts || [],
    });
  }
}
