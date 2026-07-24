import { cleanLyricsText } from "./cleaner.js";

const MIN_LYRIC_LINES = 2;
const MIN_LYRIC_LENGTH = 40;
const COLLECTION_PATTERNS = [
  /related songs?/i,
  /recent songs?/i,
  /archives?/i,
  /categories?/i,
  /archive page/i,
  /song index/i,
  /lyrics index/i,
  /all songs/i,
  /a\s*-\s*z/i,
  /previous song/i,
  /next song/i
];

const NOISE_PATTERNS = [
  /read more/i,
  /share/i,
  /subscribe/i,
  /follow us/i,
  /copyright/i,
  /all rights reserved/i,
  /home/i,
  /menu/i,
  /navigation/i,
  /facebook/i,
  /instagram/i,
  /youtube/i,
  /tamil christian songs?/i,
  /god medias/i
];

export const validateLyrics = (lyrics = "", sections = [], context = {}) => {
  const clean = cleanLyricsText(lyrics);
  
  let originalRaw = context.originalLyrics || lyrics || "";
  try {
    const parsed = JSON.parse(originalRaw);
    if (parsed.isYouTubeSource || parsed.isAiMergedSource) {
      originalRaw = parsed.captions || parsed.rawText || lyrics;
    }
  } catch (e) {
    // Not JSON, ignore
  }
  
  const original = cleanLyricsText(originalRaw);
  const sourceUrl = context.sourceUrl || "";
  const lines = clean.split("\n").map((line) => line.trim()).filter(Boolean);
  const originalLines = original.split("\n").map((line) => line.trim()).filter(Boolean);
  const sectionLabels = sections.map((section) => (section.label || "").toLowerCase());

  const issues = [];
  if (!clean) issues.push("empty lyrics");
  if (lines.length < MIN_LYRIC_LINES) issues.push("too few lines");
  if (clean.length < MIN_LYRIC_LENGTH) issues.push("too short");
  if (!sectionLabels.some((label) => label.includes("chorus"))) issues.push("missing chorus");
  if (sectionLabels.filter((label) => label.includes("verse")).length === 0 && lines.length > 6) issues.push("missing verses");

  const lower = clean.toLowerCase();
  if (/share|subscribe|read more|follow us|copyright|all rights reserved/.test(lower)) {
    issues.push("contains page clutter");
  }
  if (/https?:\/\//.test(clean)) issues.push("contains url noise");
  if (COLLECTION_PATTERNS.some((pattern) => pattern.test(original) || pattern.test(lower))) {
    issues.push("collection page noise");
  }
  if (NOISE_PATTERNS.some((pattern) => pattern.test(original))) {
    issues.push("provider noise");
  }
  if (/\/(category|tag|page|archive)s?\//i.test(sourceUrl)) {
    issues.push("source is a collection page");
  }
  if ((originalLines.filter((line) => NOISE_PATTERNS.some((pattern) => pattern.test(line))).length / Math.max(1, originalLines.length)) > 0.2) {
    issues.push("noise ratio too high");
  }
  if (originalLines.length > 10 && originalLines.filter((line) => line.length < 45).length > 8 && !sectionLabels.some((label) => label.includes("verse"))) {
    issues.push("likely song index or listing");
  }
  if ((context.originalLyrics || "").length > 0 && clean.length < (context.originalLyrics || "").length * 0.4) {
    issues.push("likely truncated");
  }
  if (
    originalLines.length > 12 &&
    originalLines.filter((line) => line.length < 45).length > 8 &&
    COLLECTION_PATTERNS.some((pattern) => pattern.test(original))
  ) {
    issues.push("likely song index or listing");
  }

  // Base score calculation
  let score = 100; 
  
  if (context.author) score += 5;
  if (context.album) score += 5;
  if (context.titleEnglish || context.alternateTitle) score += 5;
  if (context.year) score += 2;

  if (lower.includes("chorus") || lower.includes("பல்லவி")) score += 5;
  if (lower.includes("verse") || lower.includes("சரணம்")) score += 5;
  if (lower.includes("bridge")) score += 2;

  if (/<[a-z][\s\S]*>/i.test(clean)) score -= 20; 
  if (/[#_*~=]{3,}/.test(clean)) score -= 10; 
  
  if (issues.includes("provider noise") || issues.includes("contains page clutter")) {
      score -= 15;
  }

  if (/(\b[CDEFGAB][#b]?m?7?\b\s*){3,}/g.test(clean) || /\[[CDEFGAB][#b]?m?7?\]/g.test(clean)) {
      score -= 20;
  }

  const tamilChars = clean.match(/[\u0B80-\u0BFF]/g);
  if (tamilChars) {
      const ratio = tamilChars.length / clean.length;
      if (ratio < 0.2) score -= 20; 
  }

  if (lines.length < 10) score -= 20; 
  
  const uniqueLines = new Set(lines);
  if (lines.length > 0 && uniqueLines.size / lines.length < 0.3) {
      score -= 20; 
  }

  // If very short and has no song structure, probably not a song
  if (lines.length < 12 && !lower.includes("chorus") && !lower.includes("verse") && !lower.includes("பல்லவி") && !lower.includes("சரணம்")) {
      score -= 30;
  }

  // If missing tamil characters completely for a tamil site
  if (!tamilChars) {
      score -= 30;
  }

  score -= (issues.length * 10);

  score = Math.max(0, Math.min(100, score));

  const hardReject = issues.includes("collection page noise")
    || issues.includes("source is a collection page")
    || issues.includes("noise ratio too high");
  const needsReview = hardReject || score < 80 || issues.length > 0;
  const confidenceBand = score >= 95 ? "Complete" : score >= 85 ? "Minor cleanup" : score >= 60 ? "Needs review" : "Incomplete";

  return {
    valid: !hardReject && (issues.length === 0 || score >= 60),
    issues,
    score,
    confidenceBand,
    needsReview,
    summary: issues.length ? `Validation flags: ${issues.join(", ")}` : "Validated"
  };
};
