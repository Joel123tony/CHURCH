import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Song from "../server/models/Song.js";
import { extractSong } from "../server/services/songSources/worldTamilChristians.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../server/.env") });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const invalidSongs = await Song.find({
            source: "World Tamil Christians",
            $or: [
                { lyrics: /Comforter Beats/i },
                { lyrics: /New collections/i },
                { lyrics: /Judah Benhur Worship/i },
                { lyricsLength: { $lt: 200 } }
            ]
        });

        console.log(`Found ${invalidSongs.length} invalid WTC songs to re-scrape.`);

        for (const song of invalidSongs) {
            console.log(`Re-scraping: ${song.title} (${song.sourceUrl})`);
            try {
                const extracted = await extractSong(song.sourceUrl);
                if (extracted && extracted.length > 0) {
                    const newLyrics = extracted[0].lyricsTamil;
                    if (newLyrics && newLyrics.length > 200 && !newLyrics.toLowerCase().includes("comforter beats")) {
                        song.lyrics = newLyrics;
                        song.cleanLyrics = newLyrics;
                        song.lyricsLength = newLyrics.length;
                        song.aiStatus = "pending"; 
                        await song.save();
                        console.log(`✅ Re-scraped and updated: ${song.title}`);
                    } else {
                        console.log(`⚠️ New lyrics also look bad for ${song.title}`);
                    }
                }
            } catch (err) {
                console.error(`❌ Failed to re-scrape ${song.title}: ${err.message}`);
            }
            // Sleep to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log("Done.");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

run();
