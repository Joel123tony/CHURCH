import Song from "../models/Song.js";
import SongSearchCache from "../models/SongSearchCache.js";
import SongSearchLog from "../models/SongSearchLog.js";
import { searchOnlineSources } from "./songSources/adapterManager.js";

// Concurrency Queue for Live Searches
const MAX_CONCURRENT_SEARCHES = 2;
let activeSearches = 0;
const searchQueue = [];

const processSearchQueue = async () => {
  if (activeSearches >= MAX_CONCURRENT_SEARCHES || searchQueue.length === 0) return;
  activeSearches++;
  const { query, resolve, reject } = searchQueue.shift();
  try {
    const result = await searchOnlineSources(query);
    resolve(result);
  } catch (err) {
    reject(err);
  } finally {
    activeSearches--;
    processSearchQueue();
  }
};

const queueOnlineSearch = (query) => {
  return new Promise((resolve, reject) => {
    searchQueue.push({ query, resolve, reject });
    processSearchQueue();
  });
};

// Helper to normalize strings for deduplication
const normalizeString = (str) => {
  return str.toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, "").trim();
};

export const searchSongs = async (query, selectedCategories = [], sortOrder = "latest", page = 1, limit = 10) => {
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
    
    // Sort logic
    if (sortOrder === "a-z") {
      findOperation.sort({ titleTamil: 1, title: 1 });
    } else if (sortOrder === "oldest") {
      findOperation.sort({ publishedDate: 1, createdAt: 1 });
    } else if (searchQuery && sortOrder === "latest") {
      findOperation.sort({ score: { $meta: "textScore" } });
    } else {
      findOperation.sort({ publishedDate: -1, createdAt: -1 });
    }
    
    [dbSongs, totalCount] = await Promise.all([
      findOperation.skip(skip).limit(limit).lean(),
      Song.countDocuments(dbQuery)
    ]);
  } catch (err) {
    console.error("[SongService] MongoDB Error:", err);
  }

  // 3. Live Adapter Search Fallback (Only if database is COMPLETELY empty for this query)
  if (searchQuery && dbSongs.length === 0 && page === 1) {
    const isLiveSearchEnabled = process.env.ENABLE_LIVE_SONG_SEARCH === 'true';
    
    if (isLiveSearchEnabled) {
      const cacheQuery = searchQuery.toLowerCase().trim();
      const cached = await SongSearchCache.findOne({ query: cacheQuery });
      
      if (cached) {
        console.log(`[SongService] Cache hit for "${searchQuery}"`);
        if (cached.results) {
          dbSongs = [cached.results];
          totalCount = 1;
        }
      } else {
        console.log(`[SongService] No local results for "${searchQuery}". Queueing Online Adapters...`);
        const startTime = Date.now();
        let scrapedSong = null;
        
        try {
          scrapedSong = await queueOnlineSearch(searchQuery);
        } catch (err) {
          console.error(`[SongService] Online search error:`, err.message);
        }
        
        const responseTime = Date.now() - startTime;
        
        // Log the search
        await SongSearchLog.create({
          query: searchQuery,
          found: !!scrapedSong,
          source: scrapedSong ? scrapedSong.source : "None",
          responseTime
        });
        
        if (scrapedSong) {
          try {
            scrapedSong.keywords = [searchQuery]; 
            
            // Final DB Deduplication Check before insert (Title OR First 100 chars of lyrics)
            const lyricsPrefix = scrapedSong.lyricsTamil ? scrapedSong.lyricsTamil.substring(0, 100) : "";
            
            const existingConditions = [
              { url: scrapedSong.sourceUrl },
              { titleTamil: { $regex: new RegExp(`^${scrapedSong.titleTamil}$`, 'i') } }
            ];
            
            if (lyricsPrefix.length > 20) {
                // Escape regex special chars for lyrics prefix
                const safePrefix = lyricsPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                existingConditions.push({ lyricsTamil: { $regex: new RegExp(`^${safePrefix}`, 'i') } });
            }

            const existing = await Song.findOne({ $or: existingConditions });
            
            let finalSongData = null;
            
            if (!existing) {
              const newSong = new Song({
                 title: scrapedSong.titleTamil || scrapedSong.titleEnglish,
                 titleTamil: scrapedSong.titleTamil,
                 titleEnglish: scrapedSong.titleEnglish,
                 lyrics: scrapedSong.lyricsTamil,
                 lyricsTamil: scrapedSong.lyricsTamil,
                 lyricsEnglish: scrapedSong.lyricsEnglish,
                 artist: scrapedSong.artist || "",
                 language: "Tamil",
                 category: "Tamil Christian Songs",
                 source: scrapedSong.source,
                 url: scrapedSong.sourceUrl,
                 sourceUrl: scrapedSong.sourceUrl,
                 scrapeStatus: "success",
                 lyricsLength: scrapedSong.lyricsTamil?.length || 0,
                 importedAt: new Date(),
                 keywords: scrapedSong.keywords
              });
              
              await newSong.save();
              console.log(`[SongService] Successfully injected scraped song into MongoDB!`);
              finalSongData = newSong.toObject();
            } else {
              console.log(`[SongService] Duplicate detected for "${searchQuery}", using existing DB record.`);
              finalSongData = existing.toObject();
            }
            
            // Save to Cache
            await SongSearchCache.create({ 
               query: cacheQuery, 
               results: finalSongData, 
               source: scrapedSong.source 
            });
            
            dbSongs = [finalSongData];
            totalCount = 1;
            
          } catch (err) {
            console.error(`[SongService] Failed to upsert scraped song`, err);
          }
        } else {
          // Cache the miss to prevent spamming the scrapers
          await SongSearchCache.create({ 
             query: cacheQuery, 
             results: null, 
             source: "None" 
          });
        }
      }
    } else {
      console.log(`[SongService] Live search is DISABLED for missing query "${searchQuery}"`);
    }
  }

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    success: true,
    songs: dbSongs,
    totalSongs: totalCount,
    currentPage: page,
    totalPages: totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
};
