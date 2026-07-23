import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });
import mongoose from 'mongoose';
import Song from './server/models/Song.js';

async function testDB() {
    console.log("=== MongoDB Atlas Verification ===");
    try {
        console.log("Connecting to:", process.env.MONGO_URI.replace(/:([^:@]{3,})@/, ':***@'));
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log("✅ Successfully connected to MongoDB Atlas.");

        console.log("\n[1] Testing Read Operation...");
        const count = await Song.countDocuments();
        console.log(`✅ Read successful. Total Songs in DB: ${count}`);

        console.log("\n[2] Testing Write/Delete Operation...");
        const testSong = new Song({
            title: "Test Verification Song",
            titleEnglish: "Test Verification Song",
            url: "https://test.com/verification",
            status: "draft",
            isPublished: false
        });
        await testSong.save();
        console.log(`✅ Write successful. Inserted ID: ${testSong._id}`);

        await Song.deleteOne({ _id: testSong._id });
        console.log(`✅ Delete successful. Removed ID: ${testSong._id}`);

    } catch (err) {
        console.error("❌ MongoDB Connection or Operation Failed:", err.message);
        if (err.message.includes('buffering timed out') || err.message.includes('ECONNREFUSED')) {
            console.error("   Reason: Your IP address is likely not whitelisted in MongoDB Atlas Network Access.");
        }
    } finally {
        await mongoose.disconnect();
        console.log("\nVerification complete.");
    }
}

testDB();
