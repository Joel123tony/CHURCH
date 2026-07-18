import axios from "axios";
import * as cheerio from "cheerio";
import { extractLyricsFromHtml } from "../../utils/lyricsExtractor.js";

export const fetchSong = async (songUrl) => {
    try {
        const songRes = await axios.get(songUrl, { timeout: 15000 });
        const extracted = extractLyricsFromHtml(songRes.data, songUrl);
        
        if (!extracted) return null;

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
        return null;
    }
};

export const searchSong = async (query) => {
    try {
        const searchUrl = `https://tamilchristiansongs.in/tamil/?s=${encodeURIComponent(query)}`;
        const searchRes = await axios.get(searchUrl, {
            timeout: 10000,
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        
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
        const indexRes = await axios.get("https://tamilchristiansongs.in/tamil/", {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
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
