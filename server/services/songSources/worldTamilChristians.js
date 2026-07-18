import axios from "axios";
import * as cheerio from "cheerio";
import { extractLyricsFromHtml } from "../../utils/lyricsExtractor.js";

export const fetchSong = async (songUrl) => {
    try {
        const res = await axios.get(songUrl, { timeout: 15000 });
        const extracted = extractLyricsFromHtml(res.data, songUrl);
        
        if (!extracted) return null;

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
        return null;
    }
}

export const searchSong = async (query) => {
    try {
        const searchRes = await axios.get(`https://www.worldtamilchristians.com/?s=${encodeURIComponent(query)}`, { timeout: 10000 });
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
