import mongoose from "mongoose";
import Song from "./models/Song.js";
import JobQueue from "./models/JobQueue.js";
import { QueueManager } from "./utils/queueManager.js";

async function run() {
  await mongoose.connect('mongodb://churchadmin:mtc2611@ac-0jfscni-shard-00-00.jf0uog0.mongodb.net:27017,ac-0jfscni-shard-00-01.jf0uog0.mongodb.net:27017,ac-0jfscni-shard-00-02.jf0uog0.mongodb.net:27017/churchdb?ssl=true&replicaSet=atlas-xboc9n-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0');
  
  const badSongs = await Song.find({ title: { $in: ["Thuthiyin Aadaigal", "Pudhiya Naal Idhu"] } });
  console.log(`Found ${badSongs.length} bad songs`);
  
  for (const song of badSongs) {
      console.log(`Resetting: ${song.title} (${song._id})`);
      song.status = "processing";
      song.lyricsStatus = "pending";
      song.lyrics = "pending_fetch";
      song.lyricsTamil = "pending_fetch";
      await song.save();
      
      // Delete old jobs
      await JobQueue.deleteMany({ songId: song._id });
      
      // Re-queue import
      await QueueManager.addJob("import", {
          url: song.sourceUrl || song.url,
          priority: 1
      }, song._id);
  }
  
  console.log("Done");
  process.exit(0);
}
run();
