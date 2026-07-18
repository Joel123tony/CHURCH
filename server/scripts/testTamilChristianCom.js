import axios from 'axios';
import * as cheerio from 'cheerio';

async function run() {
    try {
        const url = "https://www.tamilchristian.com/tamil-pages/nee-ennudayavazl/";
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
        const $ = cheerio.load(res.data);
        
        console.log("Title:", $('title').text());
        console.log("Body snippet:", $('body').text().replace(/\s+/g, ' ').substring(0, 1000));
        
        let lyrics = "";
        $('p, div, span').each((i, el) => {
            const txt = $(el).text().trim();
            if (txt.match(/[\u0B80-\u0BFF]/)) {
                lyrics += txt + "\n";
            }
        });
        console.log("Extracted Unicode:", lyrics.substring(0, 500));
    } catch(e) {
        console.error("Error:", e.message);
    }
}

run();
