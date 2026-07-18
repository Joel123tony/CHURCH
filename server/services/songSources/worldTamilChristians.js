import axios from "axios";
import * as cheerio from "cheerio";
import { extractLyricsFromHtml } from "../../utils/lyricsExtractor.js";

export const fetchSong = async (songUrl) => {
    try {
        const res = await axios.get(songUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, timeout: 15000 });
        const extracted = extractLyricsFromHtml(res.data, songUrl);
        
        if (!extracted) {
            throw new Error("Lyrics could not be found or were rejected by the sanitizer.");
        }

        return { 
            titleTamil: extracted.titleTamil, 
            titleEnglish: extracted.titleEnglish, 
            lyricsTamil: extracted.lyricsTamil, 
            lyricsEnglish: extracted.lyricsEnglish,
            artist: "",
            source: "World Tamil Christians",
            sourceUrl: songUrl
        };
    } catch (err) {
        console.error("WTC fetchSong Error:", err.message);
        throw new Error(`WTC Provider Error: ${err.message}`);
    }
}

export const searchSong = async (query) => {
    try {
        const searchRes = await axios.get(`https://www.worldtamilchristians.com/?s=${encodeURIComponent(query)}`, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, timeout: 10000 });
        const $q = cheerio.load(searchRes.data);
        
        let bestUrl = null;
        $q('article').each((i, el) => {
            const loc = $q(el).find('.entry-title a').attr('href');
            if (loc && !bestUrl) {
                bestUrl = loc;
            }
        });

        if (bestUrl) {
            return await fetchSong(bestUrl);
        }
        return null;
    } catch (error) {
        console.error("WTC searchSong Error:", error.message);
        return null;
    }
};

export const discoverLatest = async () => {
    try {
        const indexRes = await axios.get("https://www.worldtamilchristians.com/category/tamil-christians-songs/", {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        const $ = cheerio.load(indexRes.data);
        const urls = [];
        $('.entry-title a, .post-title a, h2 a').each((i, el) => {
            if (urls.length < 15) {
                urls.push($(el).attr('href'));
            }
        });
        return urls;
    } catch (error) {
        console.error("WTC discoverLatest Error:", error.message);
        return [];
    }
};

export const discoverAll = async (progressCallback) => {
    const allUrls = new Set();
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        try {
            const pageUrl = page === 1 
                ? "https://www.worldtamilchristians.com/category/tamil-christians-songs/"
                : `https://www.worldtamilchristians.com/category/tamil-christians-songs/page/${page}/`;
                
            const res = await axios.get(pageUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 15000
            });
            
            const $ = cheerio.load(res.data);
            let foundOnPage = 0;
            
            $('.entry-title a, .post-title a, h2 a').each((i, el) => {
                const href = $(el).attr('href');
                if (href && href.includes('worldtamilchristians.com') && !allUrls.has(href)) {
                    allUrls.add(href);
                    foundOnPage++;
                }
            });

            if (foundOnPage === 0) {
                hasMore = false;
            } else {
                if (progressCallback) {
                    progressCallback(Array.from(allUrls));
                }
                page++;
            }
        } catch (err) {
            // Usually 404 means pagination ended
            if (err.response && err.response.status === 404) {
                hasMore = false;
            } else {
                console.error(`WTC discoverAll Error on page ${page}:`, err.message);
                // Try to skip to next page if it wasn't a 404, or abort after too many errors?
                // The prompt says "Continue on errors. If one page fails: log it, skip it, continue."
                // Since this is pagination, if we skip page 2 and page 3 doesn't exist, we might loop. 
                // We'll skip and continue, but add a safeguard.
                page++;
                if (page > 100) hasMore = false; // hard stop safeguard
            }
        }
    }
    return Array.from(allUrls);
};
