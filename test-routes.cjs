require('dotenv').config({path: './server/.env'});

const CHANNEL_ID = 'UCKnY5mrJ-aM4zP1GkKgwBlw';
const API_KEY = process.env.YOUTUBE_API_KEY;

const fetchYT = async (url) => {
  try {
    const res = await fetch(url);
    const json = await res.json();
    console.log(`[fetchYT] url=${url.replace(API_KEY, 'HIDDEN_KEY')} => ${res.status}`);
    if (json.error) console.log(`[fetchYT error]`, json.error.message);
    return json;
  } catch (err) {
    console.error('fetch error', err);
    return {};
  }
};

const run = async () => {
  // 1. Live stream check
  const liveUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&eventType=live&type=video&maxResults=1&key=${API_KEY}`;
  const liveData = await fetchYT(liveUrl);
  console.log('liveData items:', liveData?.items?.length);

  // 2. Playlist ID check
  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`;
  const channelData = await fetchYT(channelUrl);
  const playlistId = channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
  console.log('playlistId:', playlistId);

  // 3. Playlist items (limit 1)
  const url1 = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=1&key=${API_KEY}`;
  const data1 = await fetchYT(url1);
  console.log('limit 1 items:', data1?.items?.length);
  
  // 4. Playlist items (limit 6)
  const url6 = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=6&key=${API_KEY}`;
  const data6 = await fetchYT(url6);
  console.log('limit 6 items:', data6?.items?.length);
};

run().catch(console.error);
