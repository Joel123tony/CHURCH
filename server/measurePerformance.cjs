const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const path = require('path');

async function testUpload() {
  const filePath = path.join(__dirname, 'test_large.mp4');
  
  if (!fs.existsSync(filePath)) {
    console.log("No test_large.mp4 found!");
    return;
  }
  
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('title', 'Performance Test Video');
  
  console.log(`Starting upload of ${filePath} (${fs.statSync(filePath).size} bytes)`);
  const startTime = Date.now();
  
  try {
    const res = await axios.post('http://localhost:5000/api/gallery', form, {
      headers: form.getHeaders(),
      timeout: 10 * 60 * 1000 // 10 mins
    });
    
    const endTime = Date.now();
    const durationSec = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log("=== PERFORMANCE REPORT ===");
    console.log(`Status: ${res.status}`);
    console.log(`Original Size: ${res.data.originalSize} bytes`);
    console.log(`Compressed Size: ${res.data.compressedSize} bytes`);
    console.log(`Total Request Time: ${durationSec} seconds`);
    console.log(`Cloudinary URL: ${res.data.data.url}`);
    console.log("==========================");
  } catch (err) {
    console.error("Upload failed:", err.message);
    if (err.response) {
      console.error(err.response.data);
    }
  }
}

testUpload();
