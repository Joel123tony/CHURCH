import * as cheerio from 'cheerio';
import fs from 'fs';

const html = fs.readFileSync('testCategory.html', 'utf-8');
const $ = cheerio.load(html);

console.log("Pagination links:");
$('.pagination a, .nav-links a, a.page-numbers').each((i, el) => {
    console.log($(el).text().trim(), $(el).attr('href'));
});

// Check if any next link
const next = $('.next').attr('href') || $('a.next.page-numbers').attr('href');
console.log("Next link class .next :", next);

