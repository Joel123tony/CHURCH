import Song from "../models/Song.js";
import SongSearchCache from "../models/SongSearchCache.js";
import SongSearchLog from "../models/SongSearchLog.js";
import { searchOnlineSources, searchOnlineSourcesAcrossProviders } from "./songSources/adapterManager.js";
import { normalizeTanglish } from "../utils/searchNormalizer.js";
import { buildSongPayload, prepareSongForClient } from "../utils/songNormalization.js";
import { processLyricsWithAi } from "./ai/index.js";
import { refreshSongRelationships } from "./knowledgeGraph.js";
import { queueSongForReview } from "./reviewWorkflow.js";
import { withPerfTimer, recordPerf } from "../utils/perfTracker.js";

const normalizeScoreText = (value = "") => normalizeTanglish(String(value || "")).toLowerCase().trim();
const onDemandImportLocks = new Map();

const escapeRegex = (value = "") => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const buildImportKey = (query = "") => normalizeTanglish(String(query || "")).toLowerCase().trim();
const upsertSearchCache = (query, results, source) =>
  SongSearchCache.findOneAndUpdate(
    { query: String(query || "").toLowerCase().trim() },
    {
      $set: {
        results,
        source,
        searchedAt: new Date()
      }
    },
    { upsert: true, new: true }
  ).catch(() => null);

const withImportLock = async (query, executor) => {
  const key = buildImportKey(query);
  if (!key) return executor();

  if (onDemandImportLocks.has(key)) {
    return onDemandImportLocks.get(key);
  }

  const promise = Promise.resolve()
    .then(executor)
    .finally(() => {
      onDemandImportLocks.delete(key);
    });

  onDemandImportLocks.set(key, promise);
  return promise;
};

