import axios from "axios";
import * as cheerio from "cheerio";
import { extractSongsFromHtml } from "../../utils/lyricsExtractor.js";
export const isCollectionPage = (url) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.includes('/category/') || lower.includes('/tag/') || lower.includes('/page/') || lower.includes('lyrics-page');
};

export const isSongPage = (url) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return !isCollectionPage(url) && !lower.includes('?s=');
};

export const extractCollection = async (url) => {
    try {
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
        const $ = cheerio.load(res.data);
        const childUrls = new Set();
        
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('tamilchristian.com') && !href.includes('/category/') && !href.includes('/tag/') && !href.includes('lyrics-page') && href.split('/').length > 4) {
                childUrls.add(href);
            }
        });
        
        return Array.from(childUrls);
    } catch (err) {
        console.error("TamilChristianCom extractCollection Error:", err.message);
        return [];
    }
};

export const extractSong = async (songUrl) => {
    try {
        const res = await axios.get(songUrl, { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, 
            timeout: 15000 
        });
        
        const extractedSongs = await extractSongsFromHtml(res.data, songUrl);
        
        if (!extractedSongs || extractedSongs.length === 0) {
            throw new Error("Page does not contain song lyrics");
        }

        return extractedSongs.map(extracted => ({ 
            titleTamil: extracted.titleTamil, 
            titleEnglish: extracted.titleEnglish, 
            lyricsTamil: extracted.lyricsTamil, 
            lyricsEnglish: extracted.lyricsEnglish,
            artist: "", 
            album: "",
            source: "TamilChristian.com",
            sourceUrl: songUrl
        }));
    } catch (err) {
        console.error("TamilChristianCom extractSong Error:", err.message);
        throw new Error(`TamilChristianCom Provider Error: ${err.message}`);
    }
}

export const discoverLatest = async () => {
    try {
        // Fetch the main lyrics index
        const indexRes = await axios.get("https://www.tamilchristian.com/lyrics-page/", {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 15000
        });
        
        const $ = cheerio.load(indexRes.data);
        const subcategories = [];
        
        // Find subcategory links
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('tamilchristian.com/lyrics-page/') && href !== 'https://www.tamilchristian.com/lyrics-page/') {
                subcategories.push(href);
            }
        });
        
        const uniqueSubcategories = [...new Set(subcategories)];
        let allSongUrls = [];

        // Crawl each subcategory for actual song links
        // To prevent timeout or memory issues, we limit concurrency or do it sequentially
        for (const subCat of uniqueSubcategories) {
            try {
                const subRes = await axios.get(subCat, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                    timeout: 10000
                });
                const $sub = cheerio.load(subRes.data);
                
                $sub('a').each((i, el) => {
                    const href = $(el).attr('href');
                    // Look for valid potential song links in this site's typical structure
                    // Ignoring category lists, authors, tags, etc.
                    if (
                        href && 
                        href.includes('tamilchristian.com') && 
                        !href.includes('/category/') && 
                        !href.includes('/tag/') && 
                        !href.includes('lyrics-page') && 
                        href.split('/').length > 4
                    ) {
                        allSongUrls.push(href);
                    }
                });
            } catch (err) {
                console.error(`Failed to crawl subcategory ${subCat}:`, err.message);
                // Continue with other subcategories
            }
        }
        
        return [...new Set(allSongUrls)];
    } catch (error) {
        console.error("TamilChristianCom discoverLatest Error:", error.message);
        return [];
    }
};

export const discoverAll = async (progressCallback) => {
    try {
        const urls = await discoverLatest();
        if (progressCallback) progressCallback(urls);
        return urls;
    } catch (err) {
        console.error("TamilChristianCom discoverAll Error:", err.message);
        return [];
    }
};

export const searchSong = async (query) => {
    try {
        // We will simulate search by fetching a Google Custom Search or crawling index.
        // Since we don't have a Google API key handy, we will do a basic scrape of the site's default search.
        const searchUrl = `https://www.tamilchristian.com/?s=${encodeURIComponent(query)}`;
        const searchRes = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 15000
        });
        
        const $ = cheerio.load(searchRes.data);
        let bestUrl = null;
        
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            // Assuming search results point to regular pages without /category/
            if (href && href.includes('tamilchristian.com') && !href.includes('/category/') && href.split('/').length > 4 && !bestUrl) {
                // Avoid picking up random UI elements by checking if it's inside an article or content block
                // (Very broad fallback check)
                bestUrl = href;
            }
        });
        
        if (bestUrl) {
            const songs = await extractSong(bestUrl);
            return songs.length > 0 ? songs[0] : null;
        }
        
        return null;
    } catch (error) {
        console.error("TamilChristianCom searchSong Error:", error.message);
        return null;
    }
};
