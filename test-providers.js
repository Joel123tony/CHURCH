import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "server", ".env") });

import { searchOnlineSourcesAcrossProviders } from "./server/services/songSources/adapterManager.js";
import { connectDB } from "./server/config/db.js";

async function testProviders() {
  await connectDB();
  console.log("Searching providers for Enna Senjom...");
  try {
    const results = await searchOnlineSourcesAcrossProviders("Enna Senjom", 5);
    console.log("Across Providers:", JSON.stringify(results, null, 2));
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
testProviders();
