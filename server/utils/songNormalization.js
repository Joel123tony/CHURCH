import crypto from "crypto";
import { transliterate } from "transliteration";
import { normalizeTanglish } from "./searchNormalizer.js";

const TAMIL_RE = /[\u0B80-\u0BFF]/;

const NOISE_PATTERNS = [
  /^(home|blog|category|categories|tag|tags|author|authors|next|previous|share|comments|comment|related songs?|suggested songs?|trending|popular|latest posts?|footer|navigation|menu|breadcrumb|subscribe|follow us|facebook|instagram|youtube)$/i,
  /^posted on\b/i,
  /^published on\b/i,
  /^read more\b/i,
  /^view all\b/i,
  /^download\b/i,
  /^copy(?:right)?\b/i,
  /^all rights reserved\b/i,
  /^this article\b/i,
  /^the article\b/i
];

const SECTION_LABELS = new Map([
  ["verse", "Verse"],
  ["verse 1", "Verse 1"],
  ["verse 2", "Verse 2"],
  ["verse 3", "Verse 3"],
  ["verse 4", "Verse 4"],
  ["chorus", "Chorus"],
  ["bridge", "Bridge"],
  ["ending", "Ending"],
  ["outro", "Ending"],
  ["intro", "Intro"],
  ["refrain", "Chorus"],
  ["pallavi", "பல்லவி"],
  ["charanam", "சரணம்"],
  ["stanza", "சரணம்"],
  ["anupallavi", "அனுபல்லவி"]
]);

const THEME_RULES = [
  { theme: "Worship", words: ["worship", "adoration", "praise", "pallavi", "aradhanai", "arradhanai"] },
  { theme: "Praise", words: ["praise", "stothiram", "sthoothiram", "thuthi", "hallelujah"] },
  { theme: "Prayer", words: ["prayer", "pray", "intercession", "supplication", "jebam"] },
  { theme: "Christmas", words: ["christmas", "merry", "nativity", "incarnation", "karthavu piranthar"] },
  { theme: "Easter", words: ["easter", "resurrection", "risen", "crucified", "cross", "calvary"] },
  { theme: "Communion", words: ["communion", "breaking bread", "cup", "body and blood"] },
  { theme: "Holy Spirit", words: ["holy spirit", "spirit", "pentecost", "anoint", "anointing"] },
  { theme: "Healing", words: ["healing", "heal", "restoration", "restored", "deliverance"] },
  { theme: "Faith", words: ["faith", "trust", "believe", "belief"] },
  { theme: "Hope", words: ["hope", "promise", "future", "confidence"] },
  { theme: "Love", words: ["love", "grace", "mercy", "compassion"] },
  { theme: "Salvation", words: ["salvation", "saved", "redeemed", "redemption"] },
  { theme: "Revival", words: ["revival", "awakening", "revive", "renewal"] },
  { theme: "Youth", words: ["youth", "young", "college", "student"] },
  { theme: "Children's Songs", words: ["children", "kids", "child"] },
  { theme: "Choir", words: ["choir", "chorus", "ensemble"] },
  { theme: "Harvest", words: ["harvest", "thanksgiving", "bounty"] },
  { theme: "Missions", words: ["missions", "missionary", "mission", "outreach"] }
];

const TAG_SEED = [
  "hope",
  "faith",
  "jesus",
  "cross",
  "grace",
  "blood",
  "heaven",
  "kingdom",
  "worship",
  "prayer",
  "praise",
  "salvation",
  "spirit",
  "revival",
  "mercy",
  "love"
];

const toText = (value) => (value === null || value === undefined ? "" : String(value));

const buildFieldVerification = (field, value, source, confidence = 0, verified = false) => ({
  field,
  value: toText(value),
  source: source || "",
  confidence: Number(confidence || 0),
  verified: !!verified,
  verifiedAt: verified ? new Date() : null
});

