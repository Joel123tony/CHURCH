import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "server", ".env") });

async function checkDb() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");
  
  const songsCollection = mongoose.connection.collection("songs");
  const regex = new RegExp("enna senjom", "i");
  
  const songs = await songsCollection.find({
    $or: [
      { title: regex },
      { titleTamil: regex },
      { titleEnglish: regex },
      { alternateTitles: regex },
      { normalizedTitle: regex },
      { searchIndex: regex },
      { aliases: regex }
    ]
  }).toArray();
  
  console.log("Found matches in title fields:", songs.length);
  songs.forEach(s => console.log("Title:", s.title));
  
  process.exit(0);
}

checkDb().catch(console.error);
