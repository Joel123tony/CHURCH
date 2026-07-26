import { searchSongs } from "../services/songService.js";
import { getCached, setCached } from "../utils/cache.js";
import mongoose from "mongoose";
import Song from "../models/Song.js";
import { prepareSongForClient, normalizeLyricsText } from "../utils/songNormalization.js";
import { withPerfTimer, recordPerf } from "../utils/perfTracker.js";

/* =========================
   SEARCH MULTI-SOURCE
========================= */
export const searchSongsController = async (req, res) => {
  const reqStart = Date.now();
  try {
    const query = req.query.search || req.query.q || "";
    const category = req.query.category || "";
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const sortOrder = req.query.sort || "a-z";
    
    // Cache Key
    const cacheKey = `songs_search_${query}_${category}_${sortOrder}_${page}_${limit}`;
    const cacheStart = process.hrtime.bigint();
    const cachedData = getCached(cacheKey);
    const cacheEnd = process.hrtime.bigint();
    recordPerf("cacheLookup", Number(cacheEnd - cacheStart) / 1000000);
    
    if (cachedData) {
      console.log(`[SongController] Search "${query}" resolved from ultra-fast cache in ${Date.now() - reqStart}ms`);
      return res.json(cachedData);
    }

    const categories = category ? category.split(",") : [];

    const result = await searchSongs(query, categories, sortOrder, page, limit);

    if (query && !(result.songs || []).length && result.status !== "searching_online") {
      const notFoundResponse = {
        success: false,
        message: "Song not found.",
        songs: [],
        data: []
      };
      return res.json(notFoundResponse);
    }

    const response = {
      ...result,
      data: result.songs || []
    };

    // TTL updated to 24 hours (86400 seconds) to ensure long caching for successful queries
    setCached(cacheKey, response, 86400); 
    console.log(`[SongController] Search "${query}" completed in ${Date.now() - reqStart}ms`);
    return res.json(response);
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
    const requestedId = req.params.slug || req.query.slug || req.query.url || req.query.id;
    const title = req.query.title;
    if (!requestedId) {
      return res.status(400).json({ success: false, message: "URL or slug is required" });
    }

    const decodedId = decodeURIComponent(requestedId);
    const cacheKey = `song_details_${decodedId}`;
    const cachedData = getCached(cacheKey);
    if (cachedData) {
      if (typeof cachedData === "string") {
        return res.json({
          success: true,
          data: {
            lyrics: normalizeLyricsText(cachedData)
          }
        });
      }
      return res.json(cachedData);
    }

    const orConditions = [
      { slug: decodedId },
      { url: decodedId },
      { sourceUrl: decodedId }
    ];

    if (mongoose.Types.ObjectId.isValid(decodedId)) {
      orConditions.push({ _id: decodedId });
    }

    const existingSong = await Song.findOne({
      $or: orConditions
    }).lean();

    if (existingSong) {
      const retry = req.query.retry === "true";
      
      if (retry && existingSong.lyricsStatus === "failed") {
          console.log(`[SongController] Retry requested for failed song: ${existingSong.title}`);
          const { QueueManager } = await import("../utils/queueManager.js");
          await QueueManager.addJob("import", {
              url: existingSong.url || existingSong.sourceUrl,
              source: existingSong.source,
              metadata: {
                  title: existingSong.title,
                  titleTamil: existingSong.titleTamil,
                  category: existingSong.category
              }
          }, existingSong._id);
          
          await Song.findByIdAndUpdate(existingSong._id, {
              lyricsStatus: "pending",
              status: "processing",
              isPendingLyrics: true,
              retryCount: 0 // Reset retry count on manual retry
          });

          return res.json({
              success: true,
              data: {
                  ...prepareSongForClient(existingSong),
                  lyrics: "pending_fetch"
              }
          });
      }

      const prepared = prepareSongForClient(existingSong);
      const response = {
        success: true,
        data: {
          ...prepared,
          lyrics: normalizeLyricsText(prepared.lyrics || prepared.lyricsTamil || ""),
          originalLyrics: normalizeLyricsText(prepared.originalLyrics || ""),
          cleanLyrics: normalizeLyricsText(prepared.cleanLyrics || prepared.lyrics || ""),
          cleanedLyrics: normalizeLyricsText(prepared.cleanedLyrics || prepared.lyrics || "")
        }
      };
      setCached(cacheKey, response, 600);
      return res.json(response);
    }

    let lyricsHtml = await scrapeSongDetails(decodedId);
    
    // Cross-Provider Fallback Mechanism
    if (lyricsHtml === "Lyrics not available." && title) {
      const decodedTitle = decodeURIComponent(title);
      console.log(`[Fallback] Primary URL failed. Searching other providers for title: "${decodedTitle}"`);
      
      // Use the existing search logic to find the same song on other providers
      // searchSongs now runs fast (AI is async)
      const fallbackSongs = await searchSongs(decodedTitle, []);
      
      // Filter out the primary URL that already failed
      const alternativeSongs = fallbackSongs.songs ? fallbackSongs.songs.filter(song => song.url !== decodedId) : [];
      
      // Use lyrics directly from the alternative songs without re-scraping
      const validAltSong = alternativeSongs.find(s => s.lyrics && s.lyrics !== "pending_fetch" && s.lyrics !== "Lyrics not available.");
      
      if (validAltSong) {
          console.log(`[Fallback] Success! Recovered lyrics from ${validAltSong.source}`);
          lyricsHtml = validAltSong.cleanedLyrics || validAltSong.lyrics;
      }
    }

    const response = {
      success: true,
      data: {
        lyrics: normalizeLyricsText(lyricsHtml)
      }
    };
    setCached(cacheKey, response, 86400);
    return res.json(response);
  } catch (error) {
    console.error("GET SONG DETAILS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* =========================
   GET LATEST SONGS
========================= */

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

    const formattedSongs = latestSongs.map((s) => {
      const prepared = prepareSongForClient(s);
      return {
        ...prepared,
        lyrics: normalizeLyricsText(prepared.lyrics || ""),
        lyricsTamil: normalizeLyricsText(prepared.lyricsTamil || prepared.lyrics || ""),
        originalLyrics: normalizeLyricsText(prepared.originalLyrics || ""),
        cleanLyrics: normalizeLyricsText(prepared.cleanLyrics || prepared.lyrics || ""),
        cleanedLyrics: normalizeLyricsText(prepared.cleanedLyrics || prepared.lyrics || ""),
        publishedDate: s.publishedDate || s.createdAt
      };
    });

    const payload = { success: true, data: formattedSongs, songs: formattedSongs };
    setCached(cacheKey, payload, 600); // cache for 10 minutes

    return res.json(payload);
  } catch (error) {
    console.error("GET LATEST SONGS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
