import { resilientFetch } from "../../utils/resilientFetch.js";
import * as cheerio from "cheerio";
import { extractSongsFromHtml } from "../../utils/lyricsExtractor.js";
import { calculateSimilarity } from "../../utils/searchNormalizer.js";
export const isCollectionPage = (url) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.includes('/category/') || lower.includes('/tag/') || lower.includes('/page/');
};

export const isSongPage = (url) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    // TCS valid songs usually have /tamil/lyrics/ in them
    return lower.includes('/tamil/lyrics/') && !isCollectionPage(url) && !lower.includes('?s=');
};

export const extractCollection = async (url) => {
    try {
        const res = await resilientFetch(url, {
            
            timeout: 15000
        });
        const $ = cheerio.load(res.data);
        const childUrls = new Set();
        
        $('.entry-title a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('/tamil/lyrics/')) {
                childUrls.add(href);
            }
        });
        
        return Array.from(childUrls);
    } catch (err) {
        console.error("TCS extractCollection Error:", err.message);
        return [];
    }
};

export const extractSong = async (songUrl) => {
    try {
        const songRes = await resilientFetch(songUrl, {  timeout: 15000 });
        const extractedSongs = await extractSongsFromHtml(songRes.data, songUrl);
        
        if (!extractedSongs || extractedSongs.length === 0) {
            throw new Error("Lyrics could not be found or were rejected by the sanitizer.", { cause: new Error("extractSongsFromHtml returned no songs") });
        }

        return extractedSongs.map(extracted => ({
            titleTamil: extracted.titleTamil,
            titleEnglish: extracted.titleEnglish,
            lyricsTamil: extracted.lyricsTamil,
            lyricsEnglish: extracted.lyricsEnglish,
            artist: "",
            source: "TamilChristianSongs.in",
            sourceUrl: songUrl
        }));
    } catch (error) {
        console.error("TCS extractSong Error:", error.message);
        throw new Error(`TCS Provider Error: ${error.message}`, { cause: error });
    }
};

export const searchSong = async (query) => {
    try {
        const searchUrl = `https://tamilchristiansongs.in/?s=${encodeURIComponent(query)}`;
        const searchRes = await resilientFetch(searchUrl, {  timeout: 10000 });
        
        const $q = cheerio.load(searchRes.data);
        let bestUrl = null;
        let bestScore = 0;
        
        $q('.entry-title a').each((i, el) => {
            const loc = $q(el).attr('href');
            const title = $q(el).text().trim();
            if (loc && loc.includes("/lyrics/")) {
                const score = calculateSimilarity(query, title);
                if (score > bestScore && score >= 0.90) {
                    bestScore = score;
                    bestUrl = loc;
                }
            }
        });

        if (bestUrl) {
            const songs = await extractSong(bestUrl);
            return songs.length > 0 ? songs[0] : null;
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
        const indexRes = await resilientFetch(indexUrl, {  timeout: 10000 });
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
                
            const res = await resilientFetch(pageUrl, {
                
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
