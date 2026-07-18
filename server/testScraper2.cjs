const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  try {
    const res = await axios.get('https://tamilchristiansongs.in/tamil/lyrics/', { timeout: 10000 });
    const $ = cheerio.load(res.data);
    const songs = [];
    
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      const title = $(el).text().trim();
      if (href && title && title.length > 2 && (href.includes('/song/') || href.includes('/lyrics/'))) {
        songs.push({ title, href });
      }
    });

    console.log(`Found ${songs.length} potential links`);
    console.log(songs.slice(0, 10));
    
  } catch (err) {
    console.error("Scraper Error:", err.message);
  }
}

test();
