import dotenv from 'dotenv';
import { resilientFetch } from './utils/resilientFetch.js';
import * as cheerio from 'cheerio';

dotenv.config({path: '.env'});

async function run() {
    try {
        const res = await resilientFetch('https://tamilchristiansongs.in/?s=Enna+Senjom');
        const $ = cheerio.load(res.data);
        console.log("Articles:", $('article').length);
        console.log("Entry-title a:", $('.entry-title a').length);
        console.log("H2 a:", $('h2 a').length);
        
        $('article').each((i, el) => {
            console.log("Found:", $(el).find('a').first().attr('href'));
        });
    } catch(e) {
        console.error(e.message);
    }
    process.exit(0);
}
run();
