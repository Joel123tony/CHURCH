import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
import { extractLyricsFromHtml } from "../utils/lyricsExtractor.js";
import Song from "../models/Song.js";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BATCH_SIZE = 20;

async function run() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        // Find songs where title is empty, or matching our invalid list
        const query = {
            $or: [
                { title: null },
                { title: "" },
                { title: { $regex: /^(unknown title|untitled|no title|home|lyrics|tamil christian songs|wordpress)$/i } },
                { titleTamil: null },
                { titleTamil: "" },
                { titleTamil: { $regex: /^(unknown title|untitled|no title|home|lyrics|tamil christian songs|wordpress)$/i } },
            ]
        };

        const badSongs = await Song.find(query);
        console.log(`Found ${badSongs.length} songs with invalid titles.`);

        let fixed = 0;
        let failed = 0;

        for (let i = 0; i < badSongs.length; i += BATCH_SIZE) {
            const batch = badSongs.slice(i, i + BATCH_SIZE);
            console.log(`Processing batch ${i/BATCH_SIZE + 1}/${Math.ceil(badSongs.length/BATCH_SIZE)}`);
            
            await Promise.all(batch.map(async (song) => {
                try {
                    if (!song.sourceUrl && !song.url) throw new Error("No sourceUrl available to re-fetch.");
                    
                    const response = await axios.get(song.sourceUrl || song.url, { timeout: 15000 });
                    const extracted = await extractLyricsFromHtml(response.data, song.sourceUrl || song.url);
                    
                    // We successfully extracted a new title!
                    song.title = extracted.titleTamil || extracted.titleEnglish;
                    song.titleTamil = extracted.titleTamil;
                    song.titleEnglish = extracted.titleEnglish;
                    song.status = "completed"; // Restore if it was quarantined
                    
                    await song.save();
                    fixed++;
                    console.log(`✅ Fixed: ${song.sourceUrl || song.url} -> ${song.title}`);
                } catch (err) {
                    // Failed to extract valid title
                    song.status = "failed";
                    song.failReason = "Invalid Title: " + (err.message || "Could not recover");
                    await song.save();
                    failed++;
                    console.log(`❌ Failed: ${song.sourceUrl || song.url} -> ${err.message}`);
                }
            }));
        }

        console.log(`\nMigration Complete!`);
        console.log(`Fixed: ${fixed}`);
        console.log(`Quarantined/Failed: ${failed}`);

    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}

run();