const normalizeLine = (line) =>
  toText(line)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isNoiseLine = (line) => {
  const normalized = normalizeLine(line);
  if (!normalized) return true;
  return NOISE_PATTERNS.some((pattern) => pattern.test(normalized));
};

const isSectionLabel = (line) => {
  if (!line) return false;
  const normalized = normalizeLine(line).toLowerCase();
  return SECTION_LABELS.has(normalized) || /^verse\s*\d+$/i.test(normalized);
};

const canonicalSectionLabel = (line) => {
  const normalized = normalizeLine(line).toLowerCase();
  if (SECTION_LABELS.has(normalized)) return SECTION_LABELS.get(normalized);
  const verseMatch = normalized.match(/^verse\s*(\d+)$/i);
  if (verseMatch) return `Verse ${verseMatch[1]}`;
  return normalizeLine(line);
};

const compactSectionBreaks = (lines) => {
  const output = [];
  for (const rawLine of lines) {
    const line = normalizeLine(rawLine);
    if (!line) {
      if (output.length > 0 && output[output.length - 1] !== "") {
        output.push("");
      }
      continue;
    }

    if (isSectionLabel(line)) {
      if (output.length > 0 && output[output.length - 1] !== "") {
        output.push("");
      }
      output.push(canonicalSectionLabel(line));
      output.push("");
      continue;
    }

    output.push(line);
  }

  return output
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

export const stripHtmlToText = (input = "") => {
  const text = toText(input)
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|table|ul|ol)>/gi, "\n")
    .replace(/<[^>]*>/g, " ");

  return text;
};

export const normalizeLyricsText = (input = "") => {
  if (String(input).trim() === "pending_fetch") return "pending_fetch";
  const text = stripHtmlToText(input)
    .replace(/\r\n?/g, "\n")
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, "")
    .normalize("NFKC");

  const lines = text
    .split("\n")
    .map(normalizeLine)
    .filter(Boolean)
    .filter((line) => !isNoiseLine(line));

  const deduped = [];
  let lastSignature = "";

  for (const line of lines) {
    const signature = normalizeTanglish(line)
      .replace(/[^\w\u0B80-\u0BFF]+/g, "")
      .toLowerCase();

    if (!signature || signature === lastSignature) continue;

    deduped.push(line);
    lastSignature = signature;
  }

  return compactSectionBreaks(deduped);
};

export const normalizeSongTitle = (title = "") => normalizeLine(title).replace(/\s+/g, " ").trim();

export const extractBibleReferences = (input = "") => {
  const text = toText(input);
  const references = new Set();
  const patterns = [
    /\b(?:[1-3]\s*)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+\d+:\d+(?:-\d+)?\b/g,
    /\b(?:[1-3]\s*)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+\d+\b/g
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern) || [];
    matches.forEach((match) => references.add(normalizeLine(match)));
  }

  return Array.from(references).slice(0, 12);
};

export const classifyThemes = (input = "", metadata = {}) => {
  const text = `${toText(input)} ${toText(metadata.title)} ${toText(metadata.author)} ${toText(metadata.composer)} ${toText(metadata.album)} ${toText(metadata.theme)} ${toText(metadata.worshipCategory)}`.toLowerCase();
  const themes = new Set();

  for (const rule of THEME_RULES) {
    if (rule.words.some((word) => text.includes(word.toLowerCase()))) {
      themes.add(rule.theme);
    }
  }

  if (metadata.theme) themes.add(normalizeLine(metadata.theme));
  if (metadata.worshipCategory) themes.add(normalizeLine(metadata.worshipCategory));

  if (themes.size === 0) {
    themes.add(TAMIL_RE.test(text) ? "Worship" : "Praise");
  }

  return Array.from(themes).filter(Boolean).slice(0, 8);
};

