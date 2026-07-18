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
import { discoverLatest, fetchSong } from '../services/songSources/tamilChristianCom.js';

const IS_TEST_MODE = process.argv.includes('--test');
const TEST_LIMIT = process.argv.includes('--test') ? parseInt(process.argv[process.argv.indexOf('--test') + 1] || "5") : 5;

// Helper to normalize strings for deduplication
const normalizeString = (str) => {
    if (!str) return "";
    return str.toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, "").trim();
};

const delay = (ms = 1000) => new Promise(res => setTimeout(res, ms));

async function importTamilChristianComSongs() {
    console.log("Starting TamilChristianCom Importer...");
    if (IS_TEST_MODE) console.log(`*** TEST MODE ENABLED (Max ${TEST_LIMIT} songs) ***`);

    await connectDB();

    try {
        console.log(`Discovering latest songs from lyrics-page...`);
        const urls = await discoverLatest();
        console.log(`Found ${urls.length} song links.`);
        
        let importedCount = 0;
        let skippedCount = 0;
        let duplicateCount = 0;
        let failedCount = 0;

        for (const url of urls) {
            if (IS_TEST_MODE && (importedCount + duplicateCount) >= TEST_LIMIT) {
                console.log(`\n--- REACHED TEST LIMIT ---`);
                break;
            }

            try {
                // Check duplicate by URL first to avoid fetching
                const existingByUrl = await Song.findOne({ url: url }).lean();
                if (existingByUrl) {
                    console.log(`[Duplicate] ${url} already in DB.`);
                    duplicateCount++;
                    continue;
                }

                const songData = await fetchSong(url);
                
                if (!songData) {
                    console.log(`[Skipped] ${url} - No data extracted.`);
                    skippedCount++;
                    continue;
                }

                // Check duplicate by Title
                const normTitle = normalizeString(songData.titleTamil);
                const existingByTitle = await Song.findOne({ 
                    $or: [
                        { title: songData.titleTamil },
                        { titleTamil: songData.titleTamil }
                    ]
                }).lean();
                
                if (existingByTitle && normalizeString(existingByTitle.titleTamil) === normTitle) {
                    console.log(`[Duplicate] ${songData.titleTamil} already exists by title.`);
                    duplicateCount++;
                    continue;
                }
                
                const newSong = new Song({
                    title: songData.titleTamil || songData.titleEnglish || "Unknown",
                    titleTamil: songData.titleTamil,
                    titleEnglish: songData.titleEnglish,
                    lyrics: songData.lyricsTamil,
                    lyricsTamil: songData.lyricsTamil,
                    lyricsEnglish: songData.lyricsEnglish,
                    language: "Tamil",
                    category: "Tamil Christian Songs",
                    source: songData.source,
                    url: songData.sourceUrl,
                    sourceUrl: songData.sourceUrl,
                    artist: songData.artist,
                    scrapeStatus: "success",
                    lyricsLength: songData.lyricsTamil ? songData.lyricsTamil.length : 0,
                    importedAt: new Date()
                });
                
                await newSong.save();
                console.log(`[Imported] ${songData.titleTamil}`);
                importedCount++;
                
            } catch (err) {
                console.log(`[Failed] ${url} - ${err.message}`);
                failedCount++;
            }
            
            await delay(1000); // polite delay
        }
        
        console.log(`\nImport complete!`);
        console.log(`Imported: ${importedCount}`);
        console.log(`Duplicates: ${duplicateCount}`);
        console.log(`Skipped: ${skippedCount}`);
        console.log(`Failed: ${failedCount}`);
        
        process.exit(0);

    } catch (err) {
        console.error("Failed to run importer:", err.message);
        process.exit(1);
    }
}

importTamilChristianComSongs();
