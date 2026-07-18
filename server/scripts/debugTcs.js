import axios from 'axios';
import { extractLyricsFromHtml } from '../utils/lyricsExtractor.js';
import * as cheerio from 'cheerio';

const url = "https://tamilchristiansongs.in/neer-enna-marakkala-lyrics/";

async function run() {
    console.log(`Fetching ${url}`);
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
    const html = res.data;
    
    console.log(`HTML size: ${html.length}`);
    const $ = cheerio.load(html);
    console.log("Page Title:", $('title').text());
    const contentArea = $('.td-post-content, .tdb-block-inner, .entry-content, article, #content, .content, main').first();
    console.log(`contentArea length: ${contentArea.length}`);
    
    if (contentArea.length) {
        // console.log("Raw HTML inside contentArea (first 200 chars):", contentArea.html().substring(0, 200));
        console.log("Plain Text (first 500 chars):", contentArea.text().substring(0, 500));
    }
    
    console.log("Classes on main:", $('main').attr('class'));
    console.log("Classes on article:", $('article').attr('class'));
    console.log("Classes on #content:", $('#content').attr('class'));
    
    const hasTamil = /[\u0B80-\u0BFF]/.test(html);
    console.log(`Raw HTML has Tamil characters: ${hasTamil}`);
    
    // Find where Tamil text is
    if (hasTamil) {
        const tamilMatch = html.match(/[^>]*[\u0B80-\u0BFF]+[^<]*/);
        if (tamilMatch) console.log("First Tamil occurrence:", tamilMatch[0]);
    }

    const extracted = extractLyricsFromHtml(html, url);
    console.log(`Extracted:`, extracted);
}
run();
