require('dotenv').config({path: './server/.env'});
async function run() {
  const cid = process.env.CHANNEL_ID;
  const key = process.env.YOUTUBE_API_KEY;
  let r = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${cid}&key=${key}`);
  let d = await r.json();
  let pid = d.items[0].contentDetails.relatedPlaylists.uploads;
  r = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${pid}&maxResults=6&key=${key}`);
  d = await r.json();
  console.log(d.items.map(i => i.snippet.resourceId.videoId));
}
run().catch(console.error);
