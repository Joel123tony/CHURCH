import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const channelId = process.env.CHANNEL_ID;
    const apiKey = process.env.YOUTUBE_API_KEY;

    // CHECK LIVE FIRST
    const liveUrl = new URL(
      "https://www.googleapis.com/youtube/v3/search"
    );

    liveUrl.searchParams.set("part", "snippet");
    liveUrl.searchParams.set("channelId", channelId);
    liveUrl.searchParams.set("eventType", "live");
    liveUrl.searchParams.set("type", "video");
    liveUrl.searchParams.set("key", apiKey);

    const liveResponse = await fetch(liveUrl);
    const liveData = await liveResponse.json();

    const liveVideo = liveData.items?.[0];

    if (liveVideo) {
      return res.json({
        live: true,
        videoId: liveVideo.id.videoId,
      });
    }

    // FETCH LATEST VIDEO
    const latestUrl = new URL(
      "https://www.googleapis.com/youtube/v3/search"
    );

    latestUrl.searchParams.set("part", "snippet");
    latestUrl.searchParams.set("channelId", channelId);
    latestUrl.searchParams.set("order", "date");
    latestUrl.searchParams.set("type", "video");
    latestUrl.searchParams.set("maxResults", "1");
    latestUrl.searchParams.set("key", apiKey);

    const latestResponse = await fetch(latestUrl);
    const latestData = await latestResponse.json();

    const latestVideo = latestData.items?.[0];

    return res.json({
      live: false,
      videoId: latestVideo?.id?.videoId || null,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      live: false,
      videoId: null,
    });
  }
});

export default router;