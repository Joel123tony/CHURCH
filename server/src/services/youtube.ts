import { env } from "../config/env";

type LiveStatus = {
  isLive: boolean;
  liveVideoId?: string;
  title?: string;
  viewerCount?: number;
  thumbnailUrl?: string;
};

export async function detectLiveBroadcast(channelId = env.YOUTUBE_CHANNEL_ID): Promise<LiveStatus> {
  if (!channelId || !env.YOUTUBE_API_KEY) {
    return { isLive: false };
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", channelId);
  url.searchParams.set("eventType", "live");
  url.searchParams.set("type", "video");
  url.searchParams.set("key", env.YOUTUBE_API_KEY);

  const response = await fetch(url);
  if (!response.ok) {
    return { isLive: false };
  }

  const data = (await response.json()) as { items?: Array<{ id: { videoId: string }; snippet: { title: string; thumbnails: { high?: { url: string } } } }> };
  const item = data.items?.[0];
  if (!item) {
    return { isLive: false };
  }

  return {
    isLive: true,
    liveVideoId: item.id.videoId,
    title: item.snippet.title,
    thumbnailUrl: item.snippet.thumbnails.high?.url
  };
}

export async function fetchPlaylistSermons(playlistId?: string) {
  if (!playlistId || !env.YOUTUBE_API_KEY) {
    return [];
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
  url.searchParams.set("part", "snippet,contentDetails");
  url.searchParams.set("playlistId", playlistId);
  url.searchParams.set("maxResults", "25");
  url.searchParams.set("key", env.YOUTUBE_API_KEY);

  const response = await fetch(url);
  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.items ?? [];
}

