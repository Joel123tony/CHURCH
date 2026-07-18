import axios from 'axios';
import * as cheerio from 'cheerio';
import { extractLyricsFromHtml } from '../utils/lyricsExtractor.js';

async function run() {
    try {
        const indexRes = await axios.get('http://tamilchristianworship.com/newpraiselinks.html', { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(indexRes.data);
        const links = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.endsWith('.html') && !href.includes('newpraiselinks')) links.push(href);
        });
        console.log('Found', links.length, 'song links.');
        console.log('Sample 1:', links[0]);
        console.log('Sample 2:', links[1]);
        
        // Fetch a sample song
        if (links[0]) {
            const songUrl = 'http://tamilchristianworship.com/' + links[0];
            const songRes = await axios.get(songUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $song = cheerio.load(songRes.data);
            console.log('\n--- Extracting Lyrics ---');
            const extracted = extractLyricsFromHtml(songRes.data, songUrl);
            console.log(extracted);
        }
    } catch(e) { console.error('Error:', e.message); }
}
run();
