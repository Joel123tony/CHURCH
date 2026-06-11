import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.get("/live", async (req, res) => {
  try {
    const channelId = process.env.CHANNEL_ID;

    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("channelId", channelId);
    url.searchParams.set("eventType", "live");
    url.searchParams.set("type", "video");
    url.searchParams.set("order", "date");
    url.searchParams.set("key", process.env.YOUTUBE_API_KEY);

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({
        live: false,
        error: data.error.message,
      });
    }

    const liveVideo = data.items?.find(
      (item) => item.snippet?.liveBroadcastContent === "live"
    );

    if (!liveVideo) {
      return res.json({ live: false });
    }

    return res.json({
      live: true,
      videoId: liveVideo.id.videoId,
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
});

router.get("/latest", async (req, res) => {
  try {
    const channelId = process.env.CHANNEL_ID;

    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("channelId", channelId);
    url.searchParams.set("order", "date");
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "1");
    url.searchParams.set("key", process.env.YOUTUBE_API_KEY);

    const response = await fetch(url);
    const data = await response.json();

    const video = data.items?.[0];

    res.json({
      videoId: video?.id?.videoId || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;