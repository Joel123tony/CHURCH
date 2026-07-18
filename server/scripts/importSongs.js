import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import Song from "../models/Song.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

if (!process.env.MONGO_URI) {
  console.error("FATAL: MONGO_URI is not defined.");
  process.exit(1);
}

const DEFAULT_SONGS = [
  {
    title: "எந்தன் சிறையிருப்பை நீர் மாற்றுவீர்",
    lyrics: "எந்தன் சிறையிருப்பை நீர் மாற்றுவீர்\nஎன் துக்கத்தை சந்தோஷமாய் மாற்றுவீர்\nஉம்மை துதிப்பேன் நான் பாடித் துதிப்பேன்\nஎன் இயேசுவே உம்மை துதிப்பேன்",
    category: "Worship",
    language: "Tamil",
    source: "TamilChristianSongs.in",
    url: "https://tamilchristiansongs.in/tamil/lyrics/enthan-siraiyiruppai-neer-maatruveer/",
    author: "Traditional",
    keywords: ["enthan", "siraiyiruppai", "neer", "maatruveer", "worship"]
  },
  {
    title: "சகலமும் உம்மாலே",
    lyrics: "சகலமும் உம்மாலே ஆகும்\nஉம்மாலே ஆகாதது ஒன்றுமில்லையே\nஎன் இயேசுவே உம்மாலே ஆகும்\nஎல்லாம் உம்மாலே ஆகும்",
    category: "Worship",
    language: "Tamil",
    source: "TamilChristianSongs.in",
    url: "https://tamilchristiansongs.in/tamil/lyrics/sagalamum-ummale/",
    author: "Traditional",
    keywords: ["sagalamum", "ummale", "aagum"]
  },
  {
    title: "கிருபையும் சத்தியமும்",
    lyrics: "கிருபையும் சத்தியமும்\nஉருவான இயேசுவே\nஉம்மை நான் ஆராதிப்பேன்\nஎந்நாளும் துதிப்பேன்",
    category: "Worship",
    language: "Tamil",
    source: "TamilChristianSongs.in",
    url: "https://tamilchristiansongs.in/tamil/lyrics/kirubaiyum-sathiyamum/",
    author: "Traditional",
    keywords: ["kirubaiyum", "sathiyamum"]
  },
  {
    title: "உம்மை அல்லாமல்",
    lyrics: "உம்மை அல்லாமல் எனக்கு யாருண்டு\nஎன் இயேசுவே நீர் மாத்திரம் போதும்\nஎன் வாழ்வில் நீர் மாத்திரம் போதும்",
    category: "Worship",
    language: "Tamil",
    source: "TamilChristianSongs.in",
    url: "https://tamilchristiansongs.in/tamil/lyrics/ummai-allamal-enakku-yaarundu/",
    author: "Traditional",
    keywords: ["ummai", "allamal", "enakku", "yaarundu"]
  },
  {
    title: "என் ஆத்துமாவே",
    lyrics: "என் ஆத்துமாவே கர்த்தரை ஸ்தோத்திரி\nஎன் முழு உள்ளமே அவருடைய பரிசுத்த நாமத்தை ஸ்தோத்திரி",
    category: "Keerthanai",
    language: "Tamil",
    source: "ChristianKeerthanai.com",
    url: "https://christiankeerthanaisong.com/en-aathumave-kartharai/",
    author: "David",
    keywords: ["en", "aathumave", "kartharai"]
  },
  {
    title: "அன்பின் ரூபியே",
    lyrics: "அன்பின் ரூபியே\nஅருள் நாதனே\nஅன்பால் என்னை\nஅணைத்துக்கொள்ளும்",
    category: "Keerthanai",
    language: "Tamil",
    source: "ChristianKeerthanai.com",
    url: "https://christiankeerthanaisong.com/anbin-roobiye/",
    author: "Traditional",
    keywords: ["anbin", "roobiye"]
  },
  {
    title: "தேவனே நான் உமதண்டையில்",
    lyrics: "தேவனே நான் உமதண்டையில்\nஇன்னும் நெருங்கிச் சேர்வதே\nஎன் ஆவல்",
    category: "Paamalai",
    language: "Tamil",
    source: "ChristSquare.com",
    url: "https://www.christsquare.com/devane-naan-umathandaiyil/",
    author: "Traditional",
    keywords: ["devane", "naan", "umathandaiyil"]
  },
  {
    title: "ஆராதனை நாயகன்",
    lyrics: "ஆராதனை நாயகன் நீரே\nஆராதனை வேந்தனும் நீரே\nஆயுள் முழுதும் உம்மைத் துதிப்பேன்\nஎன் இயேசுவே உம்மைத் துதிப்பேன்",
    category: "Traditional",
    language: "Tamil",
    source: "TamilChristianSongs.in",
    url: "https://tamilchristiansongs.in/tamil/lyrics/aaradhanai-nayagan-neere/",
    author: "Traditional",
    keywords: ["aaradhanai", "nayagan", "neere"]
  },
  {
    title: "என் மீட்பர் உயிரோடிருக்கையிலே",
    lyrics: "என் மீட்பர் உயிரோடிருக்கையிலே\nஎனக்கு என்ன குறைச்சல்\nஎன் வாழ்வில் என்றுமே\nசந்தோஷம் பாக்கியம்",
    category: "Traditional",
    language: "Tamil",
    source: "TamilChristianSongs.in",
    url: "https://tamilchristiansongs.in/tamil/lyrics/en-meetpar-uyirodirukkaiyile/",
    author: "Traditional",
    keywords: ["en", "meetpar", "uyirodirukkaiyile"]
  },
  {
    title: "ஸ்தோத்திரம் இயேசு நாதா",
    lyrics: "ஸ்தோத்திரம் இயேசு நாதா\nஉமக்கென்றும் ஸ்தோத்திரம் இயேசு நாதா\nஸ்தோத்திரம் செய்கின்றோம்\nஉம் அடியார் திரு நாமம் தன்னையே",
    category: "Keerthanai",
    language: "Tamil",
    source: "ChristianKeerthanai.com",
    url: "https://christiankeerthanaisong.com/sthothiram-yesu-natha/",
    author: "Traditional",
    keywords: ["sthothiram", "yesu", "natha"]
  },
  {
    title: "நீர் மாத்திரம் என் வாழ்வில்",
    lyrics: "நீர் மாத்திரம் என் வாழ்வில்\nபோதும் இயேசுவே\nவேறொன்றும் எனக்கு வேண்டாம்\nஎன் இயேசுவே",
    category: "Worship",
    language: "Tamil",
    source: "TamilChristianSongs.in",
    url: "https://tamilchristiansongs.in/tamil/lyrics/neer-mathiram-en-vazhvil/",
    author: "Traditional",
    keywords: ["neer", "mathiram", "en", "vazhvil"]
  },
  {
    title: "உம் பாதம் பணிகின்றேன்",
    lyrics: "உம் பாதம் பணிகின்றேன்\nஉம் திருமுகம் தேடுகின்றேன்\nஎன் அன்பே என் இயேசுவே\nஉம்மையே நான் துதிக்கின்றேன்",
    category: "Paamalai",
    language: "Tamil",
    source: "ChristSquare.com",
    url: "https://www.christsquare.com/um-paatham-panigindren/",
    author: "Traditional",
    keywords: ["um", "paatham", "panigindren"]
  }
];

async function importSongs() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  let songsToImport = DEFAULT_SONGS;
  const dataFilePath = path.join(__dirname, "../data/songs.json");

  try {
    const fileData = await fs.readFile(dataFilePath, "utf-8");
    songsToImport = JSON.parse(fileData);
    console.log(`Loaded ${songsToImport.length} songs from data/songs.json`);
  } catch (error) {
    console.log("No data/songs.json found. Using default seed array.");
  }

  console.log(`Starting import of ${songsToImport.length} songs...`);

  let added = 0;
  let updated = 0;

  for (const song of songsToImport) {
    try {
      const result = await Song.updateOne(
        { url: song.url },
        { $set: song },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        added++;
      } else if (result.modifiedCount > 0) {
        updated++;
      }
    } catch (err) {
      console.error(`Failed to import song: ${song.title}`, err.message);
    }
  }

  console.log("\n=================================");
  console.log(`Import Complete!`);
  console.log(`Added: ${added}`);
  console.log(`Updated: ${updated}`);
  const finalCount = await Song.countDocuments();
  console.log(`Total songs in Database: ${finalCount}`);
  console.log("=================================\n");

  mongoose.connection.close();
}

importSongs().catch(console.error);
