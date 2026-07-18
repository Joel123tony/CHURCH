import axios from 'axios';
import * as cheerio from 'cheerio';

const containsTamil = (text) => /[\u0B80-\u0BFF]/.test(text);

async function test() {
    const res = await axios.get('https://www.worldtamilchristians.com/en-samugam-un-mun-sentridum-song-lyrics/');
    const $ = cheerio.load(res.data);
    const contentDiv = $('.post-inner');
    contentDiv.find('.sharedaddy, .yarpp-related, #comments, .nav-links, .menu, header, footer, .author-box, style, script, .breadcrumb').remove();

    let rawHtml = contentDiv.html() || "";
    rawHtml = rawHtml.replace(/<\/(p|div|h[1-6]|li)>/gi, '\n');
    rawHtml = rawHtml.replace(/<br\s*[\/]?>/gi, '\n');
    
    let rawText = cheerio.load(rawHtml).text();
    let lines = rawText.split('\n');
    
    console.log("TOTAL LINES EXTRACTED FROM HTML:", lines.length);
    console.log(lines.slice(0, 30));
    
}
test();
