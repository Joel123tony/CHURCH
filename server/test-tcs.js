import dotenv from 'dotenv';
import { resilientFetch } from '../server/utils/resilientFetch.js';
import * as cheerio from 'cheerio';

dotenv.config({path: '../server/.env'});

async function run() {
    try {
        const res = await resilientFetch('https://tamilchristiansongs.in/?s=Enna+Senjom');
        const $ = cheerio.load(res.data);
        $('article').each((i, el) => {
            console.log($(el).find('.entry-title a').attr('href'));
        });
    } catch(e) {
        console.error(e.message);
    }
    process.exit(0);
}
run();
