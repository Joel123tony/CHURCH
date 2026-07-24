import mongoose from "mongoose";
import dotenv from "dotenv";
import { searchSongs } from "../services/songService.js";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const POPULAR_SONGS = [
  "Enna Senjom",
  "Ummai Aarathippen",
  "Thuthiyin Aadaigal",
  "Pudhiya Naal Idhu",
  "Aaradhanai Nayagan",
  "Nandri Bali"
];

async function preloadSongs() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected successfully.");

  for (const songTitle of POPULAR_SONGS) {
    console.log(`\nChecking popular song: "${songTitle}"...`);
    
    // searchSongs will trigger background import if it doesn't exist
    const result = await searchSongs(songTitle, []);
    
    if (result.status === "searching_online") {
      console.log(`[!] Not found locally. Triggered background import for: "${songTitle}"`);
      // Wait a bit before hitting the next one to avoid hammering providers simultaneously
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else if (result.songs && result.songs.length > 0) {
      console.log(`[+] Found locally: ${result.songs[0].title}`);
    } else {
      console.log(`[-] Could not find or trigger import for: "${songTitle}"`);
    }
  }

  console.log("\nPreload complete. Closing connection.");
  await mongoose.disconnect();
}

preloadSongs().catch(err => {
  console.error("Error preloading songs:", err);
  process.exit(1);
});
