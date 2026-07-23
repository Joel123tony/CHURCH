import crypto from "crypto";
import { getCached, setCached } from "../../utils/cache.js";
import { buildSongPayload } from "../../utils/songNormalization.js";
import { cleanLyricsText, structureLyrics, detectSections } from "./cleaner.js";
import { extractMetadata } from "./metadata.js";
import { validateLyrics } from "./validator.js";
import { scoreLyricsConfidence } from "./confidence.js";
import { buildRecoveryAdvice } from "./recoveryAdvisor.js";
import { mergeSongVersions } from "./merger.js";
import { buildAiSearchIndex } from "./searchIndexer.js";
import { buildCanonicalSongRecord } from "./canonical.js";
import { getProviderHealthSnapshot } from "./providerHealth.js";
import { runProviderPrompt, getAiProviderConfig } from "./providerFactory.js";

const AI_ENGINE_VERSION = "phase-2-ai-engine-v1";
const AI_PROMPT_VERSION = "phase-3-canonical-v1";

const buildPrompt = (rawText, context = {}) => `
You are a production lyrics cleanup engine.
Return only JSON.

Rules:
- Never translate.
- Never change meaning or theology.
- STRIP ALL METADATA from the lyrics: remove website names, provider branding (e.g., "Tamil Christians Songs", "god medias"), page titles, SEO titles, breadcrumbs, tags, artist lists, album links, copyright, ads, share links, and navigation text.
- Normalize the Title: Store only the clean song title (e.g., "உம்மை ஆராதிப்பேன்" or "Ummai Arathippen"). DO NOT include artist/singer/composer information inside the title (e.g., remove "sung by Eva.JEEVA"). Move all artist/singer/composer information into their respective metadata fields.
- Preserve Proper Song Structure: Group lines logically into Verse 1, Chorus, Verse 2, Bridge, etc. Do not merge everything into one paragraph.
- Detect Duplicate Chorus: If a chorus block is identically repeated by mistake due to HTML parsing, keep only one block. Preserve intentional musical structure.
- Preserve Tamil Formatting: Do not remove Tamil punctuation, break Unicode characters, alter spelling, or merge separate lyric lines. Preserve intentional blank lines.
- Extract metadata when visible into distinct fields (author, composer, album, year).
- If the content is multiple songs, set multiSong=true and return songs[].

Context:
${JSON.stringify({
  title: context.title || "",
  titleTamil: context.titleTamil || "",
  titleEnglish: context.titleEnglish || "",
  source: context.source || "",
  sourceUrl: context.sourceUrl || "",
  language: context.language || "Tamil"
})}

Raw text:
${rawText}

JSON schema:
{
  "valid": true,
  "multiSong": false,
  "title": "",
  "alternateTitle": "",
  "lyrics": "The full cleaned lyrics as a single string, sections separated by double newlines",
  "language": "Tamil",
  "confidenceScore": 0,
  "sections": [
    {
      "type": "Verse",
      "number": 1,
      "lines": ["line 1", "line 2"]
    },
    {
      "type": "Chorus",
      "number": 1,
      "lines": ["line 1", "line 2"]
    }
  ],
  "themes": [],
  "tags": [],
  "author": "",
  "composer": "",
  "album": "",
  "year": "",
  "scriptureReferences": [],
  "worshipCategory": "",
  "containsRelatedSongs": false,
  "containsSeo": false,
  "containsNavigation": false,
  "containsChords": false,
  "containsMetadata": false
}
`;

