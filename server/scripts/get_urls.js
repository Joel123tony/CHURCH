import axios from 'axios';
import * as cheerio from 'cheerio';

async function run() {
    let res = await axios.get('https://www.worldtamilchristians.com/tamil-christians-songs/', { headers: { 'User-Agent': 'Mozilla/5.0' }});
    let $ = cheerio.load(res.data);
    console.log("WTC Title:", $('title').text());
    let wtcLinks = [];
    $('a').each((i, el) => {
        let h = $(el).attr('href');
        if (h && h.includes('-lyrics-')) wtcLinks.push(h);
    });
    console.log('WTC Link:', wtcLinks[0]);

    let res2 = await axios.get('https://tamilchristiansongs.in/category/tamil-christian-songs/', { headers: { 'User-Agent': 'Mozilla/5.0' }});
    let $2 = cheerio.load(res2.data);
    console.log("TCS Title:", $2('title').text());
    let tcsLinks = [];
    $2('a').each((i, el) => {
        let h = $2(el).attr('href');
        if (h && h.includes('-lyrics')) tcsLinks.push(h);
    });
    console.log('TCS Link:', tcsLinks[0]);
}
run();
