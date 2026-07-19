import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Song from "../models/Song.js";
import { extractLyricsFromHtml } from "../utils/lyricsExtractor.js";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function recleanDatabase() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected successfully.");

        // Find all songs that have lyrics and a source URL
        const songsToClean = await Song.find({ 
            lyrics: { $exists: true, $ne: "" },
            $or: [
                { sourceUrl: { $exists: true, $ne: "" } },
                { url: { $exists: true, $ne: "" } }
            ]
        });

        console.log(`Found ${songsToClean.length} songs to re-clean.`);

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < songsToClean.length; i++) {
            const song = songsToClean[i];
            const songUrl = song.sourceUrl || song.url;
            console.log(`\n[${i + 1}/${songsToClean.length}] Processing: ${song.title} (${songUrl})`);

            try {
                // Fetch fresh HTML
                const res = await axios.get(songUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                    timeout: 15000
                });

                // Run strict extraction
                const extractedArray = await extractLyricsFromHtml(res.data, songUrl);

                if (extractedArray && extractedArray.length > 0) {
                    // Update current song with the first result
                    const firstExtracted = extractedArray[0];
                    song.lyrics = firstExtracted.lyricsTamil || firstExtracted.lyrics;
                    song.lyricsTamil = firstExtracted.lyricsTamil || firstExtracted.lyrics;
                    song.title = firstExtracted.titleTamil || song.title;
                    song.titleTamil = firstExtracted.titleTamil || song.titleTamil;
                    
                    // Note: If extractedArray length > 1, the script COULD insert new songs,
                    // but for a strict re-clean of existing records, we just patch the current one.
                    // (To avoid massive database structural changes during a simple clean).
                    
                    await song.save();
                    console.log(`✅ Success: Updated lyrics for ${song.title}`);
                    successCount++;
                } else {
                    throw new Error("Extractor returned empty array.");
                }

            } catch (err) {
                console.error(`❌ Failed: AI rejected or error fetching - ${err.message}`);
                // Move to quarantine and delete original polluted lyrics
                song.status = "failed";
                song.failReason = "Re-clean Migration Failed: " + err.message;
                song.lyrics = "";
                song.lyricsTamil = "";
                song.lyricsEnglish = "";
                await song.save();
                failCount++;
            }
            
            // Wait 2 seconds between requests to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`\nMigration Complete!`);
        console.log(`Successfully cleaned: ${successCount}`);
        console.log(`Quarantined/Failed: ${failCount}`);
        process.exit(0);
    } catch (err) {
        console.error("Migration fatal error:", err);
        process.exit(1);
    }
}

recleanDatabase();
