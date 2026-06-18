import express from "express";
import fetch from "node-fetch";

const router = express.Router();

const CHANNEL_ID = process.env.CHANNEL_ID;
const API_KEY = process.env.YOUTUBE_API_KEY;

/* -----------------------------
   SAFE YOUTUBE FETCH HELPER
------------------------------*/
const fetchYouTube = async (params) => {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");

  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", CHANNEL_ID);
  url.searchParams.set("key", API_KEY);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  // ⛑ timeout safety (prevents hanging requests)
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
   SMART: LIVE OR LATEST (MAIN ENDPOINT - KEEP THIS)
===================================================== */
router.get("/", async (req, res) => {
  try {
    // 🔴 CHECK LIVE
    const liveData = await fetchYouTube({
      eventType: "live",
      type: "video",
    });

    if (liveData?.items?.length > 0) {
      return res.json({
        live: true,
        videoId: liveData.items[0].id.videoId,
      });
    }

    // 🎥 FALLBACK LATEST
    const latestData = await fetchYouTube({
      order: "date",
      type: "video",
      maxResults: 1,
    });

    return res.json({
      live: false,
      videoId: latestData?.items?.[0]?.id?.videoId || null,
    });
  } catch (err) {
    console.error("YouTube Smart API Error:", err);

    return res.status(500).json({
      live: false,
      videoId: null,
    });
  }
});

/* =====================================================
   LIVE ONLY (UNCHANGED BEHAVIOR)
===================================================== */
router.get("/live", async (req, res) => {
  try {
    const data = await fetchYouTube({
      eventType: "live",
      type: "video",
    });

    if (data?.items?.length) {
      return res.json({
        live: true,
        videoId: data.items[0].id.videoId,
      });
    }

    return res.json({
      live: false,
      videoId: null,
    });
  } catch (err) {
    console.error("Live API Error:", err);

    return res.status(500).json({
      live: false,
      videoId: null,
    });
  }
});

/* =====================================================
   LATEST 4 VIDEOS (UNCHANGED OUTPUT STRUCTURE)
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
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.high?.url,
        publishedAt: item.snippet.publishedAt,
      })) || [];

    return res.json(videos);
  } catch (err) {
    console.error("Latest API Error:", err);
    return res.status(500).json([]);
  }
});

export default router;