const buildResult = (rawText, context = {}, aiResponse = null) => {
  const canonical = context.canonicalRecord || null;
  const canonicalLyrics = canonical?.masterLyrics || aiResponse?.lyrics || rawText;
  const cleanLyrics = structureLyrics(cleanLyricsText(canonicalLyrics));
  const metadata = canonical?.metadata || extractMetadata(cleanLyrics, context, aiResponse || {});
  const validation = validateLyrics(cleanLyrics, [], {
    originalLyrics: rawText,
    title: context.title || "",
    titleTamil: context.titleTamil || "",
    titleEnglish: context.titleEnglish || "",
    sourceUrl: context.sourceUrl || context.url || "",
    extractedFrom: context.extractedFrom || ""
  });
  const confidence = scoreLyricsConfidence({
    lyrics: cleanLyrics,
    metadata,
    validation,
    providerConfidence: aiResponse?.confidenceScore || 0,
    merged: !!aiResponse?.merged
  });
  const confidenceScore = Math.min(100, Math.max(confidence.score, aiResponse?.confidenceScore || 0));
  const aiStatus = aiResponse?.multiSong ? "processed" : (confidence.needsReview ? "fallback" : "processed");
  const aiProvider = aiResponse ? (aiResponse.aiProvider || getAiProviderConfig().provider || "heuristic") : "heuristic";
  const searchKey = buildAiSearchIndex({
    title: metadata.title,
    lyrics: cleanLyrics,
    transliterationText: metadata.transliteration,
    metadata
  });

  const payload = buildSongPayload({
    title: metadata.title,
    titleTamil: metadata.title,
    titleEnglish: metadata.alternateTitle,
    lyrics: cleanLyrics,
    originalLyrics: rawText,
    cleanLyrics,
    cleanedLyrics: cleanLyrics,
    lyricsEnglish: context.lyricsEnglish || "",
    language: metadata.language,
    author: metadata.author,
    composer: metadata.composer,
    album: metadata.album,
    year: metadata.year,
    themes: metadata.themes,
    keywords: metadata.keywords,
    bibleReferences: metadata.scriptureReferences,
    aiStatus,
    aiProvider,
    aiConfidence: confidenceScore,
    aiProcessedAt: new Date(),
      aiMetadata: {
      ...metadata,
      validation,
      confidenceBand: confidence.confidenceBand,
      aiEngineVersion: AI_ENGINE_VERSION,
      aiPromptVersion: AI_PROMPT_VERSION,
      aiProvider,
      aiSearchKey: searchKey,
      transliteration: metadata.transliteration,
      sections: aiResponse?.sections || canonical?.canonicalLyricsSections || detectSections(cleanLyrics),
      rawLength: rawText.length
    },
    aiSourceHash: crypto.createHash("sha256").update(rawText || "").digest("hex"),
    aiEngineVersion: AI_ENGINE_VERSION,
    aiPromptVersion: AI_PROMPT_VERSION,
    aiConfidenceBand: confidence.confidenceBand,
    aiNeedsReview: confidence.needsReview,
    aiReviewReasons: validation.issues,
    aiProcessingTimeMs: context.aiProcessingTimeMs || 0,
    aiSections: aiResponse?.sections || canonical?.canonicalLyricsSections || detectSections(cleanLyrics),
    aiSearchIndex: searchKey,
    recoveryRecommendations: buildRecoveryAdvice({ score: confidenceScore, validation }),
    providerHistory: canonical?.providerHistory || context.providerHistory || [],
    originalVersions: canonical?.providerVariants || context.originalVersions || [],
    mergedVersion: canonical?.mergeSummary || context.mergedVersion || null,
    canonicalSong: canonical?.canonicalSong ?? true,
    masterLyrics: canonical?.masterLyrics || cleanLyrics,
    providerVariants: canonical?.providerVariants || [],
    versionHistory: canonical?.versionHistory || [],
    changeHistory: canonical?.changeHistory || [],
    fieldConfidence: canonical?.fieldConfidence || {},
    fieldSources: canonical?.fieldSources || {},
    fieldVerification: canonical?.fieldVerification || {},
    mergeSummary: canonical?.mergeSummary || {},
    comparisonSummary: canonical?.diffs || [],
    canonicalHash: canonical?.canonicalHash || "",
    masterLyricsSections: canonical?.canonicalLyricsSections || [],
    providerReliability: canonical?.providerReliability || {},
    masterSource: canonical?.masterSource || null
  }, {
    source: context.source || "",
    sourceUrl: context.sourceUrl || "",
    category: context.category || "Tamil Christian Songs"
  });

  return {
    valid: validation.valid,
    multiSong: false,
    title: payload.title,
    alternateTitle: payload.titleEnglish || "",
    lyrics: payload.cleanedLyrics,
    originalLyrics: payload.originalLyrics,
    cleanedLyrics: payload.cleanedLyrics,
    language: payload.language || "Tamil",
    confidenceScore: confidenceScore,
    confidenceBand: confidence.confidenceBand,
    extractedFrom: context.extractedFrom || "website",
    containsRelatedSongs: false,
    containsSeo: false,
    containsNavigation: false,
    containsChords: false,
    containsMetadata: false,
    themes: payload.themes,
    tags: payload.keywords,
    author: payload.author,
    composer: payload.composer,
    album: payload.album,
    year: payload.year,
    scriptureReferences: payload.bibleReferences,
    worshipCategory: payload.aiMetadata?.worshipCategory || "",
    aiUsed: !!aiResponse && aiProvider !== "heuristic",
    aiStatus,
    aiProvider,
    aiProcessedAt: payload.aiProcessedAt,
    metadata: payload.aiMetadata || {},
    aiSourceHash: payload.aiSourceHash,
    aiEngineVersion: AI_ENGINE_VERSION,
    aiPromptVersion: AI_PROMPT_VERSION,
    aiNeedsReview: confidence.needsReview,
    aiReviewReasons: validation.issues,
    aiProcessingTimeMs: context.aiProcessingTimeMs || 0,
    aiSections: payload.aiSections,
    aiSearchIndex: searchKey,
    recoveryRecommendations: payload.recoveryRecommendations,
    providerHistory: payload.providerHistory,
    originalVersions: payload.originalVersions,
    mergedVersion: payload.mergedVersion,
    canonicalSong: payload.canonicalSong,
    masterLyrics: payload.masterLyrics,
    providerVariants: payload.providerVariants,
    versionHistory: payload.versionHistory,
    changeHistory: payload.changeHistory,
    fieldConfidence: payload.fieldConfidence,
    fieldSources: payload.fieldSources,
    fieldVerification: payload.fieldVerification,
    mergeSummary: payload.mergeSummary,
    comparisonSummary: payload.comparisonSummary,
    canonicalHash: payload.canonicalHash,
    masterLyricsSections: payload.masterLyricsSections,
    providerReliability: payload.providerReliability,
    masterSource: payload.masterSource
  };
};

