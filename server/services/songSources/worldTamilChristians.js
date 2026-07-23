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
    return !isCollectionPage(url) && !lower.includes('/author/') && !lower.includes('?s=');
};

export const extractCollection = async (url) => {
    try {
        const res = await resilientFetch(url, {
            
            timeout: 15000
        });
        const $ = cheerio.load(res.data);
        const childUrls = new Set();
        
        $('.entry-title a, .post-title a, h2 a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('worldtamilchristians.com')) {
                childUrls.add(href);
            }
        });
        
        return Array.from(childUrls);
    } catch (err) {
        console.error("WTC extractCollection Error:", err.message);
        return [];
    }
};

export const extractSong = async (songUrl) => {
    try {
        const res = await resilientFetch(songUrl, { 
             
            timeout: 15000 
        });
        const extractedSongs = await extractSongsFromHtml(res.data, songUrl);
        
        if (!extractedSongs || extractedSongs.length === 0) {
            throw new Error("Lyrics could not be found or were rejected by the sanitizer.", { cause: new Error("extractSongsFromHtml returned no songs") });
        }

        return extractedSongs.map(extracted => ({ 
            titleTamil: extracted.titleTamil, 
            titleEnglish: extracted.titleEnglish, 
            lyricsTamil: extracted.lyricsTamil, 
            lyricsEnglish: extracted.lyricsEnglish,
            artist: "",
            source: "World Tamil Christians",
            sourceUrl: songUrl
        }));
    } catch (err) {
        console.error("WTC extractSong Error:", err.message);
        throw new Error(`WTC Provider Error: ${err.message}`, { cause: err });
    }
}

export const searchSong = async (query) => {
    try {
        const searchRes = await resilientFetch(`https://www.worldtamilchristians.com/?s=${encodeURIComponent(query)}`, { 
             
            timeout: 10000 
        });
        const $q = cheerio.load(searchRes.data);
        
        if (searchRes.data.includes('grecaptcha') || searchRes.data.includes('403 Forbidden')) {
            console.warn(`[WTC] WAF Bot Verification blocked search for "${query}". Returning null.`);
            return null;
        }

        let bestUrl = null;
        let bestScore = 0;
        
        $q('.post-title a, .entry-title a, h2 a, h3 a').each((i, el) => {
            const loc = $q(el).attr('href');
            const title = $q(el).text().trim();
            if (loc && loc.includes('worldtamilchristians.com')) {
                const score = calculateSimilarity(query, title);
                if (score > bestScore && score >= 0.85) {
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
        if (error.message.includes('403') || error.message.includes('503')) {
            console.warn(`[WTC] WAF blocked search for "${query}". Returning null.`);
            return null;
        }
        console.error("WTC searchSong Error:", error.message);
        return null;
    }
};

export const discoverLatest = async () => {
    try {
        const indexRes = await resilientFetch("https://www.worldtamilchristians.com/category/tamil-christians-songs/", {
            
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
                
            const res = await resilientFetch(pageUrl, {
                
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
