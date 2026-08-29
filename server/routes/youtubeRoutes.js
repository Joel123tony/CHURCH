import express from "express";
import fetch from "node-fetch";
import { getCached, setCached, isCacheStale } from "../utils/cache.js";
import { perfStorage } from "../utils/perfTracker.js";

const router = express.Router();

const CHANNEL_ID = process.env.CHANNEL_ID;
const API_KEY = process.env.YOUTUBE_API_KEY;

const CACHE_TTL_PLAYLIST = 86400; // 24 hours
const CACHE_TTL_VIDEOS = 300;     // 5 minutes
const CACHE_TTL_LIVE = 60;        // 60 seconds for live detection

/* =========================
   FETCH HELPER
========================= */
const fetchYT = async (url) => {
  const store = perfStorage.getStore();
  const start = process.hrtime.bigint();
  try {
    const res = await fetch(url);
    return await res.json();
  } catch {
    return {};
  } finally {
    if (store) {
      const duration = Number(process.hrtime.bigint() - start) / 1e6;
      store.youtubeMs += duration;
    }
  }
};

/* =========================
   GET UPLOADS PLAYLIST ID
========================= */
const getUploadsPlaylistId = async () => {
  const cachedId = getCached("yt_uploads_playlist_id");
  if (cachedId) return cachedId;

  const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`;
  const data = await fetchYT(url);

  const playlistId = data?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
  if (playlistId) {
    setCached("yt_uploads_playlist_id", playlistId, CACHE_TTL_PLAYLIST);
  }
  return playlistId;
};

/* =========================
   CHECK ACTIVE LIVE STREAM (60s TTL)
========================= */
const getLiveStream = async () => {
  const cachedLive = getCached("yt_active_live_stream");
  if (cachedLive !== null && !isCacheStale("yt_active_live_stream")) {
    return cachedLive;
  }

  try {
    const liveUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&eventType=live&type=video&maxResults=1&key=${API_KEY}`;
    const data = await fetchYT(liveUrl);
    const item = data?.items?.[0];

    const liveData = item ? {
      videoId: item.id?.videoId || null,
      title: item.snippet?.title || "Live Stream",
      live: true
    } : null;

    setCached("yt_active_live_stream", liveData, CACHE_TTL_LIVE);
    return liveData;
  } catch {
    setCached("yt_active_live_stream", null, CACHE_TTL_LIVE);
    return null;
  }
};

/* =========================
   GET PLAYLIST VIDEOS (HERO & LATEST SHARE THIS)
========================= */
const getPlaylistVideos = async (limit = 6) => {
  const cacheKey = `yt_playlist_videos_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const playlistId = await getUploadsPlaylistId();
  if (!playlistId) return [];

  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${limit}&key=${API_KEY}`;
  const data = await fetchYT(url);

  const videos = (data?.items || []).map((item) => ({
    videoId: item?.snippet?.resourceId?.videoId,
    title: item?.snippet?.title,
    thumbnail: item?.snippet?.thumbnails?.high?.url,
    publishedAt: item?.snippet?.publishedAt,
  }));

  if (videos.length > 0) {
    setCached(cacheKey, videos, CACHE_TTL_VIDEOS);
  }

  return videos;
};

/* =========================
   EXPORTS FOR AGGREGATOR
========================= */
export const getYoutubeHeroData = async () => {
  try {
    const cacheKey = "yt_endpoint_hero_response";
    const cachedHero = getCached(cacheKey, true);

    if (isCacheStale(cacheKey) || !cachedHero) {
      (async () => {
        try {
          const liveVideo = await getLiveStream();
          if (liveVideo && liveVideo.videoId) {
            setCached(cacheKey, liveVideo, CACHE_TTL_LIVE);
            return;
          }
          const videos = await getPlaylistVideos(1);
          const latest = videos[0];
          const responsePayload = {
            videoId: latest?.videoId || null,
            title: latest?.title || "No video",
            live: false,
          };
          setCached(cacheKey, responsePayload, CACHE_TTL_VIDEOS);
        } catch (err) {
          console.error("Background YouTube Hero Error:", err);
        }
      })();
    }

    if (cachedHero) return cachedHero;

    return { videoId: null, title: "Loading...", live: false, backgroundFetch: true };
  } catch (err) {
    console.error("YouTube Hero Error:", err);
    return { videoId: null, title: "Service unavailable", live: false };
  }
};

export const getYoutubeLatestData = async () => {
  try {
    const cacheKey = "yt_endpoint_latest_response";
    const cachedLatest = getCached(cacheKey, true);

    if (isCacheStale(cacheKey) || !cachedLatest) {
      (async () => {
        try {
          const videos = await getPlaylistVideos(6);
          if (videos.length > 0) {
            setCached(cacheKey, videos, CACHE_TTL_VIDEOS);
          }
        } catch (err) {
          console.error("Background YouTube Latest Error:", err);
        }
      })();
    }

    if (cachedLatest) return cachedLatest;

    return [];
  } catch (err) {
    console.error("YouTube Latest Error:", err);
    return [];
  }
};

/* =========================
   HERO ENDPOINT (/api/youtube)
========================= */
router.get("/", async (req, res) => {
  const hero = await getYoutubeHeroData();
  return res.json(hero);
});

/* =========================
   LATEST VIDEOS ENDPOINT (/api/youtube/latest)
========================= */
router.get("/latest", async (req, res) => {
  const latest = await getYoutubeLatestData();
  return res.json(latest);
});

export default router;
