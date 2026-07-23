import { cleanLyricsText, structureLyrics } from "./cleaner.js";
import { extractMetadata } from "./metadata.js";
import stringSimilarity from "string-similarity";

const lineSignature = (line = "") => cleanLyricsText(line).toLowerCase().replace(/[^\w\u0B80-\u0BFF]+/g, "");

const mergeTextBlocks = (base = "", extra = "") => {
  const seen = new Set();
  const merged = [];

  for (const block of [base, extra]) {
    for (const line of cleanLyricsText(block).split("\n")) {
      const sig = lineSignature(line);
      if (!sig || seen.has(sig)) continue;
      seen.add(sig);
      merged.push(line);
    }
  }

  return merged.join("\n");
};

import { validateLyrics } from "./validator.js";

export const computeLyricsQualityScore = (version) => {
  const lyrics = version.lyrics || version.cleanedLyrics || "";
  const validation = validateLyrics(lyrics, [], version);
  return validation.score;
};

export const mergeSongVersions = (versions = [], context = {}) => {
  const scoredVersions = versions
    .filter(Boolean)
    .map((version, index) => {
      const cleaned = cleanLyricsText(version.lyrics || version.cleanedLyrics || version.cleanLyrics || "");
      const qualityScore = computeLyricsQualityScore({ ...version, cleanedLyrics: cleaned });
      return {
        ...version,
        index,
        cleanedLyrics: cleaned,
        qualityScore,
        confidenceScore: Number(version.confidenceScore || version.aiConfidence || qualityScore)
      };
    })
    // Sort primarily by calculated quality score
    .sort((a, b) => b.qualityScore - a.qualityScore);

  const best = scoredVersions[0] || {};
  let aiNeedsReview = false;

  const mergedLyrics = scoredVersions.reduce((acc, version, index) => {
    if (index === 0) return version.cleanedLyrics || acc;
    
    // Conflict detection: If versions have very different line counts and both have high scores, it might be a conflict.
    const accLines = acc.split('\n').filter(l => l.trim().length > 0);
    const verLines = (version.cleanedLyrics || "").split('\n').filter(l => l.trim().length > 0);
    
    if (Math.abs(accLines.length - verLines.length) > 10 && version.qualityScore > 80) {
        aiNeedsReview = true;
    }

    // Only merge non-conflicting new blocks
    return mergeTextBlocks(acc, version.cleanedLyrics || "");
  }, "");

  const metadata = extractMetadata(mergedLyrics || best.cleanedLyrics || "", context, {
    title: best.title || context.title || "",
    alternateTitle: best.titleEnglish || best.alternateTitle || "",
    author: best.author || "",
    composer: best.composer || "",
    album: best.album || "",
    year: best.year || "",
    themes: Array.from(new Set(scoredVersions.flatMap((version) => version.themes || []))),
    tags: Array.from(new Set(scoredVersions.flatMap((version) => version.keywords || version.tags || []))),
    scriptureReferences: Array.from(new Set(scoredVersions.flatMap((version) => version.bibleReferences || version.scriptureReferences || []))),
    language: best.language || context.language || "Tamil"
  });

  // Calculate Graph Links for variations that might be related but not merged perfectly
  const graphLinks = [];
  const primaryTitle = metadata.title || "";
  const primaryEnglishTitle = metadata.alternateTitle || "";

  scoredVersions.forEach((v) => {
      const vTitle = v.title || "";
      const vEnglishTitle = v.titleEnglish || v.alternateTitle || "";

      if (vTitle && primaryTitle && vTitle !== primaryTitle) {
          const sim = stringSimilarity.compareTwoStrings(primaryTitle.toLowerCase(), vTitle.toLowerCase());
          if (sim >= 0.7 && sim < 1.0) {
              graphLinks.push({ title: vTitle, relationType: "similar_title", score: Math.round(sim * 100) });
          }
      }
      if (vEnglishTitle && primaryEnglishTitle && vEnglishTitle !== primaryEnglishTitle) {
          const sim = stringSimilarity.compareTwoStrings(primaryEnglishTitle.toLowerCase(), vEnglishTitle.toLowerCase());
          if (sim >= 0.8 && sim < 1.0) {
              graphLinks.push({ title: vEnglishTitle, relationType: "alternate_spelling", score: Math.round(sim * 100) });
          }
      }
  });

  return {
    mergedLyrics: structureLyrics(mergedLyrics || best.cleanedLyrics || ""),
    mergedMetadata: metadata,
    versions: scoredVersions,
    primaryVersion: best,
    aiNeedsReview,
    graphLinks,
    providerHistory: scoredVersions.map((version) => ({
      provider: version.aiProvider || version.source || "unknown",
      title: version.title || "",
      qualityScore: version.qualityScore || 0,
      confidenceScore: version.confidenceScore || 0
    }))
  };
};
