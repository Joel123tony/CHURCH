import { providers } from "./server/services/songSources/adapterManager.js";
import mongoose from "mongoose";

async function runDiagnostics(query) {
    await mongoose.connect("mongodb://localhost:27017/church_db");
    console.log(`Starting Diagnostics for: "${query}"\n`);
    
    for (const { name, provider } of providers) {
        console.log(`----------------------------------------`);
        console.log(`Provider: ${name}`);
        const startTime = Date.now();
        try {
            const result = await provider.searchSong(query);
            const duration = Date.now() - startTime;
            
            if (result) {
                console.log(`✅ Success in ${duration}ms`);
                console.log(`URL: ${result.sourceUrl}`);
                console.log(`Title: ${result.titleTamil || result.titleEnglish}`);
                console.log(`Lyrics Extracted? ${result.lyricsTamil ? 'Yes' : 'No'}`);
                if (result.lyricsTamil === "pending_fetch") {
                    console.log(`Warning: Lyrics marked as pending_fetch`);
                } else if (result.lyricsTamil) {
                    console.log(`Lyrics preview: ${result.lyricsTamil.substring(0, 100).replace(/\n/g, ' ')}...`);
                }
            } else {
                console.log(`❌ Failed in ${duration}ms (Returned null)`);
                console.log(`Reason: Could not find song or failed to extract lyrics.`);
            }
        } catch (err) {
            const duration = Date.now() - startTime;
            console.log(`❌ Error in ${duration}ms`);
            console.log(`Error Message: ${err.message}`);
        }
    }
    console.log(`----------------------------------------`);
    await mongoose.disconnect();
    console.log("\nDiagnostics Complete.");
    process.exit(0);
}

runDiagnostics("Enna Senjom");
