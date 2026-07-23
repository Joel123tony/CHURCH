import crypto from "crypto";
import { transliterate } from "transliteration";
import { cleanLyricsText, detectSections, structureLyrics } from "./cleaner.js";
import { mergeSongVersions } from "./merger.js";
import { scoreProviderReliability } from "./providerHealth.js";

const textValue = (value) => (value === null || value === undefined ? "" : String(value).trim());

const signature = (text = "") =>
  cleanLyricsText(text)
    .toLowerCase()
    .replace(/[^\w\u0B80-\u0BFF]+/g, "");

const normalizeVariant = (variant = {}, index = 0) => {
  const source = textValue(variant.source || variant.provider || variant.sourceName);
  const lyrics = cleanLyricsText(variant.cleanedLyrics || variant.cleanLyrics || variant.lyrics || variant.originalLyrics || "");
  const sections = detectSections(lyrics);

  return {
    id: variant._id || variant.id || `variant-${index}`,
    provider: source || "unknown",
    source,
    sourceUrl: variant.sourceUrl || variant.url || "",
    title: textValue(variant.title || variant.titleTamil || ""),
    titleEnglish: textValue(variant.titleEnglish || variant.alternateTitle || ""),
    author: textValue(variant.author || ""),
    composer: textValue(variant.composer || ""),
    album: textValue(variant.album || ""),
    year: textValue(variant.year || ""),
    language: textValue(variant.language || "Tamil"),
    lyrics,
    originalLyrics: textValue(variant.originalLyrics || variant.rawLyrics || ""),
    confidenceScore: Number(variant.confidenceScore || variant.aiConfidence || 0),
    aiProvider: textValue(variant.aiProvider || source || "heuristic"),
    aiStatus: textValue(variant.aiStatus || "processed"),
    aiProcessedAt: variant.aiProcessedAt || null,
    themes: Array.isArray(variant.themes) ? variant.themes : [],
    keywords: Array.isArray(variant.keywords || variant.tags) ? (variant.keywords || variant.tags) : [],
    bibleReferences: Array.isArray(variant.bibleReferences || variant.scriptureReferences) ? (variant.bibleReferences || variant.scriptureReferences) : [],
    metadata: variant.aiMetadata || variant.metadata || {},
    sections,
    sectionLabels: sections.map((section) => section.label),
    providerReliability: variant.providerReliability || {}
  };
};

const scoreFieldSource = (variant, field, providerHealthMap = {}) => {
  const providerScore = providerHealthMap[variant.provider]?.healthScore || providerHealthMap[variant.source]?.healthScore || 0;
  const base = Number(variant.confidenceScore || 0);
  const hasValue = textValue(variant[field]) !== "" || (Array.isArray(variant[field]) && variant[field].length > 0);
  const fieldBonus = hasValue ? 15 : 0;
  const sectionBonus = field === "lyrics" ? (variant.sections.length > 0 ? 10 : 0) : 0;
  return Math.round(Math.min(100, base * 0.7 + providerScore * 0.2 + fieldBonus + sectionBonus));
};

const pickBestField = (field, variants, providerHealthMap = {}) => {
  let winner = null;
  for (const variant of variants) {
    const value = variant[field];
    const hasValue = Array.isArray(value) ? value.length > 0 : textValue(value) !== "";
    if (!hasValue) continue;
    const score = scoreFieldSource(variant, field, providerHealthMap);
    if (!winner || score > winner.confidence) {
      winner = {
        value,
        confidence: score,
        source: variant.provider,
        sourceUrl: variant.sourceUrl || "",
        variantId: variant.id
      };
    }
  }
  return winner || { value: "", confidence: 0, source: "", sourceUrl: "", variantId: "" };
};

const flattenSectionMap = (variants = []) => {
  const sectionMap = new Map();
  for (const variant of variants) {
    for (const section of variant.sections || []) {
      const lines = Array.isArray(section.lines) ? section.lines : [];
      const normalized = lines.map((line) => cleanLyricsText(line)).filter(Boolean);
      const sig = signature(normalized.join("\n"));
      if (!sig || sectionMap.has(sig)) continue;
      sectionMap.set(sig, {
        label: section.label || "Verse",
        lines: normalized,
        source: variant.provider,
        sourceUrl: variant.sourceUrl || "",
        variantId: variant.id
      });
    }
  }
  return Array.from(sectionMap.values());
};

