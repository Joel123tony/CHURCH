import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Setup environment
const envPath = fs.existsSync(path.join(process.cwd(), ".env"))
  ? path.join(process.cwd(), ".env")
  : path.join(process.cwd(), "..", ".env");
dotenv.config({ path: envPath });

import { connectDB } from '../config/db.js';
import Song from '../models/Song.js';
import { extractLyricsFromHtml } from '../utils/lyricsExtractor.js';

const SOURCE_NAME = "World Tamil Christians";
const IS_TEST_MODE = process.argv.includes('--test');
const IS_DRY_RUN = process.argv.includes('--dry-run');
let testLimitIndex = process.argv.indexOf('--test');
const TEST_LIMIT = testLimitIndex > -1 && process.argv[testLimitIndex+1] ? parseInt(process.argv[testLimitIndex+1], 10) : 20;

const containsTamil = (text) => /[\u0B80-\u0BFF]/.test(text);
const normalizeString = (str) => str.toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, "").trim();
const cleanTitle = (rawTitle) => {
    let title = rawTitle.replace(/[a-zA-Z]/g, '')
                        .replace(/[^\u0B80-\u0BFF0-9\s]/g, ' ')
                        .replace(/\s+/g, ' ').trim();
    return title || rawTitle; 
};

const delay = () => new Promise(res => setTimeout(res, Math.floor(Math.random() * (4000 - 1500 + 1) + 1500)));

async function fetchSongLyrics(songUrl, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const res = await axios.get(songUrl, { timeout: 15000 });
            return extractLyricsFromHtml(res.data, songUrl);
        } catch (err) {
            if (attempt === retries) return null;
            await delay();
        }
    }
}

