import { searchSongs } from "../services/songService.js";
import { getCached, setCached } from "../utils/cache.js";

/* =========================
   SEARCH MULTI-SOURCE
========================= */
export const searchSongsController = async (req, res) => {
  try {
    const query = req.query.search || req.query.q || "";
    const category = req.query.category || "";
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const sortOrder = req.query.sort || "a-z";
    
    // Cache Key
    const cacheKey = `songs_search_${query}_${category}_${sortOrder}_${page}_${limit}`;
    const cachedData = getCached(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const categories = category ? category.split(",") : [];

    const result = await searchSongs(query, categories, sortOrder, page, limit);

    setCached(cacheKey, result, 300); // Cache for 5 minutes

    return res.json(result);
  } catch (error) {
    console.error("SEARCH SONGS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while searching songs.",
      songs: []
    });
  }
};

import { scrapeSongDetails } from "../services/providers/detailScraper.js";

/* =========================
   GET SONG DETAILS
========================= */
export const getSongDetailsController = async (req, res) => {
  try {
    const { url, title } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, message: "URL is required" });
    }

    const cacheKey = `song_details_${url}`;
    const cachedData = getCached(cacheKey);
    if (cachedData) {
      return res.json({ success: true, data: { lyrics: cachedData } });
    }

    let lyricsHtml = await scrapeSongDetails(decodeURIComponent(url));
    
    // Cross-Provider Fallback Mechanism
    if (lyricsHtml === "Lyrics not available." && title) {
      const decodedTitle = decodeURIComponent(title);
      console.log(`[Fallback] Primary URL failed. Searching other providers for title: "${decodedTitle}"`);
      
      // Use the existing search logic to find the same song on other providers
      const fallbackSongs = await searchSongs(decodedTitle, []);
      
      // Filter out the primary URL that already failed
      const alternativeSongs = fallbackSongs.filter(song => song.url !== decodeURIComponent(url));
      
      // Try scraping alternatives sequentially
      for (const altSong of alternativeSongs) {
        console.log(`[Fallback] Trying alternative provider: ${altSong.source} (${altSong.url})`);
        const altLyrics = await scrapeSongDetails(altSong.url);
        if (altLyrics !== "Lyrics not available.") {
          console.log(`[Fallback] Success! Recovered lyrics from ${altSong.source}`);
          lyricsHtml = altLyrics;
          break; // Stop after first successful fallback
        }
      }
    }

    if (lyricsHtml !== "Lyrics not available.") {
      setCached(cacheKey, lyricsHtml, 86400); // Cache valid lyrics for 24 hours
    }

    return res.json({
      success: true,
      data: {
        lyrics: lyricsHtml
      }
    });
  } catch (error) {
    console.error("GET SONG DETAILS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* =========================
   GET LATEST SONGS
========================= */
import Song from "../models/Song.js";

export const getLatestSongsController = async (req, res) => {
  try {
    const cacheKey = "songs_latest";
    const cachedData = getCached(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const latestSongs = await Song.find({ status: "completed", isPublished: true })
      .sort({ publishedDate: -1, createdAt: -1 })
      .limit(20)
      .lean();

    const formattedSongs = latestSongs.map(s => ({
      title: s.title,
      titleTamil: s.titleTamil,
      titleEnglish: s.titleEnglish,
      lyrics: s.lyrics,
      lyricsTamil: s.lyricsTamil,
      lyricsEnglish: s.lyricsEnglish,
      artist: s.artist,
      source: s.source,
      publishedDate: s.publishedDate || s.createdAt
    }));

    setCached(cacheKey, formattedSongs, 600); // cache for 10 minutes

    return res.json(formattedSongs);
  } catch (error) {
    console.error("GET LATEST SONGS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
