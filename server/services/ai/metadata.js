import { classifyThemes, extractBibleReferences, generateSongTags, inferSongLanguage, normalizeSongTitle } from "../../utils/songNormalization.js";
import { transliterate } from "transliteration";
import { cleanLyricsText } from "./cleaner.js";

const pick = (...values) => values.find((value) => value !== undefined && value !== null && String(value).trim() !== "") || "";

export const extractMetadata = (lyrics = "", context = {}, aiMetadata = {}) => {
  const clean = cleanLyricsText(lyrics);
  const title = normalizeSongTitle(pick(aiMetadata.title, context.title, context.titleTamil, context.titleEnglish));
  const titleEnglish = normalizeSongTitle(pick(aiMetadata.alternateTitle, context.titleEnglish));
  const language = pick(aiMetadata.language, context.language) || inferSongLanguage(clean, context);
  const author = normalizeSongTitle(pick(aiMetadata.author, context.author, context.metadata?.author));
  const composer = normalizeSongTitle(pick(aiMetadata.composer, context.composer, context.metadata?.composer));
  const album = normalizeSongTitle(pick(aiMetadata.album, context.album, context.metadata?.album));
  const year = pick(aiMetadata.year, context.year, context.metadata?.year);
  const scriptureReferences = Array.from(new Set([
    ...(aiMetadata.scriptureReferences || []),
    ...(context.scriptureReferences || []),
    ...(context.bibleReferences || []),
    ...extractBibleReferences(`${title} ${clean} ${context.originalLyrics || ""}`)
  ])).slice(0, 12);
  const themes = Array.from(new Set([
    ...(aiMetadata.themes || []),
    ...classifyThemes(`${title} ${clean}`, { title, author, composer, album, theme: aiMetadata.theme, worshipCategory: aiMetadata.worshipCategory, language })
  ])).filter(Boolean);
  const keywords = Array.from(new Set([
    ...(aiMetadata.tags || []),
    ...generateSongTags(`${title} ${clean}`, { title, author, composer, album, language }, themes)
  ])).filter(Boolean);

  return {
    title,
    alternateTitle: titleEnglish,
    language,
    author,
    composer,
    album,
    year,
    themes,
    keywords,
    scriptureReferences,
    transliteration: transliterate(clean || title || "").trim(),
    normalizedTamil: clean,
    searchTerms: [
      title,
      titleEnglish,
      author,
      composer,
      album,
      year,
      language,
      ...(themes || []),
      ...(keywords || []),
      ...(scriptureReferences || []),
      transliterate(clean || title || "")
    ].filter(Boolean)
  };
};
