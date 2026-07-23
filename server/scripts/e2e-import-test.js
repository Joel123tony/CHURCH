import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Song from "../models/Song.js";
import JobQueue from "../models/JobQueue.js";

const SONGS_TO_IMPORT = [
    { sourceUrl: "https://www.tamilchristiansongs.in/neer-mathram-en-pothum-songs-lyrics-a-s-sanjith/" },
    { sourceUrl: "https://tamilchristianworship.com/songs/ummai-allamal-enakku-yar-undu/" },
    { sourceUrl: "https://thegodsmusic.com/songs/en-uyiranavare" },
    { sourceUrl: "https://www.worldtamilchristians.com/tamil-christian-songs/en-uyirana-yesuvae-song-lyrics-in-tamil/" },
    { sourceUrl: "https://christiankeerthanai.com/songs/arputhangal-seibavar" }
];

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
    console.log("=== STARTING E2E IMPORT PIPELINE VERIFICATION ===\n");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    for (const song of SONGS_TO_IMPORT) {
        console.log(`\n--- Queueing import for: ${song.sourceUrl} ---`);
        try {
            // Note: the easiest way to trigger the full pipeline without admin auth
            // is to search for the song using the URL or a specific title. 
            // Wait, our backend routes allow /api/songs/preview or /api/songs?search=URL
            const res = await axios.get("http://localhost:5000/api/songs?search=" + encodeURIComponent(song.sourceUrl), { timeout: 30000 });
            
            if (res.data.success && res.data.songs && res.data.songs.length > 0) {
                console.log(`[SUCCESS] Pipeline completed. Found: ${res.data.songs[0].title}`);
            } else {
                 console.log(`[FAILED] Pipeline did not return song.`);
            }
        } catch (err) {
            console.error(`[ERROR] Request failed: ${err.message}`);
        }
    }
    
    console.log("\nWaiting 10 seconds for any background AI/Merge workers to finish...");
    await sleep(10000);

    // Check DB
    console.log("\n=== VERIFYING MONGODB DOCUMENTS ===");
    for (const song of SONGS_TO_IMPORT) {
        const doc = await Song.findOne({ sourceUrl: song.sourceUrl });
        if (doc) {
            console.log(`[OK] Found in DB: ${doc.title}`);
            console.log(`     Status: ${doc.status} | Lyrics Status: ${doc.lyricsStatus}`);
            console.log(`     Sections: ${doc.sections ? doc.sections.length : 0}`);
            if (doc.lyricsStatus !== "found") {
                console.log(`     -> Warning: Lyrics are ${doc.lyricsStatus}`);
            }
        } else {
            console.log(`[FAILED] Not found in DB: ${song.sourceUrl}`);
            const job = await JobQueue.findOne({ "data.url": song.sourceUrl }).sort({ createdAt: -1 });
            if (job) {
                console.log(`     -> Found in JobQueue (Status: ${job.status}, Type: ${job.type})`);
                if (job.error) console.log(`     -> Error: ${job.error}`);
            }
        }
    }

    mongoose.disconnect();
    console.log("\n=== DONE ===");
}

runTest();
