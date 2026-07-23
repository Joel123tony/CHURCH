import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "server", ".env") });

import { connectDB } from "./server/config/db.js";
import { searchSongs } from "./server/services/songService.js";

async function testSearch() {
  await connectDB();
  console.log("Testing searchSongs('Enna Senjom')...");
  try {
    const results = await searchSongs("Enna Senjom", [], "latest", 1, 10);
    console.log("Total Songs returned:", results.totalSongs);
    console.log("Titles returned:");
    results.songs.forEach(s => console.log(" -", s.title));
  } catch(e) {
    console.error("FULL ERROR:", e.stack);
  }
  process.exit(0);
}
testSearch();
