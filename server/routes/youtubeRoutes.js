import express from "express";
import fetch from "node-fetch";

const router = express.Router();

const CHANNEL_ID = process.env.CHANNEL_ID;
const API_KEY = process.env.YOUTUBE_API_KEY;

/* =========================
   FETCH HELPER
========================= */
const fetchYT = async (url) => {
  try {
    const res = await fetch(url);
    return await res.json();
  } catch {
    return {};
  }
};

/* =========================
   GET UPLOADS PLAYLIST ID
========================= */
const getUploadsPlaylistId = async () => {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`;

  const data = await fetchYT(url);

  return data?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
};

/* =========================
   GET LATEST VIDEO (GOD MODE RELIABLE)
========================= */
const getLatestVideo = async () => {
  const playlistId = await getUploadsPlaylistId();

  if (!playlistId) return null;

  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=1&key=${API_KEY}`;

  const data = await fetchYT(url);

  const item = data?.items?.[0];

  return {
    videoId: item?.snippet?.resourceId?.videoId || null,
    title: item?.snippet?.title || "No video",
    thumbnail: item?.snippet?.thumbnails?.high?.url || "",
  };
};

/* =========================
   HERO ENDPOINT (100% STABLE)
========================= */
router.get("/", async (req, res) => {
  try {
    const video = await getLatestVideo();

    return res.json({
      videoId: video?.videoId || null,
      title: video?.title || "No video",
      live: false,
    });
  } catch (err) {
    console.error("YouTube GOD MODE error:", err);

    return res.json({
      videoId: null,
      title: "Service unavailable",
      live: false,
    });
  }
});

/* =========================
   LATEST VIDEOS (6 ITEMS)
========================= */
router.get("/latest", async (req, res) => {
  try {
    const playlistId = await getUploadsPlaylistId();

    if (!playlistId) return res.json([]);

    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=6&key=${API_KEY}`;

    const data = await fetchYT(url);

    const videos = (data?.items || []).map((item) => ({
      videoId: item?.snippet?.resourceId?.videoId,
      title: item?.snippet?.title,
      thumbnail: item?.snippet?.thumbnails?.high?.url,
      publishedAt: item?.snippet?.publishedAt,
    }));

    return res.json(videos);
  } catch (err) {
    console.error(err);
    return res.json([]);
  }
});

export default router;