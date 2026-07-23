import mongoose from "mongoose";
import Song from "./server/models/Song.js";

async function clearDB() {
    await mongoose.connect("mongodb://localhost:27017/church_db");
    const result = await Song.deleteMany({ title: "Enna Senjom" });
    console.log(`Deleted ${result.deletedCount} songs.`);
    process.exit(0);
}
clearDB();
