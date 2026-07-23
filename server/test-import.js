import { importSongOnDemand } from './services/songService.js';
import mongoose from "mongoose";

const TEST_SONGS = [
  "Ummai Aarathippen",
  "Thuthiyin Aadaigal",
  "Pudhiya Naal Idhu"
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function verifySongs() {
  await mongoose.connect('mongodb://churchadmin:mtc2611@ac-0jfscni-shard-00-00.jf0uog0.mongodb.net:27017,ac-0jfscni-shard-00-01.jf0uog0.mongodb.net:27017,ac-0jfscni-shard-00-02.jf0uog0.mongodb.net:27017/churchdb?ssl=true&replicaSet=atlas-xboc9n-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0');
  for (const q of TEST_SONGS) {
    console.log(`\n======================================`);
    console.log(`🔎 Forcing Import for: ${q}`);
    
    try {
      const song = await importSongOnDemand(q, []);
      if (!song) {
        console.log(`❌ FAILED: Could not import ${q}`);
        continue;
      }
      
      console.log(`✅ Title: ${song.title}`);
      console.log(`✅ Tamil Title: ${song.titleTamil}`);
      console.log(`✅ Status: ${song.status}`);
      console.log(`✅ Source: ${song.sourceUrl}`);
      
      let passed = true;

      // Check pending_fetch
      if (song.lyrics === 'pending_fetch') {
        console.log(`❌ FAILED: Lyrics still pending_fetch!`);
        passed = false;
      } else {
        console.log(`✅ Passed: No pending_fetch.`);
      }

      // Check branding
      if (/the god's music|god medias|tamil christians songs/i.test(song.lyrics)) {
        console.log(`❌ FAILED: Provider branding detected!`);
        passed = false;
      } else {
        console.log(`✅ Passed: No provider branding.`);
      }

      // Check Tamil text
      if (!/[\u0B80-\u0BFF]/.test(song.lyrics) && song.lyrics !== 'pending_fetch') {
        console.log(`❌ FAILED: Proper Tamil rendering not detected!`);
        passed = false;
      } else if (song.lyrics !== 'pending_fetch') {
        console.log(`✅ Passed: Tamil characters detected.`);
      }

      // Check Verse/Chorus
      if (!/Verse|Chorus|சரணம்|பல்லவி/i.test(song.lyrics) && song.lyrics !== 'pending_fetch') {
        console.log(`❌ FAILED: Verse/Chorus formatting missing!`);
        passed = false;
      } else if (song.lyrics !== 'pending_fetch') {
        console.log(`✅ Passed: Verse/Chorus formatting detected.`);
      }

      console.log(`\n📄 Snippet of Lyrics:\n${(song.lyrics || '').substring(0, 200)}...\n`);
    } catch (e) {
      console.log(`❌ ERROR: ${e.message}`);
    }
  }
  process.exit(0);
}

verifySongs().catch(console.error);
