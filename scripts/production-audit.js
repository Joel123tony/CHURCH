import mongoose from "mongoose";
import { getActiveProviders } from "../server/services/songSources/adapterManager.js";
import { getProviderHealthSnapshot } from "../server/services/ai/providerHealth.js";

async function runAudit() {
    console.log("==========================================");
    console.log("  PRODUCTION AUDIT & HEALTH REPORT");
    console.log("==========================================\n");

    try {
        await mongoose.connect("mongodb://localhost:27017/church_db");

        console.log("[1] Checking Provider Health Snapshot...");
        const health = await getProviderHealthSnapshot();
        console.table(health.map(h => ({
            Provider: h.provider,
            Score: h.healthScore,
            Band: h.reliabilityBand,
            SuccessRate: h.successRate + '%',
            AvgConfidence: h.avgConfidence,
            AvgLatency: h.avgProcessingTimeMs + 'ms'
        })));

        console.log("\n[2] Checking Active Provider Order...");
        const active = await getActiveProviders();
        console.log("Current Provider Priority Array:");
        active.forEach((p, idx) => {
            console.log(`  ${idx + 1}. ${p.name} (Domain: ${p.domain})`);
        });

        console.log("\n[3] Executing Live Extraction Verification...");
        const testQuery = "Enna Senjom";
        
        for (const { name, provider } of active) {
            console.log(`\n--- Testing ${name} ---`);
            const start = Date.now();
            try {
                const result = await provider.searchSong(testQuery);
                const latency = Date.now() - start;
                
                if (result) {
                    console.log(`✅ Success in ${latency}ms`);
                    console.log(`   URL: ${result.sourceUrl}`);
                    console.log(`   Title: ${result.titleTamil || result.titleEnglish}`);
                    console.log(`   Confidence: ${result.confidenceScore || result.aiConfidence || 'N/A'}`);
                    if (result.lyricsTamil && result.lyricsTamil !== "pending_fetch") {
                        console.log(`   Lyrics extracted successfully (${result.lyricsTamil.length} chars)`);
                    } else if (result.lyricsTamil === "pending_fetch") {
                        console.log(`   Lyrics marked as pending_fetch (Asynchronous Extraction)`);
                    } else {
                        console.log(`   ⚠️ Failed to extract lyrics block.`);
                    }
                } else {
                    console.log(`❌ Failed in ${latency}ms (Returned null)`);
                }
            } catch (err) {
                console.log(`❌ Error in ${Date.now() - start}ms: ${err.message}`);
            }
        }

    } catch (e) {
        console.error("Audit failed:", e.message);
    } finally {
        await mongoose.disconnect();
        console.log("\n==========================================");
        console.log("  AUDIT COMPLETE");
        console.log("==========================================");
        process.exit(0);
    }
}

runAudit();
