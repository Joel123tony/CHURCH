import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.get("/latest", async (req, res) => {
  try {
    const channelId = process.env.CHANNEL_ID;
    const apiKey = process.env.YOUTUBE_API_KEY;

    const url = new URL(
      "https://www.googleapis.com/youtube/v3/search"
    );

    url.searchParams.set("part", "snippet");
    url.searchParams.set("channelId", channelId);
    url.searchParams.set("order", "date");
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "4");
    url.searchParams.set("key", apiKey);

    const response = await fetch(url);
    const data = await response.json();

    const videos =
      data.items?.map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail:
          item.snippet.thumbnails.high?.url,
        publishedAt:
          item.snippet.publishedAt,
      })) || [];

    res.json(videos);
  } catch (err) {
    console.error(err);

    res.status(500).json([]);
  }
});

export default router;