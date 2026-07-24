import mongoose from "mongoose";
import dotenv from "dotenv";
import { searchSongs } from "../services/songService.js";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function testSearch() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.");

  const queries = ["Enna Senjom", "Sarvagnani"];

  for (const q of queries) {
    console.log(`\n--- Searching for: ${q} ---`);
    let result = await searchSongs(q, []);
    
    // Wait for the background worker to finish if searching_online
    if (result.status === "searching_online") {
      console.log("Searching online, waiting 5 seconds...");
      await new Promise(r => setTimeout(r, 5000));
      result = await searchSongs(q, []);
    }

    if (result.songs && result.songs.length > 0) {
      console.log(`Title: ${result.songs[0].titleTamil} / ${result.songs[0].titleEnglish}`);
      console.log("--- LYRICS ---");
      console.log(result.songs[0].cleanLyrics);
      console.log("--------------\n");
    } else {
      console.log("Not found.");
    }
  }

  await mongoose.disconnect();
}

testSearch().catch(console.error);