const computeSearchRank = (song = {}, query = "") => {
  const q = normalizeScoreText(query);
  const title = normalizeScoreText(song.titleTamil || song.titleEnglish || song.title || "");
  const lyrics = normalizeScoreText([song.lyrics, song.lyricsTamil, song.lyricsEnglish].filter(Boolean).join(" "));
  const searchKey = normalizeScoreText(song.searchKey || song.aiSearchIndex || "");
  const themes = normalizeScoreText((song.themes || []).join(" "));
  const refs = normalizeScoreText((song.bibleReferences || []).join(" "));
  const author = normalizeScoreText(song.author || "");
  const composer = normalizeScoreText(song.composer || "");
  const album = normalizeScoreText(song.album || "");
  const relationCount = Array.isArray(song.relatedSongs) ? song.relatedSongs.length : 0;
  const confidence = Number(song.aiConfidence || 0);
  const fieldConfidence = song.fieldConfidence || {};
  const canonicalBoost = song.canonicalSong ? 14 : 0;
  const providerBoost = song.providerReliability?.[song.aiProvider]?.healthScore || 0;
  const exactTitle = q && title === q ? 200 : 0;
  const titleHit = q && title.includes(q) ? 100 : 0;
  const searchHit = q && searchKey.includes(q) ? 18 : 0;
  const lyricsHit = q && lyrics.includes(q) ? (titleHit ? 12 : 5) : 0;
  const themeHit = q && themes.includes(q) ? 16 : 0;
  const scriptureHit = q && refs.includes(q) ? 14 : 0;
  const authorHit = q && author.includes(q) ? 10 : 0;
  const composerHit = q && composer.includes(q) ? 10 : 0;
  const albumHit = q && album.includes(q) ? 6 : 0;
  const exactFuzzy = q && title && title.includes(q.replace(/\s+/g, "")) ? 50 : 0;
  const recencyBoost = song.updatedAt ? Math.max(0, 10 - Math.min(10, Math.floor((Date.now() - new Date(song.updatedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)))) : 0;
  const completeness = Math.round([
    fieldConfidence.title,
    fieldConfidence.author,
    fieldConfidence.composer,
    fieldConfidence.album,
    fieldConfidence.year,
    fieldConfidence.scripture,
    fieldConfidence.themes,
    fieldConfidence.keywords
  ].filter((value) => Number.isFinite(Number(value))).reduce((sum, value) => sum + Number(value), 0) / 8 || 0);

  return exactTitle + titleHit + searchHit + lyricsHit + themeHit + scriptureHit + authorHit + composerHit + albumHit + exactFuzzy + canonicalBoost + providerBoost * 0.2 + confidence * 0.25 + completeness * 0.15 + relationCount * 1.5 + recencyBoost;
};

const findExistingSongRecord = async (songData = {}, query = "") => {
  const titleCandidates = [
    songData.normalizedTitle,
    songData.titleTamil,
    songData.titleEnglish,
    songData.title
  ].map((value) => String(value || "").trim()).filter(Boolean);

  const lyricsPrefixes = [
    songData.lyricsTamil,
    songData.cleanedLyrics,
    songData.cleanLyrics,
    songData.lyrics,
    songData.originalLyrics
  ].map((value) => String(value || "").trim()).filter((value) => value.length > 24).slice(0, 2);

  const queryParts = [
    { url: songData.sourceUrl },
    { sourceUrl: songData.sourceUrl },
    { slug: songData.slug },
    { contentHash: songData.contentHash },
    { canonicalHash: songData.canonicalHash }
  ].filter((part) => Object.values(part)[0]);

  titleCandidates.forEach((candidate) => {
    queryParts.push({ normalizedTitle: { $regex: new RegExp(`^${escapeRegex(candidate)}$`, "i") } });
    queryParts.push({ titleTamil: { $regex: new RegExp(escapeRegex(candidate), "i") } });
    queryParts.push({ titleEnglish: { $regex: new RegExp(escapeRegex(candidate), "i") } });
  });

  lyricsPrefixes.forEach((prefix) => {
    queryParts.push({ lyricsTamil: { $regex: new RegExp(`^${escapeRegex(prefix)}`, "i") } });
    queryParts.push({ cleanLyrics: { $regex: new RegExp(`^${escapeRegex(prefix)}`, "i") } });
    queryParts.push({ originalLyrics: { $regex: new RegExp(`^${escapeRegex(prefix)}`, "i") } });
  });

  if (query) {
    const normalizedQuery = normalizeTanglish(query).trim();
    if (normalizedQuery) {
      queryParts.push({ searchKey: { $regex: new RegExp(escapeRegex(normalizedQuery), "i") } });
      queryParts.push({ aiSearchIndex: { $regex: new RegExp(escapeRegex(normalizedQuery), "i") } });
    }
  }

  const existing = await withPerfTimer("merge", () => Song.findOne({ $or: queryParts }).lean());
  return existing || null;
};

const importSongOnDemand = async (query, selectedCategories = []) => {
  const searchKey = normalizeScoreText(query);
  if (!searchKey || searchKey.length < 3) return null;
  const importCategory = selectedCategories.length > 0 && !selectedCategories.includes("All")
    ? selectedCategories.join(", ")
    : "Tamil Christian Songs";

  return withImportLock(searchKey, async () => {
    const candidates = await searchOnlineSourcesAcrossProviders(query, 3).catch(() => []);
    let primaryCandidate = candidates[0] || null;

    if (!primaryCandidate) {
      primaryCandidate = await searchOnlineSources(query);
      if (primaryCandidate) {
        candidates.push(primaryCandidate);
      }
    }

    if (!primaryCandidate) {
      await upsertSearchCache(searchKey, null, "Not Found");
      return null;
    }

    const providerCandidates = candidates.filter(Boolean);
    const sourceText = primaryCandidate.lyricsTamil || primaryCandidate.cleanedLyrics || primaryCandidate.lyrics || primaryCandidate.lyricsEnglish || "";
    
    // Instead of waiting 20s for AI, create a raw entry immediately.
    const processed = {
        lyrics: sourceText,
        cleanLyrics: sourceText,
        aiNeedsReview: true,
        aiStatus: "pending"
    };

    const payload = buildSongPayload(
      {
        ...primaryCandidate,
        ...processed,
        status: "completed",
        isPublished: true,
        providerCandidates
      },
      {
        source: primaryCandidate.source || "Unknown",
        sourceUrl: primaryCandidate.sourceUrl || "",
        category: importCategory
      }
    );

    const existing = await findExistingSongRecord(payload, query);
    if (existing) {
      await upsertSearchCache(searchKey, existing, existing.source || primaryCandidate.source || "Provider Lookup");
      return existing;
    }

    const song = new Song(payload);
    await withPerfTimer("save", () => song.save());

    // Queue AI cleaning in the background asynchronously
    const { QueueManager } = await import("../utils/queueManager.js");
    if (song.lyricsTamil !== "pending_fetch" && song.lyricsStatus !== "pending") {
        await QueueManager.addJob("ai_cleaning", {
            html: sourceText,
            url: song.sourceUrl || song.url,
            source: song.source,
            category: song.category,
            title: song.title,
            titleTamil: song.titleTamil,
            titleEnglish: song.titleEnglish
        }, song._id).catch(() => {});
    } else {
        await QueueManager.addJob("import", {
            url: song.sourceUrl || song.url,
            priority: 1
        }, song._id).catch(() => {});
    }

    await refreshSongRelationships(song._id).catch(() => {});

    const saved = song.toObject();
    await upsertSearchCache(searchKey, saved, saved.source || primaryCandidate.source || "Provider Lookup");

    return saved;
  });
};

const buildSearchPatterns = (query) => {
  const normalizedQuery = normalizeTanglish(query) || query;
  const plainQuery = query.trim();
  const transliterated = normalizeTanglish(query);
  const escapedPlain = plainQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedNormalized = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedTransliterated = transliterated.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return [
    { title: { $regex: escapedPlain, $options: "i" } },
    { titleTamil: { $regex: escapedPlain, $options: "i" } },
    { titleEnglish: { $regex: escapedPlain, $options: "i" } },
    { alternateTitle: { $regex: escapedPlain, $options: "i" } },
    { canonicalHash: { $regex: escapedNormalized || escapedPlain, $options: "i" } },
    { normalizedTitle: { $regex: escapedNormalized, $options: "i" } },
    { searchKey: { $regex: escapedNormalized || escapedTransliterated, $options: "i" } },
    { aiSearchIndex: { $regex: escapedNormalized || escapedTransliterated || escapedPlain, $options: "i" } },
    { lyrics: { $regex: escapedPlain, $options: "i" } },
    { lyricsTamil: { $regex: escapedPlain, $options: "i" } },
    { lyricsEnglish: { $regex: escapedPlain, $options: "i" } },
    { keywords: { $regex: escapedPlain, $options: "i" } },
    { themes: { $regex: escapedPlain, $options: "i" } },
    { bibleReferences: { $regex: escapedPlain, $options: "i" } },
    { author: { $regex: escapedPlain, $options: "i" } },
    { composer: { $regex: escapedPlain, $options: "i" } },
    { album: { $regex: escapedPlain, $options: "i" } },
    { aiProvider: { $regex: escapedPlain, $options: "i" } },
    { slug: { $regex: escapedNormalized || escapedPlain, $options: "i" } },
    { url: { $regex: escapedPlain, $options: "i" } },
    { sourceUrl: { $regex: escapedPlain, $options: "i" } }
  ];
};

import { getCached, setCached } from "../utils/cache.js";

export const searchSongs = async (query, selectedCategories = [], sortOrder = "latest", page = 1, limit = 10) => {
  const searchQuery = query || "";
  const cacheKey = `api_search_${searchQuery.toLowerCase().trim()}_${selectedCategories.join(',')}_${sortOrder}_${page}_${limit}`;
  
  const cachedResponse = getCached(cacheKey);
  if (cachedResponse) {
    console.log(`[SongService] Ultra-fast memory cache hit for "${searchQuery}" (< 10ms)`);
    return cachedResponse;
  }

  const skip = (page - 1) * limit;
  
  // 1. Build MongoDB Query
  const dbQuery = { status: "completed", isPublished: true };
  if (searchQuery) {
    const normalizedQuery = normalizeTanglish(searchQuery) || searchQuery;
    dbQuery.$text = { $search: `"${searchQuery}" ${normalizedQuery}` };
    dbQuery.$or = buildSearchPatterns(searchQuery);
  }
  
  if (selectedCategories.length > 0 && !selectedCategories.includes("All")) {
    dbQuery.category = { $in: selectedCategories };
  }

  let dbSongs = [];
  let totalCount = 0;
  
  try {
    const mongoStart = Date.now();
    const findOperation = Song.find(dbQuery);
    
    // Sort logic
    if (sortOrder === "a-z") {
      // Use collation for case-insensitive and Tamil character sorting
      findOperation.collation({ locale: "ta", strength: 1 }).sort({ title: 1 });
    } else if (sortOrder === "oldest") {
      findOperation.sort({ publishedDate: 1, createdAt: 1 });
    } else if (sortOrder === "newest") {
      findOperation.sort({ publishedDate: -1, createdAt: -1 });
    } else if (sortOrder === "trending" || sortOrder === "recently_added") {
      findOperation.sort({ createdAt: -1 });
    } else if (searchQuery && sortOrder === "latest") {
      findOperation.sort({ score: { $meta: "textScore" } });
    } else {
      findOperation.sort({ publishedDate: -1, createdAt: -1 });
    }
    
    [dbSongs, totalCount] = await withPerfTimer("mongoLookup", () => Promise.all([
      findOperation.skip(skip).limit(limit).lean(),
      Song.countDocuments(dbQuery)
    ]));
    console.log(`[SongService] MongoDB lookup for "${searchQuery}" completed in ${Date.now() - mongoStart}ms`);
  } catch (err) {
    console.error("[SongService] MongoDB Error:", err);
  }

  // 3. Live Adapter Search Fallback (Only if database lacks strong title matches for this query)
  let hasStrongTitleMatch = false;
  if (searchQuery && dbSongs.length > 0) {
    const q = (normalizeTanglish(searchQuery) || searchQuery).toLowerCase().trim();
    hasStrongTitleMatch = dbSongs.some(song => {
      const title = (normalizeTanglish(song.titleTamil || song.titleEnglish || song.title || "") || "").toLowerCase().trim();
      const altTitles = (song.alternateTitles || []).map(t => (normalizeTanglish(t) || t).toLowerCase().trim());
      return title.includes(q) || altTitles.some(t => t.includes(q));
    });
  }

  if (searchQuery && !hasStrongTitleMatch && page === 1) {
    const cacheQuery = searchQuery.toLowerCase().trim();
    const cached = await SongSearchCache.findOne({ query: cacheQuery });
    
    if (cached && cached.results) {
      console.log(`[SongService] Cache hit for "${searchQuery}"`);
      dbSongs = [cached.results, ...dbSongs]; // Prepend cached result
      totalCount += 1;
    } else if (cached && cached.results === null) {
      console.log(`[SongService] Cached negative result for "${searchQuery}". Returning empty immediately.`);
      return {
        success: true,
        status: "completed",
        songs: [],
        totalSongs: 0,
        currentPage: 1,
        totalPages: 1
      };
    } else {
      if (cached && !cached.results) {
        console.log(`[SongService] Cached miss for "${searchQuery}" will be retried against providers.`);
      }
      console.log(`[SongService] No strong local results for "${searchQuery}". Launching background search...`);
      
      // DEBUG: Allow synchronous waiting to extract stack trace on Render
      if (query === "DEBUG_KIRUBA") {
          try {
              const res = await importSongOnDemand("Kiruba Kiruba", selectedCategories);
              return { success: true, status: "debug_success", result: res };
          } catch (e) {
              return { success: false, status: "debug_error", error: e.message, stack: e.stack };
          }
      }

      // Fire and forget
      importSongOnDemand(searchQuery, selectedCategories).catch(err => {
        console.error(`[SongService] On-demand import error:`, err.stack);
      });

      // Immediately return polling state
      return {
        success: true,
        status: "searching_online",
        songs: [],
        totalSongs: 0,
        currentPage: 1,
        totalPages: 1
      };
    }
  }

  const totalPages = Math.ceil(totalCount / limit) || 1;

  // Add Badges for frontend
  const now = new Date();
  const rankedSongs = searchQuery
    ? [...dbSongs]
        .map((song) => ({
          song,
          searchRank: computeSearchRank(song, searchQuery)
        }))
        .sort((a, b) => b.searchRank - a.searchRank)
        .map(({ song, searchRank }) => ({ ...song, searchRank }))
    : dbSongs;

  const enhancedSongs = rankedSongs.map(song => {
      const prepared = prepareSongForClient(song);
      let isTrending = false;
      let isNew = false;
      
      // Trending: imported within last 90 days
      if (prepared.createdAt) {
          const daysSinceImport = (now - new Date(prepared.createdAt)) / (1000 * 60 * 60 * 24);
          if (daysSinceImport <= 90) isTrending = true;
      }
      
      // New: Uploaded within last 30 days
      if (prepared.publishedDate) {
          const daysSincePublish = (now - new Date(prepared.publishedDate)) / (1000 * 60 * 60 * 24);
          if (daysSincePublish <= 30) isNew = true;
      }

      return {
          ...prepared,
          isTrending,
          isNew
      };
  });

  const responsePayload = {
    success: true,
    songs: enhancedSongs,
    totalSongs: totalCount,
    currentPage: page,
    totalPages: totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };

  setCached(cacheKey, responsePayload, 60 * 5); // Cache for 5 minutes
  return responsePayload;
};
