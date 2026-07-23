import * as cheerio from "cheerio";
import axios from "axios";

async function inspectTheGodsMusic() {
    try {
        const songUrl = 'https://thegodsmusic.com/lyrics/enna-senjom-song-lyrics/';
        console.log(`\nFetching song page: ${songUrl}`);
        const songRes = await axios.get(songUrl);
        const $song = cheerio.load(songRes.data);
        
        console.log("Title (h1):", $song("h1").text().trim());
        console.log("Meta Title:", $song("title").text().trim());
        
        const entryContent = $song(".entry-content, article").text().trim().substring(0, 500);
        console.log("\nEntry Content preview:\n", entryContent);

        console.log("\nTrying to find lyrics blocks...");
        $song("p").each((i, el) => {
            const text = $song(el).text().trim();
            if (text.length > 20) {
                console.log(`Paragraph ${i}: ${text.substring(0, 50)}...`);
            }
        });

    } catch (err) {
        console.error("Error inspecting site:", err.message);
    }
}

inspectTheGodsMusic();
