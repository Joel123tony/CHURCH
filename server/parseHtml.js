import * as cheerio from 'cheerio';
import fs from 'fs';

const html = fs.readFileSync('testPage.html', 'utf-8');
const $ = cheerio.load(html);

const contentDiv = $('.post-inner');
if (contentDiv.length) {
    let lyricsText = "";
    // Often lyrics are in <p> tags with br
    contentDiv.find('p').each((i, el) => {
        // extract text and preserve br as newlines
        const pHtml = $(el).html();
        if (pHtml) {
           // replace <br> with newline
           const pText = $(el).html().replace(/<br\s*[\/]?>/gi, '\n');
           const textNode = cheerio.load(pText).text().trim();
           if (textNode) {
               lyricsText += textNode + "\n\n";
           }
        }
    });
    console.log("Lyrics extracted:\n");
    console.log(lyricsText.substring(0, 1000));
}

