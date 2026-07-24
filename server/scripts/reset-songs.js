import mongoose from "mongoose";
import dotenv from "dotenv";
import Song from "../models/Song.js";
import SongSearchCache from "../models/SongSearchCache.js";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function resetSongs() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.");

  const titles = ["Enna Senjom", "Sarvagnani", "Ummai Aarathippen", "Thuthiyin Aadaigal"];
  
  for (const title of titles) {
    const result = await Song.deleteMany({ title: { $regex: new RegExp(title, "i") } });
    console.log(`Deleted ${result.deletedCount} records for: ${title}`);
  }

  const delCache = await SongSearchCache.deleteMany({});
  console.log(`Cache cleared: ${delCache.deletedCount} items.`);
  
  await mongoose.disconnect();
}

resetSongs().catch(console.error);
