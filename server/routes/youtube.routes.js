import express from "express";

const router = express.Router();

// GET LIVE STREAM
router.get("/live", async (req, res) => {
  try {
    const channelId = process.env.CHANNEL_ID;

    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("channelId", channelId);
    url.searchParams.set("eventType", "live");
    url.searchParams.set("type", "video");
    url.searchParams.set("key", process.env.YOUTUBE_API_KEY);

    const response = await fetch(url);
    const data = await response.json();

    const liveVideo = data.items?.[0];

    if (!liveVideo) {
      return res.json({ live: false });
    }

    res.json({
      live: true,
      videoId: liveVideo.id.videoId,
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

export default router;