export const processLyricsWithAi = async (rawText, context = {}) => {
  const start = Date.now();
  let baseText = cleanLyricsText(rawText || "");
  let providerHistory = context.providerHistory || [];
  let originalVersions = context.originalVersions || [];
  let mergedVersion = context.mergedVersion || null;

  if (Array.isArray(context.providerCandidates) && context.providerCandidates.length > 0) {
    const merged = mergeSongVersions(
      context.providerCandidates.map((candidate) => ({
        ...candidate,
        lyrics: candidate.cleanedLyrics || candidate.cleanLyrics || candidate.lyrics || "",
        confidenceScore: candidate.confidenceScore || candidate.aiConfidence || 0
      })),
      context
    );
    baseText = cleanLyricsText(merged.mergedLyrics || baseText);
    providerHistory = merged.providerHistory.length > 0 ? merged.providerHistory : providerHistory;
    originalVersions = merged.versions.length > 0 ? merged.versions : originalVersions;
    mergedVersion = merged.mergedMetadata || mergedVersion;
  }

  const providerHealthSnapshot = await getProviderHealthSnapshot();
  const providerHealthMap = Object.fromEntries(
    providerHealthSnapshot.map((item) => [item.provider, item])
  );

  const cacheKey = `ai_song_${crypto.createHash("sha1").update(`${context.sourceUrl || context.url || ""}|${baseText}`).digest("hex")}`;
  const promptHash = crypto
    .createHash("sha1")
    .update(`${AI_PROMPT_VERSION}|${context.sourceUrl || context.url || ""}|${baseText}|${JSON.stringify(providerHistory)}|${JSON.stringify(originalVersions)}|${JSON.stringify(mergedVersion || {})}`)
    .digest("hex");
  const versionedCacheKey = `${cacheKey}|${promptHash}`;
  const cached = getCached(versionedCacheKey);
  if (cached && cached.aiSourceHash && cached.aiSourceHash === crypto.createHash("sha256").update(rawText || "").digest("hex")) {
    return cached;
  }

  const prompt = buildPrompt(baseText, context);
  const providerResponse = await runProviderPrompt(prompt);
  const canonicalRecord = buildCanonicalSongRecord({
    primary: {
      title: context.title || "",
      titleTamil: context.titleTamil || context.title || "",
      titleEnglish: context.titleEnglish || "",
      author: context.author || "",
      composer: context.composer || "",
      album: context.album || "",
      year: context.year || "",
      language: context.language || "Tamil",
      lyrics: baseText,
      originalLyrics: rawText,
      cleanedLyrics: baseText,
      source: context.source || "",
      sourceUrl: context.sourceUrl || context.url || "",
      confidenceScore: context.aiConfidence || 0,
      aiProvider: context.aiProvider || "heuristic",
      aiMetadata: context.metadata || {},
      themes: context.themes || [],
      keywords: context.keywords || [],
      bibleReferences: context.bibleReferences || []
    },
    candidates: Array.isArray(context.providerCandidates) ? context.providerCandidates : [],
    aiResponse: providerResponse || null,
    context: {
      ...context,
      sourceUrl: context.sourceUrl || context.url || "",
      source: context.source || "",
      category: context.category || "Tamil Christian Songs"
    },
    providerHealthMap
  });

  const result = buildResult(canonicalRecord.masterLyrics || baseText, {
    ...context,
    canonicalRecord,
    providerHistory: canonicalRecord.providerHistory,
    originalVersions: canonicalRecord.providerVariants,
    mergedVersion: canonicalRecord.mergeSummary,
    providerCandidates: Array.isArray(context.providerCandidates) ? context.providerCandidates : []
  }, providerResponse || {});
  result.aiProcessingTimeMs = Date.now() - start;
  result.aiPromptVersion = AI_PROMPT_VERSION;
  result.providerReliability = canonicalRecord.providerReliability;
  result.comparisonSummary = canonicalRecord.diffs;
  result.versionHistory = canonicalRecord.versionHistory;
  result.changeHistory = canonicalRecord.changeHistory;
  result.fieldConfidence = canonicalRecord.fieldConfidence;
  result.fieldSources = canonicalRecord.fieldSources;
  result.fieldVerification = canonicalRecord.fieldVerification;
  result.mergeSummary = canonicalRecord.mergeSummary;
  result.canonicalHash = canonicalRecord.canonicalHash;
  result.masterLyrics = canonicalRecord.masterLyrics;
  result.providerVariants = canonicalRecord.providerVariants;
  result.masterLyricsSections = canonicalRecord.canonicalLyricsSections;
  result.canonicalSong = canonicalRecord.canonicalSong;
  result.masterSource = canonicalRecord.masterSource;

  if (result.confidenceScore < 80) {
    result.recoveryRecommendations = Array.from(new Set([
      ...(result.recoveryRecommendations || []),
      "retry provider",
      "try another provider",
      "merge providers",
      "rerun AI cleanup"
    ]));
  }

  if (providerResponse?.multiSong && Array.isArray(providerResponse.songs)) {
    const merged = mergeSongVersions(providerResponse.songs, context);
    const mergedResult = buildResult(merged.mergedLyrics || baseText, {
      ...context,
      providerHistory: merged.providerHistory,
      originalVersions: providerResponse.songs,
      mergedVersion: merged.mergedMetadata,
      merged: true
    }, {
      ...providerResponse,
      lyrics: merged.mergedLyrics,
      merged: true
    });

    mergedResult.multiSong = true;
    mergedResult.songs = providerResponse.songs.map((song) => buildResult(song.lyrics || "", {
      ...context,
      title: song.title || context.title || "",
      source: song.source || context.source || "",
      sourceUrl: song.sourceUrl || context.sourceUrl || ""
    }, song));
    mergedResult.providerHistory = merged.providerHistory;
    mergedResult.aiProcessingTimeMs = Date.now() - start;
    mergedResult.aiPromptVersion = AI_PROMPT_VERSION;
    setCached(versionedCacheKey, mergedResult, 60 * 60 * 6);
    return mergedResult;
  }

  if (providerHistory.length > 0) {
    result.providerHistory = providerHistory;
  }
  if (originalVersions.length > 0) {
    result.originalVersions = originalVersions;
  }
  if (mergedVersion) {
    result.mergedVersion = mergedVersion;
  }

  setCached(versionedCacheKey, result, 60 * 60 * 6);
  return result;
};

export { mergeSongVersions, scoreLyricsConfidence, validateLyrics, extractMetadata, buildAiSearchIndex };
