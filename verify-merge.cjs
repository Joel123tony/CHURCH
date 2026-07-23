require('dotenv').config({path: './server/.env'});
const mongoose = require('mongoose');

async function testMerge() {
    const { connectDB } = await import('./server/config/db.js');
    await connectDB();
    
    const songModule = await import('./server/models/Song.js');
    const Song = songModule.default || songModule.Song;
    
    // Search for Enna Senjom
    const songs = await Song.find({ titleTamil: { $regex: /Enna Senjom/i } });
    
    console.log(`Found ${songs.length} song(s) for 'Enna Senjom'.`);
    if (songs.length > 0) {
        for (const song of songs) {
            console.log("\n---");
            console.log("ID:", song._id);
            console.log("Title:", song.titleTamil);
            console.log("Status:", song.status);
            console.log("Lyrics Status:", song.lyricsStatus);
            console.log("Original Provider:", song.source);
            console.log("Canonical Source:", song.canonicalSource);
            console.log("Provider History (count):", song.providerHistory?.length || 0);
            if (song.providerHistory && song.providerHistory.length > 0) {
                console.log("Providers:");
                song.providerHistory.forEach(ph => console.log(`  - ${ph.provider} (Quality: ${ph.qualityScore}, Confidence: ${ph.confidenceScore})`));
            }
        }
    }
    
    process.exit(0);
}

testMerge().catch(console.error);
