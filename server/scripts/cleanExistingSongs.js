import 'dotenv/config';
import { connectDB } from "../config/db.js";
import Song from "../models/Song.js";

const isDryRun = process.argv.includes("--dry-run");

const blacklistKeywords = [
    "home »", "blog »", "god medias", "save ", "saved ", "removed ", "faith score", 
    "see more", "related", "advertisement", "share", "tags", "category",
    "leave a reply", "song lyrics", "comments", "posted on", "you may also like"
];

async function cleanDatabase() {
    console.log("Connecting to Database...");
    await connectDB();
    
    console.log(`Starting ${isDryRun ? "DRY RUN " : ""}Migration...`);
    
    const allSongs = await Song.find({});
    console.log(`Found ${allSongs.length} total songs.`);
    
    let updatedCount = 0;
    
    for (const song of allSongs) {
        let needsUpdate = false;
        
        const cleanText = (text) => {
            if (!text) return text;
            const lines = text.split('\n');
            const cleanLines = [];
            
            for (const line of lines) {
                const lowerLine = line.toLowerCase();
                
                // If it contains a blacklist keyword, drop the line
                if (blacklistKeywords.some(kw => lowerLine.includes(kw))) {
                    needsUpdate = true;
                    continue; 
                }
                cleanLines.push(line);
            }
            return cleanLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
        };

        const newTamil = cleanText(song.lyricsTamil || song.lyrics);
        const newEng = cleanText(song.lyricsEnglish);
        
        if (needsUpdate) {
            updatedCount++;
            if (isDryRun) {
                console.log(`\n[DRY RUN] Would clean song: "${song.title}"`);
                // Find what was removed for logging
                const oldLines = (song.lyricsTamil || song.lyrics).split('\n');
                oldLines.forEach(l => {
                    if (blacklistKeywords.some(kw => l.toLowerCase().includes(kw))) {
                         console.log(`  - Removed: ${l}`);
                    }
                });
            } else {
                song.lyricsTamil = newTamil;
                song.lyrics = newTamil; 
                song.lyricsEnglish = newEng;
                song.lyricsLength = newTamil.length;
                
                await song.save();
            }
        }
    }
    
    if (isDryRun) {
        console.log(`\n[DRY RUN] ${updatedCount} songs would be cleaned.`);
    } else {
        console.log(`\nSuccessfully cleaned and saved ${updatedCount} songs.`);
    }
    
    process.exit(0);
}

cleanDatabase();
