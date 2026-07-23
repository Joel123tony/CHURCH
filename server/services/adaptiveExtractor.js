import * as cheerio from "cheerio";
import { cleanLyricsText, detectSections } from "./ai/cleaner.js";
import { normalizeTanglish } from "../utils/searchNormalizer.js";

const JUNK_SELECTORS = [
  "script",
  "style",
  "nav",
  "header",
  "footer",
  "aside",
  ".sidebar",
  ".widget",
  ".widgets",
  ".wp-block-archives",
  ".wp-block-categories",
  ".wp-block-latest-posts",
  ".nav-links",
  ".breadcrumb",
  ".social-share",
  ".sharedaddy",
  ".related",
  ".comments",
  ".comment",
  ".share",
  ".follow",
  ".ads",
  ".ad",
  ".post-navigation",
  ".entry-footer",
  ".site-footer",
  ".site-header",
  ".archive",
  ".archives",
  ".wp-block-buttons",
  ".entry-meta",
  ".pagination",
  ".page-numbers",
  ".tagcloud",
  ".search-form",
  ".author-box",
  ".author-bio"
];

const noisePatterns = [
  /read more/i,
  /share/i,
  /subscribe/i,
  /follow us/i,
  /copyright/i,
  /all rights reserved/i,
  /home/i,
  /menu/i,
  /navigation/i,
  /previous song/i,
  /next song/i,
  /facebook/i,
  /instagram/i,
  /youtube/i,
  /related songs?/i,
  /recent songs?/i,
  /archive/i,
  /categories?/i,
  /archives?/i,
  /a\s*-\s*z/i,
  /\b1\s+2\s+3\b/,
  /\b1\s+2\s+3\s+4\b/,
  /\bview count/i,
  /\bcomment(s)?\b/i,
  /\bsearch\b/i,
  /\btamil christian songs?\b/i,
  /\bgod medias\b/i
];

const COLLECTION_PATTERNS = [
  /related songs?/i,
  /recent songs?/i,
  /archives?/i,
  /categories?/i,
  /archive page/i,
  /song index/i,
  /lyrics index/i,
  /all songs/i,
  /a\s*-\s*z/i
];

const SONG_LABEL_PATTERNS = /^(verse\s*\d+|chorus|bridge|intro|ending|refrain)\b/i;
const IGNORE_OPENING_PATTERNS = [
  /^(song )?lyrics(\s+in\s+(english|tamil))?$/i,
  /^(written and sung|sung by|lyrics by|music by|composer|author|album|ministry|church)\b/i,
  /^(faith score|see more|read more|share|follow us|subscribe|shop now|keywords?)\b/i
];
const BOUNDARY_PATTERNS = [
  /^(more songs?|related songs?|recent songs?|key takeaways|estimated reading time|comments?|tags?:|disclaimer|about us|helpful links|disclosures|follow us|join our|shop now|previous song|next song|archives?|categories?|a\s*-\s*z)\b/i,
  /^(tamil christian songs?|god medias|tamil christians songs?)\b/i,
  /^(view count|share this|like and share|social links?)\b/i,
  /^(a heartfelt|the song highlights|it emphasizes|the lyrics include|the song serves|written by|written and sung)\b/i
];

const normalizeForMatch = (text = "") => normalizeTanglish(cleanLyricsText(text))
  .toLowerCase()
  .replace(/[^\w\s\u0B80-\u0BFF]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const buildTitleVariants = (title = "") => {
  const cleaned = normalizeForMatch(title);
  if (!cleaned) return [];
  const stripped = cleaned
    .replace(/\b(lyrics|song|song lyrics|official|official lyrics|tamil christian song|christian song)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return Array.from(new Set([
    cleaned,
    stripped,
    cleaned.replace(/\b(lyrics|song|songs)\b/g, "").trim(),
    stripped.replace(/\b(lyrics|song|songs)\b/g, "").trim()
  ].filter(Boolean)));
};

const getLineStats = (text = "") => {
  const lines = cleanLyricsText(text).split("\n").map((line) => line.trim()).filter(Boolean);
  const unique = new Set(lines.map((line) => line.toLowerCase()));
  const titleLikeLines = lines.filter((line) => !SONG_LABEL_PATTERNS.test(line) && line.length <= 90);
  const shortLines = lines.filter((line) => line.length <= 40);
  const noiseLines = lines.filter((line) => noisePatterns.some((pattern) => pattern.test(line)));
  const numericLines = lines.filter((line) => /^\d+[\s.)-]*/.test(line)).length;
  return {
    lines,
    lineCount: lines.length,
    uniqueLineCount: unique.size,
    titleLikeLineCount: titleLikeLines.length,
    shortLineCount: shortLines.length,
    noiseLineCount: noiseLines.length,
    numericLineCount: numericLines
  };
};

const isBoundaryLine = (line = "") => BOUNDARY_PATTERNS.some((pattern) => pattern.test(line));

const isIgnorableOpeningLine = (line = "") => IGNORE_OPENING_PATTERNS.some((pattern) => pattern.test(line));

const isLyricLikeLine = (line = "") => {
  const clean = cleanLyricsText(line);
  if (!clean) return false;
  if (SONG_LABEL_PATTERNS.test(clean)) return true;
  if (/[\u0B80-\u0BFF]/.test(clean)) return true;
  if (isBoundaryLine(clean) || isIgnorableOpeningLine(clean)) return false;
  return clean.split(/\s+/).length >= 3;
};

const htmlToStructuredText = (html = "") => {
  if (!html) return "";
  return String(html)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|ul|ol|table|article|section|h[1-6]|blockquote|pre|tr|td)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&");
};

