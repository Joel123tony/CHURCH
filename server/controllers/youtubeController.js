import axios from "axios";
import { getCached, setCached } from "../utils/cache.js";

const CHANNEL_ID = process.env.CHANNEL_ID;
const CACHE_KEY = "youtube_latest";

const YT_BASE = "https://www.googleapis.com/youtube/v3/search";

/* =========================
   SAFE AXIOS WRAPPER
========================= */
const safeGet = async (params) => {
  try {
    const res = await axios.get(YT_BASE, { params });
    return res.data;
  } catch (err) {
    console.error("YouTube API Error:", err.message);
    return { items: [] };
  }
};

/* =========================
   SAFE EXTRACTOR
========================= */
const getVideoId = (item) => {
  return item?.id?.videoId || null;
};

/* =========================
   🔴 LIVE CHECK (SAFE)
========================= */
const getLiveVideo = async (apiKey) => {
  const data = await safeGet({
    part: "snippet",
    channelId: CHANNEL_ID,
    eventType: "live",
    type: "video",
    maxResults: 1,
    key: apiKey,
  });

  const item = data?.items?.[0];

  if (!item) return null;

  return {
    videoId: getVideoId(item),
    title: item?.snippet?.title || "Live Video",
  };
};

/* =========================
   🎥 LATEST VIDEO (SAFE)
========================= */
const getLatestVideo = async (apiKey) => {
  const data = await safeGet({
    part: "snippet",
    channelId: CHANNEL_ID,
    order: "date",
    type: "video",
    maxResults: 1,
    key: apiKey,
  });

  const item = data?.items?.[0];

  if (!item) return null;

  return {
    videoId: getVideoId(item),
    title: item?.snippet?.title || "Latest Video",
  };
};

/* =========================
   🚀 MAIN CONTROLLER (GOD MODE)
========================= */
export const getCurrentVideo = async (req, res) => {
  try {
    const cachedData = getCached(CACHE_KEY);
    if (cachedData) {
      return res.json(cachedData);
    }

    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey || !CHANNEL_ID) {
      return res.status(200).json({
        success: false,
        videoId: null,
        isLive: false,
        message: "Missing API config",
      });
    }

    // STEP 1: try live
    const liveVideo = await getLiveVideo(apiKey);

    // STEP 2: fallback latest
    const latestVideo = await getLatestVideo(apiKey);

    const selected = liveVideo || latestVideo;

    const responsePayload = {
      success: true,
      isLive: !!liveVideo,
      videoId: selected?.videoId || null,
      title: selected?.title || "No video found",
    };

    setCached(CACHE_KEY, responsePayload, 120); // Cache for 2 minutes to save quota

    return res.json(responsePayload);
  } catch (error) {
    console.error("Controller Crash:", error.message);

    return res.status(200).json({
      success: false,
      isLive: false,
      videoId: null,
      title: "Service unavailable",
    });
  }
};