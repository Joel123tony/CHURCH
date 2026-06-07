import express from "express";
import axios from "axios";

const router = express.Router();

// GET LIVE STREAM
router.get("/live", async (req, res) => {
  try {
    const channelId = process.env.CHANNEL_ID;

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          channelId,
          eventType: "live",
          type: "video",
          key: process.env.YOUTUBE_API_KEY,
        },
      }
    );

    const liveVideo = response.data.items?.[0];

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
