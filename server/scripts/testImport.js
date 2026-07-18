import mongoose from "mongoose";
import * as wtcProvider from "../services/songSources/worldTamilChristians.js";
import Song from "../models/Song.js";
import dotenv from "dotenv";

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const testUrl = "https://www.worldtamilchristians.com/ummai-pola-yaarum-ille-song-lyrics/";
    console.log(`\nTesting WTC URL: ${testUrl}`);
    
    try {
        const songData = await wtcProvider.fetchSong(testUrl);
        console.log(`Successfully parsed! Title: ${songData.titleTamil}`);
        
        // Save
        const existing = await Song.findOne({ url: songData.sourceUrl });
        if (existing) {
            console.log("Song already exists in DB, skipping save.");
        } else {
            await Song.create({
                title: songData.titleTamil || "Unknown",
                titleTamil: songData.titleTamil,
                lyrics: songData.lyricsTamil,
                category: "Tamil Christian Songs",
                source: songData.source,
                url: songData.sourceUrl,
                sourceUrl: songData.sourceUrl
            });
            console.log(`Successfully saved to MongoDB!`);
        }
    } catch (err) {
        console.error(`Error:`, err.message);
    }

    mongoose.disconnect();
    console.log("\nDone.");
}

run();
