import fetch from "node-fetch";

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
    return null;
  }
};

/* =========================
   GET UPLOADS PLAYLIST
========================= */
const getUploadsPlaylist = async () => {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`;

  const data = await fetchYT(url);

  return data?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
};

/* =========================
   GET LATEST VIDEO (100% RELIABLE)
========================= */
export const getLatestVideo = async () => {
  const playlistId = await getUploadsPlaylist();

  if (!playlistId) return null;

  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=1&key=${API_KEY}`;

  const data = await fetchYT(url);

  const item = data?.items?.[0];

  if (!item) return null;

  return {
    videoId: item?.snippet?.resourceId?.videoId,
    title: item?.snippet?.title,
    thumbnail: item?.snippet?.thumbnails?.high?.url,
    publishedAt: item?.snippet?.publishedAt,
  };
};

/* =========================
   GET MULTIPLE VIDEOS
========================= */
export const getLatestVideos = async (limit = 6) => {
  const playlistId = await getUploadsPlaylist();

  if (!playlistId) return [];

  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${limit}&key=${API_KEY}`;

  const data = await fetchYT(url);

  return (data?.items || []).map((item) => ({
    videoId: item?.snippet?.resourceId?.videoId,
    title: item?.snippet?.title,
    thumbnail: item?.snippet?.thumbnails?.high?.url,
    publishedAt: item?.snippet?.publishedAt,
  }));
};

/* =========================
   SEARCH YOUTUBE
========================= */
export const searchYouTubeVideos = async (query, limit = 10) => {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=${limit}&key=${API_KEY}`;
  
  const data = await fetchYT(url);

  return (data?.items || []).map((item) => ({
    videoId: item?.id?.videoId,
    title: item?.snippet?.title,
    thumbnail: item?.snippet?.thumbnails?.high?.url,
    publishedAt: item?.snippet?.publishedAt,
    channelTitle: item?.snippet?.channelTitle
  }));
};