const fs = require('fs');

const API_URL = 'http://localhost:5000/api/songs/search';

const SONGS = [
  'Sarvagnani', 'Uyar Malaiyo', 'Kiruba Kiruba', 'Stella Ramola Aasirvadham',
  'Enna Senjom', 'Ummai Aarathippen', 'Thuthiyin Aadaigal', 'Pudhiya Naal Idhu',
  'Azhagae Azhagae', 'En Uyirana Yesu', 'En Ithayam', 'Ummai Thuthipen',
  'Aaviyana Devan', 'Raja Um Maligaiyil', 'Unnatha devan', 'Aaradhanai Nayagan',
  'Thaguthiyae Illatha Ennai', 'Anbe Kalvari Anbe', 'Deva Pithave', 'Paraloga Rajave'
];

async function runTest() {
  let md = '| Song | Result | Provider | Source | First Search (ms) | Second Search (ms) | Duplicate | Ghost |\n';
  md += '|---|---|---|---|---|---|---|---|\n';
  
  for (const song of SONGS) {
    console.log("Testing: " + song);
    try {
      const t0 = Date.now();
      const res1 = await fetch(API_URL + '?query=' + encodeURIComponent(song)).then(r => r.json());
      const firstTime = Date.now() - t0;
      
      const isGhost = res1.songs && res1.songs.length === 0 && res1.status !== 'searching_online';
      
      if (res1.status === 'searching_online') {
          console.log("  -> Background import triggered. Waiting 10s...");
          await new Promise(r => setTimeout(r, 10000));
      }
      
      const t1 = Date.now();
      const res2 = await fetch(API_URL + '?query=' + encodeURIComponent(song)).then(r => r.json());
      const secondTime = Date.now() - t1;
      
      const provider = res2.songs && res2.songs[0] ? res2.songs[0].source : 'N/A';
      const source = (res2.performance && res2.performance.cacheLookup > 0) ? 'Cache' : 'MongoDB';
      const result = res2.songs && res2.songs.length > 0 ? 'PASS' : 'FAIL';
      
      const hasDupes = res2.songs && res2.songs.length > 1 && res2.songs[0].title === res2.songs[1].title;
      
      md += '| ' + song + ' | ' + result + ' | ' + provider + ' | ' + source + ' | ' + firstTime + ' | ' + secondTime + ' | ' + (hasDupes ? 'YES' : 'NO') + ' | ' + (isGhost ? 'YES' : 'NO') + ' |\n';
      
      // small delay
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.log('Error on ' + song + ':', err.message);
      md += '| ' + song + ' | ERROR | N/A | N/A | - | - | - | - |\n';
    }
  }
  
  fs.writeFileSync('../qa_report_final.md', md);
  console.log('Done');
}

runTest();
