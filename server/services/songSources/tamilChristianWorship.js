import { resilientFetch } from "../../utils/resilientFetch.js";
import * as cheerio from "cheerio";
import { extractSongsFromHtml } from "../../utils/lyricsExtractor.js";
import { calculateSimilarity } from "../../utils/searchNormalizer.js";
export const isCollectionPage = (url) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    // TCW usually groups everything in newpraiselinks.html
    return lower.includes('newpraiselinks') || lower.includes('index');
};

export const isSongPage = (url) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.includes('.html') && !isCollectionPage(url) && !lower.includes('contact');
};

export const extractCollection = async (url) => {
    try {
        const res = await resilientFetch(url, {  timeout: 15000 });
        const $ = cheerio.load(res.data);
        
        const links = new Set();
        $('a').each((i, el) => {
            let h = $(el).attr('href');
            if (h && (h.includes('.html') || h.includes('.htm')) && !h.includes('newpraise') && !h.includes('index') && !h.includes('contact')) {
                if (!h.startsWith('http')) {
                    h = 'http://tamilchristianworship.com/' + h.replace(/^\//, '');
                }
                links.add(h);
            }
        });
        
        return Array.from(links);
    } catch (error) {
        console.error("TCW extractCollection Error:", error.message);
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
            throw new Error("Page does not contain song lyrics", { cause: new Error("extractSongsFromHtml returned no songs") });
        }

        return extractedSongs.map(extracted => ({ 
            titleTamil: extracted.titleTamil, 
            titleEnglish: extracted.titleEnglish, 
            lyricsTamil: extracted.lyricsTamil, 
            lyricsEnglish: extracted.lyricsEnglish,
            artist: "",
            album: "",
            source: "TamilChristianWorship",
            sourceUrl: songUrl
        }));
    } catch (err) {
        console.error("TCW extractSong Error:", err.message);
        throw new Error(`TCW Provider Error: ${err.message}`, { cause: err });
    }
}

export const discoverLatest = async () => {
    try {
        const url = "http://tamilchristianworship.com/newpraiselinks.html";
        const res = await resilientFetch(url, {  timeout: 15000 });
        const $ = cheerio.load(res.data);
        
        const links = [];
        $('a').each((i, el) => {
            let h = $(el).attr('href');
            if (h && (h.includes('.html') || h.includes('.htm')) && !h.includes('newpraise')) {
                if (!h.startsWith('http')) {
                    h = 'http://tamilchristianworship.com/' + h.replace(/^\//, '');
                }
                links.push(h);
            }
        });
        
        return [...new Set(links)].slice(0, 15);
    } catch (error) {
        console.error("TCW discoverLatest Error:", error.message);
        return [];
    }
};

export const discoverAll = async (progressCallback) => {
    try {
        const url = "http://tamilchristianworship.com/newpraiselinks.html";
        const res = await resilientFetch(url, {  timeout: 15000 });
        const $ = cheerio.load(res.data);
        
        const links = new Set();
        $('a').each((i, el) => {
            let h = $(el).attr('href');
            if (h && (h.includes('.html') || h.includes('.htm')) && !h.includes('newpraise') && !h.includes('index') && !h.includes('contact')) {
                if (!h.startsWith('http')) {
                    h = 'http://tamilchristianworship.com/' + h.replace(/^\//, '');
                }
                links.add(h);
            }
        });
        
        const allUrls = Array.from(links);
        if (progressCallback) progressCallback(allUrls);
        
        return allUrls;
    } catch (error) {
        console.error("TCW discoverAll Error:", error.message);
        return [];
    }
};

export const searchSong = async (query) => {
    try {
        // TCW does not have a robust built-in search via query params for this specific section,
        // so we will simulate search by scraping the index and matching the text of the links.
        const indexRes = await resilientFetch("http://tamilchristianworship.com/newpraiselinks.html", {
            
            timeout: 15000
        });
        
        const $ = cheerio.load(indexRes.data);
        let bestUrl = null;
        let bestScore = 0;
        
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            const title = $(el).text().trim();
            
            if (href && href.endsWith('.html')) {
                const score = calculateSimilarity(query, title);
                if (score > bestScore && score >= 0.85) {
                    bestScore = score;
                    bestUrl = href.startsWith('http') ? href : `http://tamilchristianworship.com/${href}`;
                }
            }
        });
        
        if (bestUrl) {
            const songs = await extractSong(bestUrl);
            return songs.length > 0 ? songs[0] : null;
        }
        
        return null;
    } catch (error) {
        console.error("TCW searchSong Error:", error.message);
        return null;
    }
};
