require('dotenv').config({path: './server/.env'});
async function run() {
  const key = process.env.YOUTUBE_API_KEY;
  let r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=uIqDj5OMK6o&key=${key}`);
  let d = await r.json();
  console.log('uIqDj5OMK6o:', d.items[0].snippet.publishedAt);
  
  r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=9_il_zKFwXM&key=${key}`);
  d = await r.json();
  console.log('9_il_zKFwXM:', d.items[0].snippet.publishedAt);
}
run().catch(console.error);
