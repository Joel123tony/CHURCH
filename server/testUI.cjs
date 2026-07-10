const puppeteer = require('puppeteer');
const path = require('path');

async function runTests() {
  console.log("Starting Browser UI Tests...");
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER LOG:', msg.text());
  });

  try {
    console.log("Navigating to login...");
    await page.goto('http://localhost:5173/admin/login');
    await page.waitForSelector('input[placeholder="Email"]');
    await page.type('input[placeholder="Email"]', 'admin@church.com');
    await page.type('input[placeholder="Password"]', 'password123');
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const loginBtn = buttons.find(b => b.textContent.includes('Login'));
      if(loginBtn) loginBtn.click();
    });
    
    await page.waitForFunction(() => window.location.pathname.includes('/admin/dashboard'), { timeout: 10000 });
    console.log("Login: PASS");

    console.log("Navigating to Gallery...");
    await page.goto('http://localhost:5173/admin/gallery');
    
    // Check if dropzone exists
    await page.waitForSelector('input[type="file"]', { hidden: true });
    
    // Create a 5MB dummy file just to trigger the upload mechanism
    const fs = require('fs');
    const videoPath = path.resolve(__dirname, 'test_large.mp4');
    
    const inputUploadHandle = await page.$('input[type="file"]');
    if (inputUploadHandle) {
      await inputUploadHandle.uploadFile(videoPath);
      console.log("Uploaded video file via dropzone input...");
      
      // Wait for React to render the button
      await new Promise(r => setTimeout(r, 2000));
      
      const uploadSuccess = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const uploadBtn = buttons.find(b => b.textContent.includes('Upload 1 Media'));
        if(uploadBtn) {
          uploadBtn.click();
          return true;
        }
        return false;
      });
      
      if(uploadSuccess) {
        console.log("Clicked Upload button. Waiting for network response (max 3 minutes)...");
        
        // Wait up to 3 minutes for success or error toast
        await page.waitForSelector('.Toastify__toast', { timeout: 3 * 60 * 1000 });
        const toastText = await page.evaluate(() => document.querySelector('.Toastify__toast').innerText);
        console.log("TOAST MESSAGE:", toastText);
      } else {
        console.log("Failed to find 'Upload 1 Media' button");
      }
    } else {
      console.log("Failed to find input[type=file]");
    }

  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    await browser.close();
  }
}

runTests();
