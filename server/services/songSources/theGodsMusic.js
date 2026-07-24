import { resilientFetch } from "../../utils/resilientFetch.js";
import * as cheerio from "cheerio";
import { extractSongsFromHtml } from "../../utils/lyricsExtractor.js";
import { calculateSimilarity } from "../../utils/searchNormalizer.js";

export const extractSong = async (songUrl) => {
    try {
        const res = await resilientFetch(songUrl, { timeout: 15000 });
        const extractedSongs = await extractSongsFromHtml(res.data, songUrl);
        
        if (!extractedSongs || extractedSongs.length === 0) {
            throw new Error("Page does not contain song lyrics", { cause: new Error("extractSongsFromHtml returned no songs") });
        }

        // TGM specific metadata overrides (lyricsExtractor.js usually catches this, but just in case)
        const $ = cheerio.load(res.data);
        const artist = $('.artist').first().text().trim() || "";
        const album = $('.album').first().text().trim() || "";

        return extractedSongs.map(extracted => ({ 
            ...extracted,
            artist: extracted.artist || artist, 
            album: extracted.album || album,
            source: "The God's Music",
            sourceUrl: songUrl
        }));
    } catch (err) {
        console.error("TheGodsMusic extractSong Error:", err.message);
        throw new Error(`TheGodsMusic Provider Error: ${err.message}`, { cause: err });
    }
}

export const discoverLatest = async () => {
    try {
        const indexRes = await resilientFetch("https://thegodsmusic.com/", { timeout: 15000 });
        const $ = cheerio.load(indexRes.data);
        const childUrls = new Set();
        
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('thegodsmusic.com/lyrics/') && href !== 'https://thegodsmusic.com/lyrics/') {
                childUrls.add(href);
            }
        });
        
        return Array.from(childUrls);
    } catch (error) {
        console.error("TheGodsMusic discoverLatest Error:", error.message);
        return [];
    }
};

export const discoverAll = async (progressCallback) => {
    try {
        const urls = await discoverLatest();
        if (progressCallback) progressCallback(urls);
        return urls;
    } catch (err) {
        console.error("TheGodsMusic discoverAll Error:", err.message);
        return [];
    }
};

export const searchSong = async (query) => {
    try {
        const searchUrl = `https://thegodsmusic.com/?s=${encodeURIComponent(query)}`;
        const searchRes = await resilientFetch(searchUrl, { timeout: 15000 });
        
        const $ = cheerio.load(searchRes.data);
        let bestUrl = null;
        let bestScore = 0;
        
        $('article a, .entry-title a, h2 a, h3 a').each((i, el) => {
            const href = $(el).attr('href');
            const title = $(el).text().trim();
            // We only want actual song pages
            if (
                href && 
                href.includes('thegodsmusic.com/lyrics/')
            ) {
                const score = calculateSimilarity(query, title);
                if (score > bestScore && score >= 0.90) {
                    bestScore = score;
                    bestUrl = href;
                }
            }
        });
        
        console.log("TheGodsMusic bestUrl:", bestUrl);

        if (bestUrl) {
            const songs = await extractSong(bestUrl);
            return songs.length > 0 ? songs[0] : null;
        }
        
        return null;
    } catch (error) {
        console.error("TheGodsMusic searchSong Error:", error.message);
        return null;
    }
};