export const generateSongTags = (input = "", metadata = {}, themes = []) => {
  const combined = `${toText(input)} ${toText(metadata.title)} ${toText(metadata.author)} ${toText(metadata.composer)} ${toText(metadata.album)} ${toText(metadata.theme)} ${toText(metadata.worshipCategory)}`.toLowerCase();
  const tokens = combined
    .replace(/[^\w\u0B80-\u0BFF\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);

  const tags = new Set([
    ...TAG_SEED,
    ...themes.map((theme) => theme.toLowerCase()),
    ...tokens
  ]);

  extractBibleReferences(input).forEach((ref) => tags.add(ref.toLowerCase()));

  if (metadata.author) tags.add(normalizeLine(metadata.author).toLowerCase());
  if (metadata.composer) tags.add(normalizeLine(metadata.composer).toLowerCase());
  if (metadata.album) tags.add(normalizeLine(metadata.album).toLowerCase());
  if (metadata.language) tags.add(normalizeLine(metadata.language).toLowerCase());

  return Array.from(tags)
    .filter(Boolean)
    .filter((tag) => tag.length > 1)
    .slice(0, 30);
};

export const inferSongLanguage = (input = "", metadata = {}) => {
  if (metadata.language) return metadata.language;
  const text = toText(input);
  if (TAMIL_RE.test(text)) return "Tamil";
  return "English";
};

export const slugifySongTitle = (title = "", sourceUrl = "") => {
  const baseSource = normalizeSongTitle(title) || sourceUrl || "song";
  const transliterated = transliterate(baseSource) || baseSource;
  const slug = transliterated
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9\u0B80-\u0BFF]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  const hash = crypto.createHash("sha1").update(`${title}|${sourceUrl}`).digest("hex").slice(0, 8);
  return `${slug || "song"}-${hash}`;
};

export const buildSongSearchKey = (song = {}) => {
  const sources = [
    song.title,
    song.titleTamil,
    song.titleEnglish,
    song.masterLyrics,
    song.lyrics,
    song.lyricsTamil,
    song.lyricsEnglish,
    song.cleanLyrics,
    song.cleanedLyrics,
    song.originalLyrics,
    song.author,
    song.composer,
    song.album,
    ...(song.keywords || []),
    ...(song.themes || []),
    ...(song.bibleReferences || []),
    song.category,
    song.language
  ];

  const normalized = sources
    .flatMap((part) => {
      const value = toText(part);
      return [
        normalizeTanglish(value),
        transliterate(value)
      ];
    })
    .filter(Boolean)
    .join(" ");

  return normalized.replace(/\s+/g, " ").trim();
};

