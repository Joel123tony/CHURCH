import dotenv from 'dotenv';
import { resilientFetch } from './utils/resilientFetch.js';
import * as cheerio from 'cheerio';

dotenv.config({path: '.env'});

async function run() {
    try {
        const res = await resilientFetch('http://tamilchristianworship.com/newpraiselinks.html');
        const $ = cheerio.load(res.data);
        $('a').each((i, el) => {
            if (i > 50) return;
            const text = $(el).text().trim();
            const href = $(el).attr('href');
            console.log("Link:", text, "Href:", href);
        });
    } catch(e) {
        console.error(e.message);
    }
    process.exit(0);
}
run();
