import dotenv from 'dotenv';
import { connectDB } from '../server/config/db.js';
import Song from '../server/models/Song.js';

dotenv.config({path: '../server/.env'});

async function inspectQuarantine() {
    await connectDB();
    console.log("=========================================");
    console.log("QUARANTINE INSPECTION");
    console.log("=========================================\n");

    const quarantined = await Song.find({ status: { $in: ['failed', 'quarantined'] } }).lean();
    console.log(`Found ${quarantined.length} failed/quarantined songs in DB.`);

    const categories = {
        duplicate: 0,
        extraction_failure: 0,
        validation_failure: 0,
        provider_unavailable: 0,
        manual_review: 0,
        other: 0
    };

    const reasons = {};

    for (const song of quarantined) {
        const err = song.failReason || song.lastError || song.error || "";
        
        if (err.includes("duplicate") || err.includes("E11000") || err.includes("Already imported")) {
            categories.duplicate++;
        } else if (err.includes("Hard Reject") || err.includes("AI Rejected") || err.includes("validation") || err.includes("collection, playlist, or archive")) {
            categories.validation_failure++;
        } else if (err.includes("timeout") || err.includes("403") || err.includes("Puppeteer") || err.includes("Provider failed") || err.includes("status code 404") || err.includes("Provider Error")) {
            categories.provider_unavailable++;
        } else if (err.includes("Cannot read properties of null") || err.includes("extraction") || err.includes("No lyrics found")) {
            categories.extraction_failure++;
        } else if (song.aiNeedsReview || err.includes("review")) {
            categories.manual_review++;
        } else {
            categories.other++;
        }

        reasons[err] = (reasons[err] || 0) + 1;
    }

    console.table(categories);
    
    console.log("\nTop 10 Exact Reasons:");
    const sorted = Object.entries(reasons).sort((a,b) => b[1] - a[1]).slice(0, 10);
    sorted.forEach(([err, count]) => {
        console.log(`[${count}] ${err}`);
    });
    
    process.exit(0);
}

inspectQuarantine();
