import mongoose from "mongoose";
import dotenv from "dotenv";
import Song from "../models/Song.js";
import SongSearchCache from "../models/SongSearchCache.js";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function clean() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.");

  const queries = [
    { title: /Enna Senjom/i },
    { titleTamil: /Enna Senjom/i },
    { titleEnglish: /Enna Senjom/i },
    { title: /Sarvagnani/i },
    { titleTamil: /Sarvagnani/i },
    { titleEnglish: /Sarvagnani/i },
    { title: /Timothy Sharan/i },
    { titleTamil: /Timothy Sharan/i },
    { titleEnglish: /Timothy Sharan/i }
  ];

  for (const q of queries) {
    const res = await Song.deleteMany(q);
    if (res.deletedCount > 0) {
      console.log(`Deleted ${res.deletedCount} for query:`, q);
    }
  }

  const cacheRes = await SongSearchCache.deleteMany({});
  console.log(`Deleted ${cacheRes.deletedCount} cache entries.`);

  await mongoose.disconnect();
}

clean().catch(console.error);
