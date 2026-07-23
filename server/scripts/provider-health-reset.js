import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
import { setTimeout } from "timers/promises";

dotenv.config();
import ProviderHealth from "../models/ProviderHealth.js";

const PROVIDERS = [
  "tamilchristiansongs.in",
  "tamilchristianworship.com",
  "thegodsmusic.com",
  "worldtamilchristians.com"
];

const SEARCH_QUERIES = [
  "Yesu", "Devan", "Anbu", "Karthar", "Parisutham", "Magimai", "Sthothiram", "Ummai", "Aarathanai", "Jebam"
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  // Wipe ProviderHealth
  const res = await ProviderHealth.deleteMany({});
  console.log(`Wiped ${res.deletedCount} old ProviderHealth records.`);

  console.log("\nTriggering searches to rebuild health metrics...");
  for (const provider of PROVIDERS) {
    for (const query of SEARCH_QUERIES) {
      try {
        const url = `http://localhost:5000/api/songs?search=${encodeURIComponent(query + " site:" + provider)}`;
        await axios.get(url, { timeout: 15000 });
        process.stdout.write(".");
      } catch (err) {
        process.stdout.write("X");
      }
      // Small pause to prevent overloading local node too much
      await setTimeout(200);
    }
    console.log(`\nFinished ${provider}`);
  }

  console.log("\nWaiting a few seconds for workers to record health metrics...");
  await setTimeout(5000);

  const metrics = await ProviderHealth.find({}).lean();
  console.log("\n=== NEW PROVIDER HEALTH ===");
  for (const m of metrics) {
    const successRate = m.totalSamples ? Math.round((m.successCount / m.totalSamples) * 100) : 0;
    console.log(`Provider: ${m.provider}`);
    console.log(` Samples: ${m.totalSamples} | Success: ${m.successCount} | Failures: ${m.failureCount}`);
    console.log(` Rate: ${successRate}% | Score: ${m.healthScore} (${m.reliabilityBand})\n`);
  }

  mongoose.disconnect();
}
run();
