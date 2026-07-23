import axios from 'axios';
import { extractLyricsFromHtml } from '../utils/lyricsExtractor.js';

const url = "https://www.worldtamilchristians.com/tamil-christians-songs/neer-enna-marakala-lyrics-%e0%ae%a8%e0%af%80%e0%ae%b0%e0%af%8d-%e0%ae%8e%e0%ae%a9%e0%af%8d%e0%ae%a9-%e0%ae%ae%e0%ae%b1%e0%ae%95%e0%af%8d%e0%ae%95%e0%ae%b2-lyrics-g-a-godwin-david-helen-mary-jo/";

async function run() {
    console.log(`Fetching ${url}`);
    try {
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
        console.log(`HTML size: ${res.data.length}`);
        const extracted = extractLyricsFromHtml(res.data, url);
        console.log(`Extracted:`, extracted);
    } catch(err) {
        console.error("WTC Error", err.message);
    }
}
run();
