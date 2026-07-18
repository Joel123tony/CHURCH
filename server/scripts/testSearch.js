import axios from 'axios';
import * as cheerio from 'cheerio';

async function run() {
    const url = "https://tamilchristiansongs.in/category/tamil-christian-songs/";
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }});
    const $ = cheerio.load(res.data);
    console.log("TCS Title:", $('title').text());
    let validUrls = [];
    $('.entry-title a, .td-image-wrap').each((i, el) => {
        let h = $(el).attr('href');
        if (h && h.includes('tamilchristiansongs.in') && h.includes('-lyrics')) {
            validUrls.push(h);
        }
    });
    console.log(`Song URLs:`, validUrls.slice(0, 5));
}
run();
