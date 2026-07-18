import axios from "axios";
import * as cheerio from "cheerio";
import { extractLyricsFromHtml } from "../utils/lyricsExtractor.js";

async function runTest() {
    console.log("Fetching latest posts from WTC...");
    try {
        const indexRes = await axios.get("https://www.worldtamilchristians.com/category/tamil-christians-songs/", {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(indexRes.data);
        const urls = [];
        $('.entry-title a, .post-title a, h2 a').each((i, el) => {
            if (urls.length < 10) {
                urls.push($(el).attr('href'));
            }
        });

        for (let i = 0; i < urls.length; i++) {
            console.log(`\n\n--- [TEST ${i+1}/10] Fetching: ${urls[i]} ---`);
            const res = await axios.get(urls[i], {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const song = extractLyricsFromHtml(res.data, urls[i]);
            
            if (!song) {
                console.log("❌ Extractor returned NULL (rejected or no lyrics found)");
            } else {
                console.log(`TITLE:\n${song.titleTamil}`);
                console.log(`\nLYRICS:\n${song.lyricsTamil}`);
                console.log(`\n(Length: ${song.lyricsTamil.length} chars)`);
            }
        }
    } catch (e) {
        console.error("Test Error:", e.message);
    }
}

runTest();
