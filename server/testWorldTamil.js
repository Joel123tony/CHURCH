import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function testFetch() {
  try {
    const res = await axios.get('https://www.worldtamilchristians.com/ummai-pola-yaarum-ille-song-lyrics/');
    fs.writeFileSync('testPage.html', res.data);
    console.log("Saved HTML");
  } catch (err) {
    console.error("Error:", err.message);
  }
}
testFetch();
