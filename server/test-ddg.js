import dotenv from 'dotenv';
import { searchSiteWithDuckDuckGo } from './utils/searchFallback.js';

dotenv.config({path: '.env'});

async function run() {
    const axios = (await import('axios')).default;
    const res = await axios.get('https://html.duckduckgo.com/html/?q=site:worldtamilchristians.com+Enna+Senjom', {
        headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    });
    const cheerio = await import('cheerio');
    const $ = cheerio.load(res.data);
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && (href.includes('worldtamilchristians.com') || href.includes('uddg='))) {
            console.log(href);
        }
    });
    process.exit(0);
}
run();
