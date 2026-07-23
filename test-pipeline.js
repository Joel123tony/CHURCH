import axios from "axios";

async function verifyPipeline() {
  console.log("Testing complete Songs Intelligence pipeline...");
  
  // Test 1: Search an obscure song
  console.log("\n--- Test 1: Search 'Enna Senjom' ---");
  try {
    const res = await axios.get("http://localhost:5000/api/songs?search=Enna Senjom");
    console.log(`Status: ${res.status}`);
    console.log(`Songs Found: ${res.data.songs?.length || 0}`);
    if (res.data.songs?.length > 0) {
      const song = res.data.songs[0];
      console.log(`Top match: ${song.title}`);
      console.log(`Source: ${song.source}`);
      console.log(`Status: ${song.status}`);
    }
  } catch (err) {
    console.error("Test 1 Failed:", err.message);
  }

  console.log("\nPipeline verification finished.");
}

verifyPipeline();
