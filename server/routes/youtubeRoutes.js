import express from "express";
import fetch from "node-fetch";

const router = express.Router();

const CHANNEL_ID = process.env.CHANNEL_ID;
const API_KEY = process.env.YOUTUBE_API_KEY;

/* =========================
   SAFE FETCH WITH TIMEOUT
========================= */
const fetchYouTube = async (params) => {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");

  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", CHANNEL_ID);
  url.searchParams.set("key", API_KEY);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
};

/* =====================================================
   🔥 MAIN ENDPOINT (SMART LIVE + LATEST)
   /api/youtube
===================================================== */
router.get("/", async (req, res) => {
  try {
    // 🔴 TRY LIVE STREAM (MORE RELIABLE QUERY)
    const liveData = await fetchYouTube({
      eventType: "live",
      type: "video",
      maxResults: 1,
    });

    const liveVideo = liveData?.items?.[0];

    if (liveVideo?.id?.videoId) {
      return res.json({
        live: true,
        videoId: liveVideo.id.videoId,
        title: liveVideo.snippet.title,
      });
    }

    // 🎥 FALLBACK: LATEST VIDEO
    const latestData = await fetchYouTube({
      order: "date",
      type: "video",
      maxResults: 1,
    });

    const latestVideo = latestData?.items?.[0];

    return res.json({
      live: false,
      videoId: latestVideo?.id?.videoId || null,
      title: latestVideo?.snippet?.title || "No video found",
    });
  } catch (err) {
    console.error("YouTube Smart API Error:", err);

    return res.status(200).json({
      live: false,
      videoId: null,
      title: "Service unavailable",
    });
  }
});

/* =====================================================
   🔥 LIVE ONLY ENDPOINT
   /api/youtube/live
===================================================== */
router.get("/live", async (req, res) => {
  try {
    const data = await fetchYouTube({
      eventType: "live",
      type: "video",
      maxResults: 1,
    });

    const video = data?.items?.[0];

    return res.json({
      live: !!video?.id?.videoId,
      videoId: video?.id?.videoId || null,
      title: video?.snippet?.title || null,
    });
  } catch (err) {
    console.error("Live API Error:", err);

    return res.status(200).json({
      live: false,
      videoId: null,
      title: null,
    });
  }
});

/* =====================================================
   🔥 LATEST VIDEOS (STABLE LIST)
   /api/youtube/latest
===================================================== */
router.get("/latest", async (req, res) => {
  try {
    const data = await fetchYouTube({
      order: "date",
      type: "video",
      maxResults: 4,
    });

    const videos =
      data?.items?.map((item) => ({
        id: item?.id?.videoId,
        title: item?.snippet?.title,
        thumbnail: item?.snippet?.thumbnails?.high?.url,
        publishedAt: item?.snippet?.publishedAt,
      })) || [];

    return res.json(videos);
  } catch (err) {
    console.error("Latest API Error:", err);

    return res.status(200).json([]);
  }
});

export default router;