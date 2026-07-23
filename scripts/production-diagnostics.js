import dotenv from 'dotenv';
import { connectDB } from '../server/config/db.js';
import { providers } from '../server/services/songSources/adapterManager.js';
import { resilientFetch } from '../server/utils/resilientFetch.js';

dotenv.config({path: './server/.env'});

const TEST_SONGS = [
    // Common
    "Arathanai", "Ummai Allamal", "Enna Senjom", "Deva Kirubai",
    // Rare/New
    "10 Paisavuku", "5000 Paeruku", "1000 Generations", "Thoonga Iravugal",
    // Tamil
    "தூதர் பாடுவார் பரிசுத்தரை", "என் தேவன் என் வெளிச்சம்", "அஞ்சாதிரு என் நெஞ்சமே",
    // Mixed / English / Misspellings
    "Yazhini Kanne Kanmaniye", "enna seigom", "1 2 3 4 Alleluya", "Yesu Azhaikkirar", 
    "Jeeva Ellam Aagum", "Ummai Arathippen", "Neer Mathram Pothum", "Karthar Ennodu",
    "Parisuthar", "Thuthiyin Aadaigal", "Ennai Nadathidum", "Avar Kirubai", "Neer Ennai",
    "Appa Pithave", "Ennai Aalum", "Deva"
];

async function runDiagnostics() {
    await connectDB();
    console.log("=========================================");
    console.log("PRODUCTION DIAGNOSTICS: PROVIDER HEALTH");
    console.log("=========================================\n");

    const report = [];

    for (const p of providers) {
        console.log(`\nTesting Provider: ${p.name}`);
        const providerDef = p.provider;
        let successCount = 0;
        let extCount = 0;
        let failCount = 0;
        let totalTime = 0;
        
        for (let i = 0; i < TEST_SONGS.length; i++) {
            const song = TEST_SONGS[i];
            process.stdout.write(`  [${i+1}/${TEST_SONGS.length}] Search '${song}'... `);
            const start = Date.now();
            
            try {
                const results = await providerDef.searchSong(song);
                const elapsed = Date.now() - start;
                totalTime += elapsed;
                
                // If it doesn't throw, the API call was successful
                successCount++;
                
                if (results) {
                    const first = Array.isArray(results) ? results[0] : results;
                    if (first) {
                        process.stdout.write(`Found! `);
                        
                        // Some providers return a URL to extract, others return the extracted object directly.
                        if (first.cleanedLyricsTamil || first.lyricsTamil) {
                            extCount++;
                            console.log(`OK (Already Extracted). (${elapsed}ms)`);
                        } else if (first.url || first.link) {
                            process.stdout.write(`Extracting... `);
                            try {
                                const songData = await providerDef.extractSong(first.url || first.link);
                                if (songData && (songData.lyricsTamil || songData.titleTamil || songData.lyrics)) {
                                    extCount++;
                                    console.log(`OK. (${elapsed}ms)`);
                                } else {
                                    failCount++;
                                    console.log(`Empty extraction. (${elapsed}ms)`);
                                }
                            } catch (e) {
                                failCount++;
                                console.log(`Extract fail: ${e.message} (${elapsed}ms)`);
                            }
                        } else {
                            failCount++;
                            console.log(`Invalid result format. (${elapsed}ms)`);
                        }
                    } else {
                        console.log(`Not found (Valid API response). (${elapsed}ms)`);
                    }
                } else {
                    console.log(`Not found (Valid API response). (${elapsed}ms)`);
                }
            } catch (err) {
                const elapsed = Date.now() - start;
                totalTime += elapsed;
                failCount++;
                console.log(`Search fail: ${err.message} (${elapsed}ms)`);
            }
            
            // Artificial delay to prevent overwhelming
            await new Promise(r => setTimeout(r, 1000));
        }

        const avgLatency = Math.round(totalTime / TEST_SONGS.length);
        report.push({
            provider: p.name,
            searchSuccess: successCount,
            extractionSuccess: extCount,
            failures: failCount,
            avgLatency: `${avgLatency}ms`
        });
    }

    console.log("\n=========================================");
    console.log("DIAGNOSTICS REPORT");
    console.log("=========================================");
    console.table(report);
    
    process.exit(0);
}

runDiagnostics();
