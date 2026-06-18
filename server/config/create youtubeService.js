import fetch from "node-fetch";

const CHANNEL_ID = process.env.CHANNEL_ID;
const API_KEY = process.env.YOUTUBE_API_KEY;

/* =========================
   SIMPLE MEMORY CACHE
========================= */
let cache = {
  hero: null,
  latest: null,
  timestamp: 0,
};

const CACHE_TIME = 1000 * 60 * 5; // 5 minutes

/* =========================
   SAFE FETCH WRAPPER
========================= */
const fetchYT = async (url) => {
  try {
    const res = await fetch(url);
    return await res.json();
  } catch (err) {
    console.error("YouTube fetch error:", err);
    return { items: [] };
  }
};

/* =========================
   EXTRACT VIDEO ID SAFELY
========================= */
const getVideoId = (item) => {
  return item?.id?.videoId || null;
};

/* =========================
   HERO VIDEO (LIVE + LATEST FALLBACK)
========================= */
export const getHeroVideo = async () => {
  const now = Date.now();

  // CACHE HIT
  if (cache.hero && now - cache.timestamp < CACHE_TIME) {
    return cache.hero;
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&order=date&type=video&maxResults=5&key=${API_KEY}`;

    const data = await fetchYT(url);

    const items = data?.items || [];

    // STEP 1: try LIVE video
    const liveVideo = items.find(
      (v) => v?.snippet?.liveBroadcastContent === "live"
    );

    const selected = liveVideo || items[0];

    const result = {
      videoId: getVideoId(selected),
      live: !!liveVideo,
      title: selected?.snippet?.title || "No video",
    };

    cache.hero = result;
    cache.timestamp = now;

    return result;
  } catch (err) {
    console.error("Hero service error:", err);

    return {
      videoId: null,
      live: false,
      title: "Service unavailable",
    };
  }
};

/* =========================
   LATEST VIDEOS (STABLE LIST)
========================= */
export const getLatestVideos = async () => {
  const now = Date.now();

  if (cache.latest && now - cache.timestamp < CACHE_TIME) {
    return cache.latest;
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&order=date&type=video&maxResults=6&key=${API_KEY}`;

    const data = await fetchYT(url);

    const videos = (data?.items || [])
      .map((v) => ({
        id: getVideoId(v),
        title: v?.snippet?.title || "Untitled",
        thumbnail:
          v?.snippet?.thumbnails?.high?.url ||
          v?.snippet?.thumbnails?.medium?.url ||
          "",
        publishedAt: v?.snippet?.publishedAt || null,
      }))
      .filter((v) => v.id);

    cache.latest = videos;
    cache.timestamp = now;

    return videos;
  } catch (err) {
    console.error("Latest service error:", err);
    return [];
  }
};

/* =========================
   CLEAR CACHE (OPTIONAL ADMIN)
========================= */
export const clearYouTubeCache = () => {
  cache = {
    hero: null,
    latest: null,
    timestamp: 0,
  };
};