const trimCanonicalSongText = (text = "", titleHint = "") => {
  const lines = cleanLyricsText(text).split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return "";

  const titleVariants = buildTitleVariants(titleHint);
  let startIndex = lines.findIndex((line) => isLyricLikeLine(line));
  if (startIndex < 0) {
    startIndex = lines.findIndex((line) => titleVariants.some((variant) => variant && normalizeForMatch(line).includes(variant)));
  }
  if (startIndex < 0) startIndex = 0;

  const collected = [];
  let lyricStarted = false;

  for (let i = startIndex; i < lines.length; i += 1) {
    const line = lines[i];
    const normalized = normalizeForMatch(line);

    if (!line) continue;
    if (isBoundaryLine(line) && lyricStarted) break;
    if (isIgnorableOpeningLine(line) && !lyricStarted) continue;
    if (noisePatterns.some((pattern) => pattern.test(line)) && lyricStarted) {
      if (collected.length >= 2) break;
      continue;
    }

    if (isLyricLikeLine(line) || lyricStarted) {
      lyricStarted = true;
      if (!collected.some((existing) => normalizeForMatch(existing) === normalized)) {
        collected.push(line);
      }
      continue;
    }
  }

  if (collected.length === 0) {
    return lines.filter((line) => !isBoundaryLine(line) && !isIgnorableOpeningLine(line)).join("\n").trim();
  }

  return collected.join("\n").trim();
};

const looksLikeCollectionPage = (text = "", titleHint = "") => {
  const clean = normalizeForMatch(text);
  if (!clean) return false;

  const titleVariants = buildTitleVariants(titleHint);
  const { lineCount, titleLikeLineCount, noiseLineCount, numericLineCount } = getLineStats(clean);

  if (COLLECTION_PATTERNS.some((pattern) => pattern.test(clean))) {
    return true;
  }

  const titleMatch = titleVariants.some((variant) => clean.includes(variant));
  const listHeavy = titleLikeLineCount > 10 && numericLineCount > 4 && noiseLineCount > 0;
  const indexHeavy = /(^|\s)([a-z]\s*[-–]\s*[z]|1\s+2\s+3|1000\s+generations)(\s|$)/i.test(clean);
  const noiseHeavy = noiseLineCount >= 3 && lineCount > 10;

  return (!titleMatch && (listHeavy || indexHeavy || noiseHeavy))
    || (lineCount > 20 && noiseLineCount > 4 && titleLikeLineCount > 8);
};

export const sanitizeScrapedHtml = (html = "") => {
  const $ = cheerio.load(html);
  JUNK_SELECTORS.forEach((selector) => $(selector).remove());
  $("*").each((_, el) => {
    const $el = $(el);
    const text = cleanLyricsText($el.text());
    if (noisePatterns.some((pattern) => pattern.test(text)) && text.length < 120) {
      $el.remove();
    }
  });
  return $.html();
};

