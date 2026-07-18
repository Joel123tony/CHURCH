const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  try {
    const r = await axios.get('https://tamilchristiansongs.in/tamil/');
    const $ = cheerio.load(r.data);
    const songs = [];
    
    // Just find any link containing /lyrics/
    $('a').each((i, el) => {
      const url = $(el).attr('href');
      const title = $(el).text().trim();
      if(url && url.includes('/tamil/lyrics/') && title) {
        songs.push({ title, url });
      }
    });
    
    console.log(`Found ${songs.length} lyric links`);
    console.log(songs.slice(0, 5));
  } catch(e) {
    console.error(e);
  }
}
test();
