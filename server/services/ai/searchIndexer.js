import { normalizeTanglish } from "../../utils/searchNormalizer.js";
import { transliterate } from "transliteration";

export const buildAiSearchIndex = ({ title = "", lyrics = "", transliterationText = "", metadata = {} } = {}) => {
  const blocks = [
    title,
    lyrics,
    transliterationText || transliterate(lyrics || title || ""),
    metadata.author,
    metadata.composer,
    metadata.album,
    metadata.language,
    ...(metadata.themes || []),
    ...(metadata.keywords || []),
    ...(metadata.scriptureReferences || [])
  ].filter(Boolean);

  return normalizeTanglish(blocks.join(" "));
};
