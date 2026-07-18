import mongoose from "mongoose";
import dotenv from "dotenv";
import Song from "../models/Song.js";

dotenv.config();

const cleanSongs = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const songs = await Song.find({});
        console.log(`Scanning ${songs.length} total songs...`);

        let completedCount = 0;
        let failedCount = 0;

        for (const song of songs) {
            let isValid = true;
            let failReason = "";

            // Check conditions
            if (!song.title && !song.titleTamil && !song.titleEnglish) {
                isValid = false;
                failReason = "Title is empty";
            } else if (!song.lyrics && !song.lyricsTamil && !song.lyricsEnglish) {
                isValid = false;
                failReason = "Lyrics are empty";
            } else if ((song.lyricsTamil?.length || song.lyrics?.length || 0) < 100) {
                isValid = false;
                failReason = "Lyrics length < 100 characters";
            } else if (song.title === "Failed Import" || song.scrapeStatus === "failed") {
                isValid = false;
                failReason = song.failReason || "Marked as failed import";
            }

            if (isValid) {
                song.status = "completed";
                song.isPublished = true;
                completedCount++;
            } else {
                song.status = "failed";
                song.isPublished = false;
                song.failReason = failReason;
                failedCount++;
            }

            await song.save();
        }

        console.log("--- Migration Complete ---");
        console.log(`✅ Valid Songs (Completed): ${completedCount}`);
        console.log(`❌ Invalid Songs (Failed): ${failedCount}`);

        mongoose.connection.close();
    } catch (err) {
        console.error("Migration error:", err);
        mongoose.connection.close();
        process.exit(1);
    }
};

cleanSongs();
