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

const BASE_CATEGORY_URL = 'https://www.worldtamilchristians.com/category/tamil-christians-songs/';
const SOURCE_NAME = "World Tamil Christians";
const STATE_FILE = path.join(process.cwd(), 'scripts', 'last_scraped_page.json');
const IS_TEST_MODE = process.argv.includes('--test');
const TEST_LIMIT = process.argv.includes('--test') ? parseInt(process.argv[process.argv.indexOf('--test') + 1] || "5") : 5;

const containsTamil = (text) => /[\u0B80-\u0BFF]/.test(text);

const normalizeString = (str) => str.toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, "").trim();

const cleanTitle = (rawTitle) => {
    let title = rawTitle.replace(/[a-zA-Z]/g, '')
                        .replace(/[^\u0B80-\u0BFF0-9\s]/g, ' ')
                        .replace(/\s+/g, ' ').trim();
    return title || rawTitle; 
};

const delay = () => {
    const ms = Math.floor(Math.random() * (5000 - 2000 + 1) + 2000);
    return new Promise(res => setTimeout(res, ms));
};

const loadState = () => {
    if (fs.existsSync(STATE_FILE)) {
        try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')).page || 1; } catch (e) { return 1; }
    }
    return 1;
};

const saveState = (page) => {
    if (!IS_TEST_MODE) fs.writeFileSync(STATE_FILE, JSON.stringify({ page }), 'utf8');
};

async function fetchSongLyrics(songUrl, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const res = await axios.get(songUrl, { timeout: 15000 });
            const $ = cheerio.load(res.data);
            
            let rawTitle = $('h1').text().trim() || $('h1.entry-title').text().trim();
            const cleanedTitle = cleanTitle(rawTitle);
            
            const contentDiv = $('.post-inner');
            contentDiv.find('.sharedaddy, .yarpp-related, #comments, .nav-links, .menu, header, footer, .author-box, style, script, .breadcrumb').remove();

            // Preserve block boundaries with newlines
            let rawHtml = contentDiv.html() || "";
            rawHtml = rawHtml.replace(/<\/(p|div|h[1-6]|li)>/gi, '\n');
            rawHtml = rawHtml.replace(/<br\s*[\/]?>/gi, '\n');
            
            let rawText = cheerio.load(rawHtml).text();
            
            let lines = rawText.split('\n');
            let lyricsText = "";
            let started = false;
            
            const stopKeywords = [
                "lyrics in english", "english lyrics", "key takeaways", 
                "related", "you may also like", "estimated reading time", 
                "share", "tags"
            ];
            
            const skipLineKeywords = [
                "home » blog", "author", "category", "categories", "save", "faith score", "leave a reply", "song lyrics", "god medias"
            ];

            let finalLines = [];

            for (let line of lines) {
                let originalLine = line.trim();
                let lowerLine = originalLine.toLowerCase();
                
                // Skip unwanted UI lines entirely first
                if (skipLineKeywords.some(keyword => lowerLine.includes(keyword)) || lowerLine.includes('»')) {
                    continue;
                }

                // Stop extraction when markers appear at the bottom
                if (stopKeywords.some(keyword => lowerLine.includes(keyword))) {
                    if (finalLines.length > 5) {
                        break;
                    } else {
                        continue;
                    }
                }
                
                // 3. Apply cleaning: Remove all English A-Z a-z
                let cleanedLine = originalLine.replace(/[a-zA-Z]/g, '').trim().replace(/\s+/g, ' ');
                // Remove dangling punctuation at start/end
                cleanedLine = cleanedLine.replace(/^[\s,.\-()–|:»]+/, '').replace(/[\s,.\-()–|:»]+$/, '').trim();
                
                // If the line has Tamil, we can start extracting
                if (containsTamil(cleanedLine)) {
                    started = true;
                }
                
                if (started) {
                    if (containsTamil(cleanedLine) || /^[0-9]+$/.test(cleanedLine)) {
                        finalLines.push(cleanedLine);
                    } else if (cleanedLine === "" && finalLines.length > 0 && finalLines[finalLines.length-1] !== "") {
                        // Preserve empty line
                        finalLines.push("");
                    }
                }
            }
            
            // Remove duplicate title lines at the beginning
            let deduplicatedLines = [];
            let prevLine = null;
            let titleLikeCount = 0;
            
            for (const l of finalLines) {
                if (l && l === prevLine && titleLikeCount < 4) {
                    continue; 
                }
                deduplicatedLines.push(l);
                if (l) {
                    prevLine = l;
                    titleLikeCount++;
                }
            }
            
            lyricsText = deduplicatedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
            
            if (!lyricsText) return null;

            return { title: cleanedTitle, lyrics: lyricsText };
        } catch (err) {
            console.error(`[Attempt ${attempt}/${retries}] Error fetching lyrics from ${songUrl}: ${err.message}`);
            if (attempt === retries) return null;
            await delay();
        }
    }
}

