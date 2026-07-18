const axios = require('axios');
const cheerio = require('cheerio');

async function testSearch(query) {
  try {
    const url = `https://tamilchristiansongs.in/?s=${encodeURIComponent(query)}`;
    console.log(`Fetching: ${url}`);
    const res = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(res.data);
    
    const songs = [];
    
    $('a[href*="/lyrics/"]').each((i, el) => {
      const href = $(el).attr('href');
      const title = $(el).text().trim();
      
      if (
          href && 
          title && 
          title.length > 2 && 
          href.includes("/lyrics/") && 
          !href.includes("/page/") &&
          !href.includes("/author/") &&
          !href.includes("/category/") &&
          !href.endsWith("/lyrics") && 
          !href.endsWith("/lyrics/") &&
          !songs.some(s => s.href === href)
      ) {
        songs.push({ title, href });
      }
    });

    console.log(`Found ${songs.length} unique search results`);
    console.log(songs.slice(0, 10));
    
  } catch (err) {
    console.error("Search Error:", err.message);
  }
}

testSearch('aaradhanai');
