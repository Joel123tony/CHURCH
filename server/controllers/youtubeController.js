import axios from "axios";

const CHANNEL_ID = "UC5mM5x7g4c4Z7wzW4eLw6AA"; // replace with your actual channel ID

export const getCurrentVideo = async (req, res) => {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;

    // Check for live stream
    const liveResponse = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          channelId: CHANNEL_ID,
          eventType: "live",
          type: "video",
          key: apiKey,
        },
      }
    );

    if (liveResponse.data.items.length > 0) {
      return res.json({
        success: true,
        isLive: true,
        videoId: liveResponse.data.items[0].id.videoId,
      });
    }

    // Latest uploaded video
    const latestResponse = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          channelId: CHANNEL_ID,
          order: "date",
          maxResults: 1,
          type: "video",
          key: apiKey,
        },
      }
    );

    return res.json({
      success: true,
      isLive: false,
      videoId: latestResponse.data.items[0].id.videoId,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch YouTube data",
    });
  }
};