import mongoose from "mongoose";
import dotenv from "dotenv";
import { searchSongs } from "../services/songService.js";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function regressionTest() {
  const songsToSearch = [
    "Aarathanai", "Nandri", "Pudhiya Naal Idhu", "Ennai Kaakkum",
    "Ummai Allamal", "Thuthiyin Aadaigal", "Neer Mathram", "Uyire",
    "Oru Varthai", "Kaarunya", "Neerae", "Kirubai", "Sthothiram",
    "Ummai Nambuvean", "Nee Vendum", "Unnatha Pattu", "Kaakkum Karangal",
    "Yen Aathuma", "Karthar", "Thedi Vantha"
  ];

  console.log(`Starting regression test for ${songsToSearch.length} songs concurrently...`);

  // Fire all searches concurrently
  const promises = songsToSearch.map(async (query) => {
    try {
      const res = await fetch(`http://localhost:5000/api/songs/search?q=${encodeURIComponent(query)}`);
      const result = await res.json();
      return { query, status: result.status, songsCount: result.songs?.length || 0 };
    } catch (e) {
      return { query, error: e.message };
    }
  });

  const results = await Promise.all(promises);

  console.log("\n--- REGRESSION RESULTS ---");
  for (const r of results) {
    if (r.error) {
      console.log(`[FAILED] ${r.query}: ${r.error}`);
    } else {
      console.log(`[OK] ${r.query}: ${r.status}, found ${r.songsCount}`);
    }
  }
}

regressionTest().catch(console.error);
