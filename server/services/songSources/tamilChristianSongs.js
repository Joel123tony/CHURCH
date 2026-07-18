import axios from "axios";
import * as cheerio from "cheerio";
import { extractLyricsFromHtml } from "../../utils/lyricsExtractor.js";

export const fetchSong = async (songUrl) => {
    try {
        const songRes = await axios.get(songUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, timeout: 15000 });
        const extracted = extractLyricsFromHtml(songRes.data, songUrl);
        
        if (!extracted) {
            throw new Error("Lyrics could not be found or were rejected by the sanitizer.");
        }

        return {
            titleTamil: extracted.titleTamil,
            titleEnglish: extracted.titleEnglish,
            lyricsTamil: extracted.lyricsTamil,
            lyricsEnglish: extracted.lyricsEnglish,
            artist: "",
            source: "TamilChristianSongs.in",
            sourceUrl: songUrl
        };
    } catch (error) {
        console.error("TCS fetchSong Error:", error.message);
        throw new Error(`TCS Provider Error: ${error.message}`);
    }
};

export const searchSong = async (query) => {
    try {
        const searchUrl = `https://tamilchristiansongs.in/?s=${encodeURIComponent(query)}`;
        const searchRes = await axios.get(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, timeout: 10000 });
        
        const $q = cheerio.load(searchRes.data);
        let bestUrl = null;
        let rawTitle = "";
        
        $q('article').each((i, el) => {
            const loc = $q(el).find('.entry-title a').attr('href');
            const title = $q(el).find('.entry-title a').text().trim();
            if (loc && loc.includes("/tamil/lyrics/") && !bestUrl) {
                bestUrl = loc;
                rawTitle = title;
            }
        });

        if (bestUrl) {
            return await fetchSong(bestUrl);
        }
        
        return null;
    } catch (error) {
        console.error("TCS searchSong Error:", error.message);
        return null;
    }
};

export const discoverLatest = async () => {
    try {
        const indexUrl = "https://tamilchristiansongs.in/category/tamil-christian-songs/";
        const indexRes = await axios.get(indexUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, timeout: 10000 });
        const $ = cheerio.load(indexRes.data);
        const urls = [];
        $('.entry-title a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes("/tamil/lyrics/") && urls.length < 15) {
                urls.push(href);
            }
        });
        return urls;
    } catch (error) {
        console.error("TCS discoverLatest Error:", error.message);
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
                ? "https://tamilchristiansongs.in/category/tamil-christian-songs/"
                : `https://tamilchristiansongs.in/category/tamil-christian-songs/page/${page}/`;
                
            const res = await axios.get(pageUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 15000
            });
            
            const $ = cheerio.load(res.data);
            let foundOnPage = 0;
            
            $('.entry-title a').each((i, el) => {
                const href = $(el).attr('href');
                if (href && href.includes("/tamil/lyrics/") && !allUrls.has(href)) {
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
            if (err.response && err.response.status === 404) {
                hasMore = false;
            } else {
                console.error(`TCS discoverAll Error on page ${page}:`, err.message);
                page++;
                if (page > 100) hasMore = false;
            }
        }
    }
    return Array.from(allUrls);
};
