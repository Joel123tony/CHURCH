import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
  try {
    const res = await axios.get('https://tamilchristiansongs.in');
    const $ = cheerio.load(res.data);
    let c = 0;
    $('article, .song-item, .post').each((i, el) => {
      const title = $(el).find('h2, h3, .entry-title, .song-title').first().text().trim();
      if(title) c++;
    });
    console.log('Found elements:', c);
    
    // Test what we get if we just look for all links
    console.log('Total a tags:', $('a').length);
    let links = [];
    $('a').each((i, el) => {
      links.push($(el).text().trim());
    });
    console.log('Some links:', links.slice(0, 10));
  } catch (err) {
    console.error(err.message);
  }
}
test();
