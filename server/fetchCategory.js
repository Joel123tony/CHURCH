import axios from 'axios';
import fs from 'fs';

async function testFetch() {
  try {
    const res = await axios.get('https://www.worldtamilchristians.com/category/tamil-christians-songs/');
    fs.writeFileSync('testCategory.html', res.data);
    console.log("Saved Category HTML");
  } catch (err) {
    console.error("Error:", err.message);
  }
}
testFetch();