async function discoverLatestSongs() {
    console.log("Starting Advanced Song Discovery...");
    if (IS_TEST_MODE) console.log(`*** TEST MODE ENABLED (Max ${TEST_LIMIT} songs) ***`);
    if (IS_DRY_RUN) console.log(`*** DRY RUN ENABLED ***`);

    if (!IS_TEST_MODE) {
        await connectDB();
        console.log("Database connected.");
    }
    
    let discoveredUrls = new Map();

    // 1. Deep Sitemap Index Parsing
    console.log("Parsing sitemaps...");
    try {
        const rootSitemapRes = await axios.get('https://www.worldtamilchristians.com/sitemap.xml', { timeout: 30000 });
        const $root = cheerio.load(rootSitemapRes.data, { xmlMode: true });
        
        let subSitemaps = [];
        $root('sitemap loc').each((i, el) => {
            const loc = $root(el).text();
            if (loc.includes('post-sitemap')) {
                subSitemaps.push(loc);
            }
        });
        
        if (subSitemaps.length === 0) {
            // Fallback if it's not an index
            subSitemaps.push('https://www.worldtamilchristians.com/post-sitemap.xml');
        }
        
        console.log(`Found ${subSitemaps.length} post sitemaps. Crawling...`);
        
        for (const sitemapUrl of subSitemaps) {
            try {
                const sitemapRes = await axios.get(sitemapUrl, { timeout: 30000 });
                const $s = cheerio.load(sitemapRes.data, { xmlMode: true });
                
                $s('url').each((i, el) => {
                    const loc = $s(el).find('loc').text();
                    const lastmod = $s(el).find('lastmod').text();
                    
                    if (loc && lastmod) {
                        discoveredUrls.set(loc, new Date(lastmod));
                    }
                });
            } catch (err) {
                console.error(`Failed to parse ${sitemapUrl}:`, err.message);
            }
        }
        console.log(`Discovered ${discoveredUrls.size} URLs from all post sitemaps.`);
    } catch (err) {
        console.error("Failed to parse root sitemap:", err.message);
    }
    
    // 2. Search Website Pages (Search Discovery)
    console.log("Running search discovery...");
    const searchQueries = ["Lyrics", "Tamil Christian Song", "Worship", "2025", "2026"];
    
    for (const q of searchQueries) {
        try {
            console.log(`Searching for: ${q}`);
            const searchRes = await axios.get(`https://www.worldtamilchristians.com/?s=${encodeURIComponent(q)}`, { timeout: 30000 });
            const $q = cheerio.load(searchRes.data);
            
            $q('article').each((i, el) => {
                const loc = $q(el).find('.entry-title a').attr('href');
                const dateText = $q(el).find('.posted-on time.updated').attr('datetime') || $q(el).find('.posted-on time.entry-date').attr('datetime');
                
                if (loc) {
                    const date = dateText ? new Date(dateText) : new Date();
                    // Keep the most recent date if duplicate
                    if (!discoveredUrls.has(loc) || discoveredUrls.get(loc) < date) {
                        discoveredUrls.set(loc, date);
                    }
                }
            });
            await delay();
        } catch (err) {
            console.error(`Search failed for ${q}:`, err.message);
        }
    }
    
    // 3. Sort and prioritize
    console.log(`Total unique URLs discovered: ${discoveredUrls.size}`);
    
    let sortedUrls = Array.from(discoveredUrls.entries())
        .filter(([url, date]) => !url.includes('/category/') && !url.includes('/tag/') && !url.includes('/author/'))
        .sort((a, b) => a[1] - b[1]); // Ascending by date (Old -> New)
        
    console.log("Sorted chronologically (Old → New).");

    let duplicateCount = 0;
    let newCount = 0;

    if (IS_DRY_RUN) {
        console.log("\n--- PRE-FLIGHT DRY RUN METRICS ---");
        await connectDB();
        
        console.log(`Total URLs found: ${discoveredUrls.size}`);
        console.log(`Song pages (filtered): ${sortedUrls.length}`);
        
        for (const [url, pubDate] of sortedUrls) {
            const existing = await Song.findOne({ url });
            if (existing) {
                duplicateCount++;
            } else {
                newCount++;
            }
        }
        
        console.log(`Duplicate songs: ${duplicateCount}`);
        console.log(`New songs to import: ${newCount}`);
        console.log(`Failed pages: (Will be logged during actual run)`);
        console.log("----------------------------------\n");
        process.exit(0);
    }

    // Process URLs
    let newSongsAdded = 0;
    let failedPages = 0;
    
    for (const [url, pubDate] of sortedUrls) {
        if (IS_TEST_MODE && newSongsAdded >= TEST_LIMIT) {
            console.log(`\n--- REACHED TEST LIMIT ---`);
            break;
        }
        
        try {
            if (!IS_TEST_MODE) {
                // Check database first to avoid scraping what we already have
                const existing = await Song.findOne({ url });
                if (existing) continue; // Skip quickly without scraping
            }
            
            const data = await fetchSongLyrics(url);
            
            if (!data || !data.lyrics) {
                failedPages++;
                continue;
            }
            
            if (IS_TEST_MODE) {
                console.log(`1. Song name: ${data.titleTamil} ${data.titleEnglish ? `(${data.titleEnglish})` : ""}`);
                console.log(`2. Tamil lyrics first 5 lines:\n${data.lyricsTamil.split('\n').slice(0,5).join('\n')}`);
                console.log(`3. English lyrics first 5 lines:\n${data.lyricsEnglish ? data.lyricsEnglish.split('\n').slice(0,5).join('\n') : "N/A"}`);
                console.log("-----------------------------------------");
                newSongsAdded++;
            } else {
                const existingByTitle = await Song.findOne({ 
                   $or: [
                       { titleTamil: { $regex: new RegExp(`^${data.titleTamil}$`, 'i') } },
                       { title: { $regex: new RegExp(`^${data.title}$`, 'i') } }
                   ]
                });
                
                if (existingByTitle) {
                    duplicateCount++;
                    continue;
                }
                
                const newSong = new Song({
                    title: data.title,
                    titleTamil: data.titleTamil,
                    titleEnglish: data.titleEnglish,
                    lyrics: data.lyrics,
                    lyricsTamil: data.lyricsTamil,
                    lyricsEnglish: data.lyricsEnglish,
                    language: "Tamil",
                    category: "Tamil Christian Songs",
                    source: SOURCE_NAME,
                    url: url,
                    sourceUrl: url,
                    scrapeStatus: "success",
                    lyricsLength: data.lyricsTamil.length,
                    importedAt: new Date(),
                    publishedDate: pubDate
                });
                
                await newSong.save();
                console.log(`SUCCESS: Added "${data.title}" (Published: ${pubDate.toISOString().split('T')[0]})`);
                newSongsAdded++;
            }
            
            await delay();
        } catch (err) {
            failedPages++;
            console.error(`Error processing ${url}:`, err.message);
        }
    }
    
    console.log(`\nScraping complete! Added/Processed ${newSongsAdded} songs. Failed pages: ${failedPages}`);
    process.exit(0);
}

discoverLatestSongs();