async function scrapeSongs() {
    console.log("Starting scraper logic test...");
    if (IS_TEST_MODE) console.log(`*** TEST MODE ENABLED (Max ${TEST_LIMIT} songs) ***`);

    let page = loadState();
    let hasMorePages = true;
    let newSongsAdded = 0;
    
    if (!IS_TEST_MODE) {
        await connectDB();
        console.log("Database connected.");
    }
    
    while (hasMorePages) {
        const pageUrl = page === 1 ? BASE_CATEGORY_URL : `${BASE_CATEGORY_URL}page/${page}/`;
        console.log(`\nFetching page ${page}: ${pageUrl}`);
        
        try {
            const res = await axios.get(pageUrl, { timeout: 15000 });
            const $ = cheerio.load(res.data);
            
            const songLinks = [];
            $('h2.entry-title a, article a').each((i, el) => {
                const href = $(el).attr('href');
                if (href && !href.includes('/category/') && !songLinks.includes(href)) {
                    songLinks.push(href);
                }
            });
            
            if (songLinks.length === 0) {
                hasMorePages = false;
                break;
            }
            
            for (const url of songLinks) {
                if (IS_TEST_MODE && newSongsAdded >= TEST_LIMIT) {
                    console.log(`\n--- REACHED TEST LIMIT ---`);
                    process.exit(0);
                }

                console.log(`\nScraping: ${url}`);
                const data = await fetchSongLyrics(url);
                if (!data || !data.lyrics) {
                    console.log(`No valid Tamil lyrics found for ${url}, skipping.`);
                    continue;
                }
                
                if (IS_TEST_MODE) {
                    console.log(`========================================`);
                    console.log(`TITLE:\n${data.title}`);
                    console.log(`LYRICS PREVIEW:\n${data.lyrics.split('\n').slice(0, 10).join('\n')}`);
                    console.log(`========================================`);
                    newSongsAdded++;
                } else {
                     const existingByUrl = await Song.findOne({ url });
                     if (existingByUrl) continue;
                     
                     const normTitle = normalizeString(data.title);
                     const allSongs = await Song.find({});
                     const existingByTitle = allSongs.find(s => normalizeString(s.title) === normTitle);
                     if (existingByTitle) continue;
                     
                     try {
                        const newSong = new Song({
                            title: data.title,
                            lyrics: data.lyrics,
                            language: "Tamil",
                            category: "Tamil Christian Songs",
                            source: SOURCE_NAME,
                            url: url,
                            sourceUrl: url,
                            scrapeStatus: "success",
                            lyricsLength: data.lyrics.length,
                            importedAt: new Date()
                        });
                        await newSong.save();
                        console.log(`SUCCESS: Added "${data.title}"`);
                        newSongsAdded++;
                     } catch (dbErr) {
                        console.error(`DB Error: ${dbErr.message}`);
                     }
                }
                
                await delay();
            }
            
            if (!IS_TEST_MODE) saveState(page + 1);
            page++;
            await delay(); 
        } catch (err) {
            hasMorePages = false;
        }
    }
    
    console.log(`\nScraping complete! Added ${newSongsAdded} new songs.`);
    process.exit(0);
}

scrapeSongs();
