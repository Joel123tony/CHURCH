import axios from "axios";
import * as cheerio from "cheerio";
import { extractLyricsFromHtml } from "../../utils/lyricsExtractor.js";

export const fetchSong = async (songUrl) => {
    try {
        const res = await axios.get(songUrl, { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, 
            timeout: 15000 
        });
        
        const extracted = extractLyricsFromHtml(res.data, songUrl);
        
        if (!extracted) {
            throw new Error("Page does not contain song lyrics");
        }

        return { 
            titleTamil: extracted.titleTamil, 
            titleEnglish: extracted.titleEnglish, 
            lyricsTamil: extracted.lyricsTamil, 
            lyricsEnglish: extracted.lyricsEnglish,
            artist: "", // TCW doesn't typically list artists structurally
            album: "",
            source: "TamilChristianWorship",
            sourceUrl: songUrl
        };
    } catch (err) {
        console.error("TCW fetchSong Error:", err.message);
        throw new Error(`TCW Provider Error: ${err.message}`);
    }
}

export const discoverLatest = async () => {
    try {
        const url = "http://tamilchristianworship.com/newpraiselinks.html";
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
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
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
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
        const indexRes = await axios.get("http://tamilchristianworship.com/newpraiselinks.html", {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 15000
        });
        
        const $ = cheerio.load(indexRes.data);
        let bestUrl = null;
        
        const lowerQuery = query.toLowerCase();
        
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().toLowerCase();
            
            if (href && href.endsWith('.html') && text.includes(lowerQuery) && !bestUrl) {
                bestUrl = href.startsWith('http') ? href : `http://tamilchristianworship.com/${href}`;
            }
        });
        
        if (bestUrl) {
            return await fetchSong(bestUrl);
        }
        
        return null;
    } catch (error) {
        console.error("TCW searchSong Error:", error.message);
        return null;
    }
};
