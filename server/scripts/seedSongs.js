import mongoose from "mongoose";
import dotenv from "dotenv";
import { searchTamilChristianSongs } from "../services/providers/tamilChristianSongs.js";
import { searchChristianKeerthanai } from "../services/providers/christianKeerthanai.js";
import { searchChristSquare } from "../services/providers/christSquare.js";
import Song from "../models/Song.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

if (!process.env.MONGO_URI) {
  console.error("FATAL: MONGO_URI is not defined.");
  process.exit(1);
}

const normalizeString = (str) => {
  return str.toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, "").trim();
};

const SEED_QUERIES = [
  "yesu", "karthar", "deva", "parisutha", "anbu", "kirubai",
  "aathuma", "stotiram", "rajave", "neer", "en", "nalla",
  "arputhar", "vallavar", "jebam", "magimai", "raththam", "siluvai",
  "worship", "keerthanai", "paamalai", "traditional"
];

async function seedDatabase() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  console.log(`Starting background seed with ${SEED_QUERIES.length} generic queries...`);

  let totalUpserted = 0;

  for (const query of SEED_QUERIES) {
    console.log(`\n--- Fetching songs for: "${query}" ---`);
    
    try {
      const results = await Promise.allSettled([
        searchTamilChristianSongs(query),
        searchChristianKeerthanai(query),
        searchChristSquare(query)
      ]);

      let allSongs = [];
      results.forEach(result => {
        if (result.status === "fulfilled" && result.value) {
          allSongs = [...allSongs, ...result.value];
        }
      });

      console.log(`Found ${allSongs.length} raw results for "${query}"`);

      // Deduplicate
      const uniqueSongsMap = new Map();
      allSongs.forEach(song => {
        const normTitle = normalizeString(song.title);
        if (!uniqueSongsMap.has(normTitle)) {
          uniqueSongsMap.set(normTitle, song);
        } else {
          const existing = uniqueSongsMap.get(normTitle);
          if (song.lyrics && !existing.lyrics) {
            uniqueSongsMap.set(normTitle, song);
          }
        }
      });

      const unifiedSongs = Array.from(uniqueSongsMap.values());
      console.log(`Saving ${unifiedSongs.length} unique songs for "${query}"...`);

      // Upsert
      let newCount = 0;
      for (const song of unifiedSongs) {
        const result = await Song.updateOne(
          { url: song.url },
          { $set: song },
          { upsert: true }
        );
        if (result.upsertedCount > 0) newCount++;
      }

      totalUpserted += newCount;
      console.log(`-> Added ${newCount} new songs to database.`);

      // Sleep to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (err) {
      console.error(`Error processing query "${query}":`, err);
    }
  }

  console.log("\n=================================");
  console.log(`Seeding Complete! Total newly added songs: ${totalUpserted}`);
  const finalCount = await Song.countDocuments();
  console.log(`Total songs in Database: ${finalCount}`);
  console.log("=================================\n");

  mongoose.connection.close();
}

seedDatabase().catch(console.error);