const scoreCandidate = (text = "", titleHint = "") => {
  const clean = cleanLyricsText(text);
  if (!clean) return 0;
  const normalized = normalizeForMatch(clean);
  const titleVariants = buildTitleVariants(titleHint);
  const lineStats = getLineStats(clean);
  const verseSignals = lineStats.lines.filter((line) => /verse|chorus|bridge|intro|ending|refrain/i.test(line)).length;
  const tamilChars = (clean.match(/[\u0B80-\u0BFF]/g) || []).length;
  const noiseCount = noisePatterns.filter((pattern) => pattern.test(clean)).length;
  const density = Math.min(28, clean.length / 24);
  const lineScore = Math.min(18, lineStats.lineCount * 2);
  const titleScore = titleVariants.some((variant) => variant && normalized.includes(variant)) ? 42 : 0;
  const titleStartScore = titleVariants.some((variant) => variant && normalized.startsWith(variant)) ? 12 : 0;
  const structureScore = verseSignals * 9;
  const tamilScore = tamilChars > 0 ? 10 : 0;
  const collectionPenalty = looksLikeCollectionPage(clean, titleHint) ? 30 : 0;
  const repetitionPenalty = Math.max(0, (lineStats.lineCount - lineStats.uniqueLineCount) * 3);
  const numericPenalty = lineStats.numericLineCount > 6 ? 10 : 0;
  const noisePenalty = noiseCount * 14;
  const shortPenalty = lineStats.lineCount < 2 ? 25 : 0;
  return Math.max(0, Math.min(100, density + lineScore + titleScore + titleStartScore + structureScore + tamilScore - collectionPenalty - repetitionPenalty - numericPenalty - noisePenalty - shortPenalty));
};

const extractFromBlocks = ($, selectors, titleHint = "") => {
  let best = { text: "", score: 0, selector: "", isCollection: false };
  const seen = new Set();
  for (const selector of selectors) {
    $(selector).each((_, el) => {
      const structuredText = htmlToStructuredText($.html(el) || $(el).text());
      const text = trimCanonicalSongText(structuredText, titleHint);
      const key = `${selector}|${text.slice(0, 120)}`;
      if (!text || seen.has(key)) return;
      seen.add(key);
      const score = scoreCandidate(text, titleHint);
      if (score > best.score) {
        best = {
          text,
          score,
          selector,
          isCollection: looksLikeCollectionPage(text, titleHint)
        };
      }
    });
  }
  return best;
};

export const extractAdaptiveLyrics = (html = "", { selectors = [], titleHint = "", sourceUrl = "" } = {}) => {
  const sanitizedHtml = sanitizeScrapedHtml(html);
  const $ = cheerio.load(sanitizedHtml);
  const titleText = cleanLyricsText($("title").text() || $("h1").first().text() || titleHint);
  const candidates = [
    ...selectors,
    ".post-content",
    ".entry-content",
    ".content",
    ".lyrics",
    ".song-lyrics",
    "article",
    "main",
    "#content",
    "#contents",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "li",
    "blockquote",
    "pre",
    "td",
    "figcaption"
  ];

  const blocks = extractFromBlocks($, candidates, titleHint || titleText);
  const bodyText = cleanLyricsText($("body").text());
  const finalText = trimCanonicalSongText(blocks.text || "", titleHint || titleText);
  const sections = detectSections(finalText);
  const blockStats = getLineStats(finalText);
  const bodyStats = getLineStats(bodyText);
  const titleVariants = buildTitleVariants(titleHint || titleText);
  const normalizedFinal = normalizeForMatch(finalText);
  const titleMatched = titleVariants.some((variant) => variant && normalizedFinal.includes(variant));
  const bodyCollectionLike = looksLikeCollectionPage(bodyText, titleHint || titleText);
  const finalCollectionLike = looksLikeCollectionPage(finalText, titleHint || titleText);
  const noiseRatio = blockStats.lineCount > 0 ? blockStats.noiseLineCount / blockStats.lineCount : 0;
  const titleBoost = titleText ? 5 : 0;
  const sectionBoost = sections.length > 0 ? 10 : 0;
  const bodyPenalty = bodyStats.lineCount > 0 && blockStats.lineCount === 0 ? 18 : 0;
  const confidence = scoreCandidate(finalText || bodyText, titleHint || titleText) + titleBoost + sectionBoost - bodyPenalty;
  const multipleSongSignals = !titleMatched && (finalCollectionLike || bodyCollectionLike || (blockStats.titleLikeLineCount > 10 && blockStats.noiseLineCount > 0));

  return {
    title: titleText,
    lyrics: finalText,
    blockText: finalText,
    sections,
    selectorsTried: candidates,
    matchedSelector: blocks.selector || "",
    confidence: Math.max(0, Math.min(100, confidence)),
    isCollectionPage: finalCollectionLike || bodyCollectionLike,
    multipleSongSignals,
    noiseRatio,
    titleMatched,
    bestReason: blocks.selector ? `Matched ${blocks.selector}` : "No canonical block selector matched",
    sourceUrl,
    sanitizedHtml
  };
};

export { looksLikeCollectionPage };
