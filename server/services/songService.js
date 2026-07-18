import { searchTamilChristianSongs } from "./providers/tamilChristianSongs.js";
import { searchChristianKeerthanai } from "./providers/christianKeerthanai.js";
import { searchChristSquare } from "./providers/christSquare.js";
import Song from "../models/Song.js";

// Helper to normalize strings for deduplication
const normalizeString = (str) => {
  return str.toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, "").trim();
};

export const searchSongs = async (query, selectedCategories = [], page = 1, limit = 20) => {
  const searchQuery = query || "";
  const skip = (page - 1) * limit;
  
  // 1. Build MongoDB Query
  const dbQuery = {};
  if (searchQuery) {
    dbQuery.$text = { $search: searchQuery };
  }
  
  if (selectedCategories.length > 0 && !selectedCategories.includes("All")) {
    dbQuery.category = { $in: selectedCategories };
  }

  // 2. Fetch from local MongoDB first
  let dbSongs = [];
  let totalCount = 0;
  
  try {
    const findOperation = Song.find(dbQuery);
    // If it's a text search, sort by text score, else sort by newest
    if (searchQuery) {
      findOperation.sort({ score: { $meta: "textScore" } });
    } else {
      findOperation.sort({ createdAt: -1 });
    }
    
    [dbSongs, totalCount] = await Promise.all([
      findOperation.skip(skip).limit(limit).lean(),
      Song.countDocuments(dbQuery)
    ]);
  } catch (err) {
    console.error("[SongService] MongoDB Error:", err);
  }

  // 3. If there is a search query and we didn't find enough results locally, run live scrapers
  if (searchQuery && dbSongs.length < limit) {
    // Run all providers in parallel, without awaiting them (fire and forget for DB auto-population)
    // We only await it if we didn't find enough local results, to ensure the user gets something immediately.
    const fetchAndSyncScrapers = async () => {
      const results = await Promise.allSettled([
        searchTamilChristianSongs(searchQuery),
        searchChristianKeerthanai(searchQuery),
        searchChristSquare(searchQuery)
      ]);

      let allSongs = [];
      results.forEach(result => {
        if (result.status === "fulfilled" && result.value) {
          allSongs = [...allSongs, ...result.value];
        }
      });

      // Deduplicate scraped songs
      const uniqueSongsMap = new Map();
      allSongs.forEach(song => {
        const normTitle = normalizeString(song.title);
        if (!uniqueSongsMap.has(normTitle)) {
          uniqueSongsMap.set(normTitle, song);
        } else {
          const existing = uniqueSongsMap.get(normTitle);
          if (song.lyrics && !existing.lyrics) {
            uniqueSongsMap.set(normTitle, song);
          }
        }
      });

      const unifiedSongs = Array.from(uniqueSongsMap.values());

      // Upsert to MongoDB in background
      for (const song of unifiedSongs) {
        try {
          song.keywords = [searchQuery]; // Tag with the search query that found it
          await Song.updateOne(
            { url: song.url }, // Match by unique URL
            { $set: song },    // Update fields
            { upsert: true }   // Insert if it doesn't exist
          );
        } catch (err) {
          console.error(`[SongService] Failed to upsert song: ${song.title}`, err);
        }
      }
    };

    // If local DB is completely empty for this query, await the scrapers so we can return them immediately to the user
    if (dbSongs.length === 0 && page === 1) {
      await fetchAndSyncScrapers();
      // Re-fetch from DB after sync
      const findOperation = Song.find(dbQuery).sort({ score: { $meta: "textScore" } });
      [dbSongs, totalCount] = await Promise.all([
        findOperation.skip(skip).limit(limit).lean(),
        Song.countDocuments(dbQuery)
      ]);
    } else {
      // Fire and forget - background auto-population
      fetchAndSyncScrapers().catch(err => console.error("Background sync error:", err));
    }
  }

  return {
    success: true,
    songs: dbSongs,
    totalSongs: totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit) || 1
  };
};
