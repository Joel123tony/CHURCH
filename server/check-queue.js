import mongoose from "mongoose";
import JobQueue from "./models/JobQueue.js";
import Song from "./models/Song.js";

async function check() {
  await mongoose.connect('mongodb://churchadmin:mtc2611@ac-0jfscni-shard-00-00.jf0uog0.mongodb.net:27017,ac-0jfscni-shard-00-01.jf0uog0.mongodb.net:27017,ac-0jfscni-shard-00-02.jf0uog0.mongodb.net:27017/churchdb?ssl=true&replicaSet=atlas-xboc9n-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0');
  
  const jobs = await JobQueue.find({ type: "ai_cleaning" }).sort({ createdAt: -1 }).limit(10).lean();
  console.log("Latest AI Cleaning Jobs:");
  for (const j of jobs) {
      console.log(`- ID: ${j._id}, Status: ${j.status}, Url: ${j.payload.url}, Error: ${j.lastError}`);
  }
  
  process.exit(0);
}
check();
