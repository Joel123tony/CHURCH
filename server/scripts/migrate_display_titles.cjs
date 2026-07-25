const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function migrate() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected. Starting migration...");

        // We can't easily import ES modules into CJS script without dynamic import,
        // so we'll just replicate the minimal logic here for the migration.
        
        const Song = mongoose.connection.collection("songs");
        
        const songs = await Song.find({}).toArray();
        console.log(`Found ${songs.length} songs. Proceeding to migrate...`);
        
        let batch = [];
        let count = 0;
        
        const normalizeSongTitle = (title) => {
            if (!title) return "";
            return String(title).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
        };

        for (const song of songs) {
            const authorStr = song.author || "";
            const invalidAuthors = ["unknown", "n/a", "traditional", ""];
            const isInvalidAuthor = invalidAuthors.includes(authorStr.toLowerCase().trim());
            
            const title = song.title || "";
            const displayTitle = isInvalidAuthor ? title : `${title} by ${authorStr.trim()}`;
            const normalizedDisplayTitle = normalizeSongTitle(displayTitle);
            
            batch.push({
                updateOne: {
                    filter: { _id: song._id },
                    update: {
                        $set: {
                            displayTitle: displayTitle,
                            normalizedDisplayTitle: normalizedDisplayTitle
                        }
                    }
                }
            });
            
            if (batch.length === 500) {
                await Song.bulkWrite(batch);
                count += batch.length;
                console.log(`Migrated ${count} songs...`);
                batch = [];
            }
        }
        
        if (batch.length > 0) {
            await Song.bulkWrite(batch);
            count += batch.length;
            console.log(`Migrated ${count} songs...`);
        }
        
        console.log("Migration complete!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
