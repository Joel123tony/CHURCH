import * as cheerio from "cheerio";
import axios from "axios";

async function inspectTheGodsMusic() {
    try {
        console.log("Fetching home page...");
        const homeRes = await axios.get("https://thegodsmusic.com/");
        console.log(`Home page status: ${homeRes.status}`);
        
        console.log("Fetching search results for 'Enna Senjom'...");
        const searchRes = await axios.get("https://thegodsmusic.com/?s=Enna+Senjom");
        console.log(`Search page status: ${searchRes.status}`);
        
        const $ = cheerio.load(searchRes.data);
        const links = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('thegodsmusic.com')) {
                links.push(href);
            }
        });
        
        console.log(`Found ${links.length} links on search page.`);
        // Let's print some unique ones to identify search results structure
        const uniqueLinks = [...new Set(links)].filter(l => !l.includes('/category/') && !l.includes('/tag/') && l !== 'https://thegodsmusic.com/');
        console.log(uniqueLinks.slice(0, 10));

        if (uniqueLinks.length > 0) {
            const songUrl = uniqueLinks[0];
            console.log(`\nFetching song page: ${songUrl}`);
            const songRes = await axios.get(songUrl);
            const $song = cheerio.load(songRes.data);
            
            console.log("Title (h1):", $song("h1").text().trim());
            console.log("Meta Title:", $song("title").text().trim());
            
            const content = $song(".entry-content, .post-content, article").text().trim().substring(0, 500);
            console.log("\nContent preview:\n", content);
        }
        
    } catch (err) {
        console.error("Error inspecting site:", err.message);
    }
}

inspectTheGodsMusic();