const compareVariantAgainstCanonical = (canonicalSections = [], variant = {}) => {
  const canonicalSigs = new Set(canonicalSections.map((section) => signature(section.lines.join("\n"))));
  const variantSigs = new Set((variant.sections || []).map((section) => signature((section.lines || []).join("\n"))));
  const missingSections = canonicalSections
    .filter((section) => !variantSigs.has(signature(section.lines.join("\n"))))
    .map((section) => section.label);
  const extraSections = (variant.sections || [])
    .filter((section) => !canonicalSigs.has(signature((section.lines || []).join("\n"))))
    .map((section) => section.label);

  const metadataDifferences = [];
  ["title", "titleEnglish", "author", "composer", "album", "year", "language"].forEach((field) => {
    const variantValue = textValue(variant[field]);
    if (!variantValue) return;
    metadataDifferences.push({
      field,
      value: variantValue,
      differs: true
    });
  });

  return {
    source: variant.provider,
    sourceUrl: variant.sourceUrl || "",
    confidenceScore: variant.confidenceScore || 0,
    missingSections,
    extraSections,
    metadataDifferences,
    lyricsLength: (variant.lyrics || "").length
  };
};

export const buildCanonicalSongRecord = ({
  primary = {},
  candidates = [],
  aiResponse = null,
  context = {},
  providerHealthMap = {}
} = {}) => {
  const normalizedPrimary = normalizeVariant(primary, 0);
  const normalizedCandidates = [
    normalizedPrimary,
    ...candidates.map((candidate, index) => normalizeVariant(candidate, index + 1))
  ].filter((variant) => variant.lyrics || variant.title || variant.originalLyrics);

  const providerHistory = normalizedCandidates.map((variant) => ({
    provider: variant.provider,
    source: variant.source,
    sourceUrl: variant.sourceUrl,
    confidenceScore: variant.confidenceScore,
    reliability: scoreProviderReliability(providerHealthMap[variant.provider] || providerHealthMap[variant.source] || {}).healthScore || 0,
    aiStatus: variant.aiStatus,
    checkedAt: variant.aiProcessedAt || new Date(),
    sectionCount: variant.sections.length
  }));

  const merged = mergeSongVersions(
    normalizedCandidates.map((variant) => ({
      ...variant,
      lyrics: variant.lyrics,
      confidenceScore: variant.confidenceScore
    })),
    context
  );

  const canonicalSections = flattenSectionMap(normalizedCandidates);
  const mergedLyrics = structureLyrics(
    canonicalSections.length > 0
      ? canonicalSections.map((section) => `${section.label}\n${section.lines.join("\n")}`).join("\n\n")
      : merged.mergedLyrics || normalizedPrimary.lyrics || ""
  );

  const metadataFields = {};
  const fieldSources = {};
  const fieldConfidences = {};
  const masterSources = {};

  [
    "title",
    "titleEnglish",
    "author",
    "composer",
    "album",
    "year",
    "language"
  ].forEach((field) => {
    const best = pickBestField(field, normalizedCandidates, providerHealthMap);
    metadataFields[field] = textValue(best.value);
    fieldSources[field] = best.source || "";
    fieldConfidences[field] = best.confidence || 0;
    masterSources[field] = best.variantId || "";
  });

  const scriptureBest = pickBestField("bibleReferences", normalizedCandidates, providerHealthMap);
  const themeBest = pickBestField("themes", normalizedCandidates, providerHealthMap);
  const keywordBest = pickBestField("keywords", normalizedCandidates, providerHealthMap);

  const scriptureReferences = Array.from(new Set([
    ...(normalizedCandidates.flatMap((variant) => variant.bibleReferences || [])),
    ...(merged.mergedMetadata?.scriptureReferences || [])
  ])).filter(Boolean);
  const themes = Array.from(new Set([
    ...(normalizedCandidates.flatMap((variant) => variant.themes || [])),
    ...(merged.mergedMetadata?.themes || [])
  ])).filter(Boolean);
  const keywords = Array.from(new Set([
    ...(normalizedCandidates.flatMap((variant) => variant.keywords || [])),
    ...(merged.mergedMetadata?.keywords || [])
  ])).filter(Boolean);

  const changeHistory = normalizedCandidates.map((variant) => ({
    version: variant.aiProcessedAt ? `Version ${variant.aiProcessedAt.toISOString()}` : `Version ${variant.id}`,
    provider: variant.provider,
    sourceUrl: variant.sourceUrl,
    confidenceScore: variant.confidenceScore,
    changes: compareVariantAgainstCanonical(canonicalSections, variant)
  }));

  const canonicalHash = crypto
    .createHash("sha256")
    .update([
      mergedLyrics,
      metadataFields.title,
      metadataFields.author,
      metadataFields.composer,
      metadataFields.album,
      metadataFields.year,
      metadataFields.language,
      themes.join("|"),
      keywords.join("|"),
      scriptureReferences.join("|")
    ].join("::"))
    .digest("hex");

  const transliterationText = transliterate(metadataFields.title || mergedLyrics || "").trim();
  const fieldVerification = Object.fromEntries(
    Object.entries(fieldSources).map(([field, source]) => [
      field,
      {
        field,
        source,
        confidence: fieldConfidences[field] || 0,
        verified: (fieldConfidences[field] || 0) >= 70,
        verifiedAt: (fieldConfidences[field] || 0) >= 70 ? new Date() : null
      }
    ])
  );

  return {
    canonicalSong: true,
    masterLyrics: mergedLyrics,
    originalLyrics: normalizedPrimary.originalLyrics || normalizedPrimary.lyrics || merged.mergedLyrics || "",
    cleanLyrics: mergedLyrics,
    providerVariants: normalizedCandidates.map((variant) => ({
      provider: variant.provider,
      source: variant.source,
      sourceUrl: variant.sourceUrl,
      title: variant.title,
      confidenceScore: variant.confidenceScore,
      lyrics: variant.lyrics,
      originalLyrics: variant.originalLyrics,
      sections: variant.sections,
      metadata: variant.metadata
    })),
    metadata: {
      title: metadataFields.title,
      alternateTitle: textValue(merged.mergedMetadata?.alternateTitle || normalizedPrimary.titleEnglish),
      author: metadataFields.author,
      composer: metadataFields.composer,
      album: metadataFields.album,
      year: metadataFields.year,
      language: metadataFields.language || "Tamil",
      scriptureReferences,
      themes,
      keywords,
      transliteration: transliterationText,
      fieldConfidence: {
        title: fieldConfidences.title || 0,
        author: fieldConfidences.author || 0,
        composer: fieldConfidences.composer || 0,
        album: fieldConfidences.album || 0,
        year: fieldConfidences.year || 0,
        scripture: scriptureBest.confidence || 0,
        themes: themeBest.confidence || 0,
        keywords: keywordBest.confidence || 0
      },
      fieldSources,
      canonicalHash,
      aiProvider: aiResponse?.aiProvider || normalizedPrimary.aiProvider || "heuristic",
      aiConfidence: aiResponse?.confidenceScore || normalizedPrimary.confidenceScore || 0
    },
    fieldConfidence: {
      title: fieldConfidences.title || 0,
      author: fieldConfidences.author || 0,
      composer: fieldConfidences.composer || 0,
      album: fieldConfidences.album || 0,
      year: fieldConfidences.year || 0,
      scripture: scriptureBest.confidence || 0,
      themes: themeBest.confidence || 0,
      keywords: keywordBest.confidence || 0
    },
    fieldSources,
    fieldVerification,
    versionHistory: normalizedCandidates.map((variant, index) => ({
      version: index + 1,
      provider: variant.provider,
      source: variant.source,
      sourceUrl: variant.sourceUrl,
      confidenceScore: variant.confidenceScore,
      aiStatus: variant.aiStatus,
      aiProcessedAt: variant.aiProcessedAt,
      lyricsLength: variant.lyrics.length,
      sections: variant.sectionLabels
    })),
    changeHistory,
    providerHistory,
    diffs: normalizedCandidates.map((variant) => compareVariantAgainstCanonical(canonicalSections, variant)),
    canonicalHash,
    canonicalLyricsSections: canonicalSections,
    mergeSummary: {
      sourceCount: normalizedCandidates.length,
      sectionCount: canonicalSections.length,
      hadMerge: normalizedCandidates.length > 1,
      providerOrder: normalizedCandidates
        .slice()
        .sort((a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0))
        .map((variant) => variant.provider)
    },
    providerReliability: Object.fromEntries(
      normalizedCandidates.map((variant) => {
        const health = providerHealthMap[variant.provider] || providerHealthMap[variant.source] || {};
        return [variant.provider, scoreProviderReliability(health)];
      })
    ),
    masterSource: normalizedCandidates.sort((a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0))[0] || normalizedPrimary,
    mergedLyrics
  };
};
