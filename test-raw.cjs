require('dotenv').config({path: './server/.env'});
const CHANNEL_ID = 'UCKnY5mrJ-aM4zP1GkKgwBlw';
const API_KEY = process.env.YOUTUBE_API_KEY;

async function run() {
  let r = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`);
  let d = await r.json();
  let pid = d.items[0].contentDetails.relatedPlaylists.uploads;

  // Max results 1
  r = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${pid}&maxResults=1&key=${API_KEY}`);
  let d1 = await r.json();
  
  // Max results 6
  r = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${pid}&maxResults=6&key=${API_KEY}`);
  let d6 = await r.json();
  
  console.log('LIMIT 1 RESPONSE:');
  console.log(JSON.stringify(d1, null, 2));

  console.log('LIMIT 6 RESPONSE:');
  console.log(JSON.stringify(d6, null, 2));
}

run().catch(console.error);