export const buildSongPayload = (song = {}, context = {}) => {
  const sourceUrl = song.sourceUrl || song.url || context.sourceUrl || "";
  const source = song.source || context.source || "";
  const rawTitle = normalizeSongTitle(song.titleTamil || song.titleEnglish || song.title || context.title || "");
  const titleTamil = normalizeSongTitle(song.titleTamil || rawTitle || song.title || "");
  const titleEnglish = normalizeSongTitle(song.titleEnglish || song.alternateTitle || "");
  const title = normalizeSongTitle(song.title || titleTamil || titleEnglish || context.title || "Untitled Song");

  const originalLyrics = normalizeLyricsText(
    song.originalLyrics || song.rawLyrics || song.originalText || song.lyricsOriginal || song.rawText || song.original || song.sourceText || song.lyricsTamil || song.lyrics || ""
  );

  const cleanedLyrics = normalizeLyricsText(
    song.cleanedLyrics || song.cleanLyrics || song.lyricsTamil || song.lyrics || originalLyrics
  );

  const metadata = {
    title: title || rawTitle,
    alternateTitle: song.alternateTitle || titleEnglish || "",
    author: normalizeSongTitle(song.author || song.metadata?.author || ""),
    composer: normalizeSongTitle(song.composer || song.metadata?.composer || ""),
    album: normalizeSongTitle(song.album || song.metadata?.album || ""),
    year: song.year || song.metadata?.year || "",
    language: inferSongLanguage(cleanedLyrics || originalLyrics, song.metadata || song),
    theme: normalizeSongTitle(song.theme || song.metadata?.theme || ""),
    worshipCategory: normalizeSongTitle(song.worshipCategory || song.metadata?.worshipCategory || ""),
    scriptureReferences: Array.from(new Set([
      ...(song.scriptureReferences || []),
      ...(song.bibleReferences || []),
      ...extractBibleReferences(`${title} ${originalLyrics} ${cleanedLyrics}`)
    ])),
    aiProvider: song.aiProvider || song.metadata?.aiProvider || "",
    aiConfidence: song.aiConfidence || song.confidenceScore || 0
  };

  const themes = Array.from(new Set([
    ...(song.themes || []),
    ...classifyThemes(`${title} ${cleanedLyrics} ${originalLyrics}`, { ...metadata, ...song.metadata })
  ])).filter(Boolean);

  const keywords = Array.from(new Set([
    ...(song.keywords || []),
    ...generateSongTags(`${title} ${cleanedLyrics} ${originalLyrics}`, { ...metadata, ...song.metadata }, themes)
  ])).filter(Boolean);

  const searchKey = buildSongSearchKey({
    title,
    titleTamil,
    titleEnglish,
    lyrics: cleanedLyrics,
    lyricsTamil: cleanedLyrics,
    lyricsEnglish: song.lyricsEnglish || "",
    cleanLyrics: cleanedLyrics,
    originalLyrics,
    author: metadata.author,
    composer: metadata.composer,
    album: metadata.album,
    keywords,
    themes,
    bibleReferences: metadata.scriptureReferences,
    category: song.category || context.category,
    language: metadata.language
  });

  const contentHash = crypto
    .createHash("sha256")
    .update([title, cleanedLyrics, originalLyrics, sourceUrl, source].join("::"))
    .digest("hex");

  const aiConfidence = Number(song.aiConfidence || song.confidenceScore || metadata.aiConfidence || 0);
  const fieldVerification = song.fieldVerification || {
    title: buildFieldVerification("title", title, source || song.source || "", aiConfidence, aiConfidence >= 80 || !!title),
    titleTamil: buildFieldVerification("titleTamil", titleTamil, source || song.source || "", aiConfidence, aiConfidence >= 80 || !!titleTamil),
    titleEnglish: buildFieldVerification("titleEnglish", titleEnglish, source || song.source || "", aiConfidence, aiConfidence >= 80 || !!titleEnglish),
    lyrics: buildFieldVerification("lyrics", cleanedLyrics, source || song.source || "", aiConfidence, aiConfidence >= 80 || !!cleanedLyrics),
    author: buildFieldVerification("author", metadata.author || song.author || "", source || song.source || "", aiConfidence, !!(metadata.author || song.author)),
    composer: buildFieldVerification("composer", metadata.composer || song.composer || "", source || song.source || "", aiConfidence, !!(metadata.composer || song.composer)),
    album: buildFieldVerification("album", metadata.album || song.album || "", source || song.source || "", aiConfidence, !!(metadata.album || song.album)),
    year: buildFieldVerification("year", metadata.year || song.year || "", source || song.source || "", aiConfidence, !!(metadata.year || song.year)),
    scriptureReferences: buildFieldVerification("scriptureReferences", metadata.scriptureReferences?.join(", ") || "", source || song.source || "", aiConfidence, (metadata.scriptureReferences || []).length > 0),
    themes: buildFieldVerification("themes", themes.join(", "), source || song.source || "", aiConfidence, themes.length > 0)
  };

  return {
    ...song,
    title,
    titleTamil,
    titleEnglish,
    lyrics: cleanedLyrics,
    lyricsTamil: cleanedLyrics,
    lyricsEnglish: song.lyricsEnglish || "",
    originalLyrics,
    cleanLyrics: cleanedLyrics,
    cleanedLyrics,
    category: song.category || context.category || "Tamil Christian Songs",
    language: metadata.language || song.language || "Tamil",
    source,
    sourceUrl,
    url: song.url || sourceUrl,
    author: metadata.author || song.author || "",
    composer: metadata.composer || song.composer || "",
    lyricist: song.lyricist || metadata.author || "",
    album: metadata.album || song.album || "",
    year: metadata.year || song.year || "",
    keywords,
    themes,
    bibleReferences: metadata.scriptureReferences,
    searchKey,
    normalizedTitle: normalizeSongTitle(title),
    normalizedLyrics: normalizeLyricsText(cleanedLyrics),
    slug: song.slug || slugifySongTitle(title, sourceUrl),
    aiStatus: song.aiStatus || (song.aiUsed ? "processed" : "fallback"),
    aiProvider: song.aiProvider || metadata.aiProvider || "",
    aiConfidence: song.aiConfidence || song.confidenceScore || metadata.aiConfidence || 0,
    aiProcessedAt: song.aiProcessedAt || (song.aiUsed !== false ? new Date() : null),
    aiMetadata: song.aiMetadata || metadata,
    aiSourceHash: song.aiSourceHash || "",
    aiEngineVersion: song.aiEngineVersion || "",
    aiConfidenceBand: song.aiConfidenceBand || "",
    aiNeedsReview: typeof song.aiNeedsReview === "boolean" ? song.aiNeedsReview : false,
    aiReviewReasons: song.aiReviewReasons || [],
    aiProcessingTimeMs: song.aiProcessingTimeMs || 0,
    aiSections: song.aiSections || [],
    aiSearchIndex: song.aiSearchIndex || "",
    contentHash: song.contentHash || contentHash,
    fieldVerification,
    relatedSongs: song.relatedSongs || [],
    graphSignals: song.graphSignals || {},
    moderationStatus: song.moderationStatus || (song.aiNeedsReview ? "pending" : "approved"),
    moderationHistory: song.moderationHistory || [],
    reviewNotes: song.reviewNotes || [],
    searchRankingSignals: song.searchRankingSignals || {},
    learningFeedback: song.learningFeedback || [],
    revisionNumber: song.revisionNumber || 1,
    recoveryRecommendations: song.recoveryRecommendations || [],
    originalVersions: song.originalVersions || [],
    mergedVersion: song.mergedVersion || null,
    providerHistory: song.providerHistory || (source
      ? [{ source, url: sourceUrl, status: "success", checkedAt: new Date() }]
      : []),
    originalLyricsTamil: song.originalLyricsTamil || originalLyrics,
    cleanedLyricsTamil: song.cleanedLyricsTamil || cleanedLyrics,
    originalLyricsEnglish: song.originalLyricsEnglish || "",
    cleanedLyricsEnglish: song.cleanedLyricsEnglish || song.lyricsEnglish || "",
    importStatus: song.importStatus || "completed",
    status: song.status || (cleanedLyrics === "pending_fetch" ? "processing" : "completed"),
    scrapeStatus: song.scrapeStatus || "success",
    lyricsStatus: song.lyricsStatus || (cleanedLyrics === "pending_fetch" ? "pending_fetch" : (cleanedLyrics ? "found" : "pending")),
    recoveredAt: song.recoveredAt || null,
    lyricsSource: song.lyricsSource || source,
    providerVerified: typeof song.providerVerified === "boolean" ? song.providerVerified : (aiConfidence >= 80),
    verificationDate: song.verificationDate || (cleanedLyrics && cleanedLyrics !== "pending_fetch" ? new Date() : null),
    verificationConfidence: song.verificationConfidence || aiConfidence
  };
};

export const prepareSongForClient = (song = {}) => {
  const normalized = buildSongPayload(song, {
    source: song.source,
    sourceUrl: song.sourceUrl || song.url,
    category: song.category
  });

  return {
    ...song,
    ...normalized,
    lyrics: normalized.cleanedLyrics,
    lyricsTamil: normalized.cleanedLyrics,
    cleanLyrics: normalized.cleanedLyrics,
    cleanedLyrics: normalized.cleanedLyrics,
    originalLyrics: normalized.originalLyrics,
    searchKey: normalized.searchKey
  };
};
