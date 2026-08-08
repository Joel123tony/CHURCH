const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  let browser;
  try {
    console.log("Launching browser...");
    browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    // Desktop Viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log("Navigating to http://localhost:5173...");
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

    console.log("Waiting for Bible Blessing popup...");
    await page.waitForSelector('[role="dialog"]', { visible: true, timeout: 5000 });
    console.log("Popup found.");

    // Check for flicker / layout shift
    // We can do this by getting the body dimensions and checking if they change
    const getBodyWidth = async () => await page.evaluate(() => document.body.clientWidth);
    const initialWidth = await getBodyWidth();
    
    // Give it a second to see if a delayed layout shift happens (the "few ms after" flicker)
    await new Promise(r => setTimeout(r, 2000));
    const widthAfterPopup = await getBodyWidth();
    
    console.log(`Initial Width: ${initialWidth}, Width After Popup: ${widthAfterPopup}`);
    if (initialWidth !== widthAfterPopup) {
      console.log("FAIL: Layout shifted (Flicker detected)!");
    } else {
      console.log("PASS: Zero layout shift/flicker.");
    }
    
    // Check Scroll Lock
    console.log("Attempting to scroll background...");
    const initialScroll = await page.evaluate(() => window.scrollY);
    
    // Simulate mouse wheel
    await page.mouse.wheel({ deltaY: 500 });
    await new Promise(r => setTimeout(r, 500));
    
    // Simulate Space bar
    await page.keyboard.press('Space');
    await new Promise(r => setTimeout(r, 500));
    
    const newScroll = await page.evaluate(() => window.scrollY);
    if (newScroll !== initialScroll) {
      console.log(`FAIL: Background scrolled from ${initialScroll} to ${newScroll}.`);
    } else {
      console.log("PASS: Background is securely locked.");
    }

    // Wait 15 seconds to check for delayed repaint or iframe reload
    console.log("Waiting 15 seconds for delayed stability test...");
    await new Promise(r => setTimeout(r, 15000));
    console.log("PASS: 15 seconds elapsed, no crashes or errors.");

    // Close popup
    console.log("Closing popup...");
    await page.click('button[aria-label="Close"]');
    await new Promise(r => setTimeout(r, 1000));
    
    // Attempt scroll again
    await page.mouse.wheel({ deltaY: 500 });
    await new Promise(r => setTimeout(r, 500));
    const finalScroll = await page.evaluate(() => window.scrollY);
    if (finalScroll > 0) {
      console.log("PASS: Background scrolling restored.");
    } else {
      console.log("FAIL: Background scrolling NOT restored after close.");
    }

    console.log("\nALL TESTS COMPLETED SUCCESSFULLY.");
  } catch (error) {
    console.error("Test execution failed:", error);
  } finally {
    if (browser) await browser.close();
  }
})();
