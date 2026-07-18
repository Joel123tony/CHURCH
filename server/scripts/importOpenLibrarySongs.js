import axios from 'axios';
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

const IS_TEST_MODE = process.argv.includes('--test');
const TEST_LIMIT = process.argv.includes('--test') ? parseInt(process.argv[process.argv.indexOf('--test') + 1] || "10") : 10;
const SEARCH_API_URL = 'https://openlibrary.org/search.json?q=tamil+christian+hymn';

// Helper to normalize strings for deduplication
const normalizeString = (str) => {
    return str.toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, "").trim();
};

const delay = (ms = 1000) => new Promise(res => setTimeout(res, ms));

async function importOpenLibrarySongs() {
    console.log("Starting Open Library Importer...");
    if (IS_TEST_MODE) console.log(`*** TEST MODE ENABLED (Max ${TEST_LIMIT} songs) ***`);

    if (!IS_TEST_MODE) {
        await connectDB();
    }

    try {
        console.log(`Fetching from Open Library: ${SEARCH_API_URL}`);
        const response = await axios.get(SEARCH_API_URL, { timeout: 20000 });
        const books = response.data.docs || [];

        console.log(`Found ${books.length} total results on Open Library.`);

        let importedCount = 0;

        for (const book of books) {
            if (IS_TEST_MODE && importedCount >= TEST_LIMIT) {
                console.log(`\n--- REACHED TEST LIMIT ---`);
                break;
            }

            // Public Domain Check
            // Open Library has public_scan_b flag, or we check if published before 1928
            const isPublicScan = book.public_scan_b === true;
            const isOldEnough = book.first_publish_year && book.first_publish_year <= 1928;

            if (!isPublicScan && !isOldEnough) {
                console.log(`Skipping "${book.title}": Not verified as public domain or public scan.`);
                continue;
            }

            const title = book.title;
            const author = (book.author_name && book.author_name.length > 0) ? book.author_name.join(", ") : "Unknown Author";
            const sourceUrl = `https://openlibrary.org${book.key}`;

            // Full text content is extremely rare directly in the API for non-English books.
            // We set a default message if has_fulltext is false. If it had full text, 
            // one would have to fetch the archive.org txt stream (which requires OCR parsing).
            // For now, we only extract available metadata as lyrics.
            let lyrics = "Lyrics not available for this book. Check the source URL for physical availability or digitized scans.";

            // Deduplication matching
            const normTitle = normalizeString(title);

            console.log(`\nProcessing: ${title} by ${author}`);

            if (IS_TEST_MODE) {
                console.log(`========================================`);
                console.log(`TITLE: ${title}`);
                console.log(`AUTHOR: ${author}`);
                console.log(`URL: ${sourceUrl}`);
                console.log(`LYRICS: ${lyrics}`);
                console.log(`========================================`);
                importedCount++;
            } else {
                // Check if already in DB
                const existingByUrl = await Song.findOne({ url: sourceUrl });
                if (existingByUrl) {
                    console.log(`Skipping (already exists by URL)`);
                    continue;
                }

                const allSongs = await Song.find({});
                const existingByTitle = allSongs.find(s => normalizeString(s.title) === normTitle);
                if (existingByTitle) {
                    console.log(`Skipping (already exists by title matching)`);
                    continue;
                }

                try {
                    const newSong = new Song({
                        title: title,
                        lyrics: lyrics,
                        language: "Tamil",
                        category: "Hymns",
                        source: "Open Library",
                        url: sourceUrl,
                        sourceUrl: sourceUrl,
                        author: author,
                        scrapeStatus: "success",
                        lyricsLength: lyrics.length,
                        importedAt: new Date()
                    });

                    await newSong.save();
                    console.log(`SUCCESS: Inserted "${title}"`);
                    importedCount++;
                } catch (dbErr) {
                    console.error(`DB Error inserting ${title}:`, dbErr.message);
                }
            }

            await delay(1000);
        }

        console.log(`\nImport complete! Processed ${importedCount} public domain books.`);
        process.exit(0);

    } catch (err) {
        console.error("Failed to fetch from Open Library API:", err.message);
        process.exit(1);
    }
}

importOpenLibrarySongs();