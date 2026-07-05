import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { uploadToCloudinary } from './utils/uploadToCloudinary.js';

dotenv.config();

const testUpload = async () => {
  try {
    const textBuffer = Buffer.from('Hello this is a test text file.', 'utf8');
    
    console.log('Uploading test TXT to Cloudinary...');
    const result = await uploadToCloudinary(textBuffer, {
      folder: 'church-books/test',
      resource_type: 'raw',
      public_id: 'test_text_upload_' + Date.now() + '.txt'
    });
    
    console.log('Upload Result URL:', result.url);
    console.log('Try curling the URL to see if it works without 401:');
    console.log('Run: curl -I ' + result.url);
    
    // We can curl it automatically here
    const { exec } = await import('child_process');
    exec(`curl -I ${result.url}`, (err, stdout, stderr) => {
      console.log('\\nCurl response:');
      console.log(stdout || stderr);
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Test upload failed:', error);
    process.exit(1);
  }
};

testUpload();
