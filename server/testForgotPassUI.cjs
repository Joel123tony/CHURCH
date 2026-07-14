const puppeteer = require('puppeteer');
const { getOTP } = require('./readOTP.cjs');
require('dotenv').config({ path: './server/.env' });

async function runTest(targetEmail, canReadEmail) {
  let browser;
  try {
    console.log(`\n======================================================`);
    console.log(`🚀 Starting REAL E2E Flow for: ${targetEmail}`);
    console.log(`======================================================`);
    
    browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Step 1: Navigate to login
    console.log("🌐 Navigating to login page...");
    await page.goto('http://localhost:5173/admin/login');
    await page.waitForSelector('form');

    // Step 2: Click Forgot Password
    console.log("👆 Clicking 'Forgot Password?'");
    const forgotBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Forgot Password?'));
    });
    await forgotBtn.click();
    
    // Step 3: Enter email and send OTP
    console.log(`📧 Entering registered email (${targetEmail})...`);
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', targetEmail);
    
    console.log("📤 Submitting OTP request...");
    const sendOtpBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Send OTP'));
    });
    await sendOtpBtn.click();

    // Step 4: Wait for OTP generation UI
    console.log("⏳ Waiting for UI to switch to OTP form...");
    await page.waitForFunction(() => {
      const hasOtpField = !!Array.from(document.querySelectorAll('label')).find(l => l.textContent.includes('6-Digit OTP'));
      const errorEl = document.querySelector('.text-red-500');
      const hasError = errorEl && errorEl.textContent.trim().length > 0;
      return hasOtpField || hasError;
    }, { timeout: 15000 });

    const errorMsg = await page.evaluate(() => {
      const err = document.querySelector('.text-red-500');
      return err ? err.textContent : null;
    });

    if (errorMsg) {
      throw new Error(`UI displayed error: ${errorMsg}`);
    }
    console.log("✅ UI switched to OTP reset form successfully.");

    if (!canReadEmail) {
      console.log(`✅ OTP successfully dispatched to ${targetEmail} via real SMTP!`);
      console.log(`⚠️ Cannot automatically read inbox for ${targetEmail} without its app password. Stopping this run here.`);
      return true;
    }

    // Step 5: Read OTP via IMAP
    console.log(`📬 Connecting to Gmail IMAP to read real OTP...`);
    const otp = await getOTP(process.env.SMTP_USER, process.env.SMTP_PASS);
    console.log(`🔑 Retrieved REAL OTP from Gmail Inbox: ${otp}`);

    // Now enter real OTP
    console.log("✍️ Entering REAL OTP...");
    const inputs = await page.$$('input');
    await inputs[0].type(otp);
    await inputs[1].type('realnewpass123');
    await inputs[2].type('realnewpass123');
    
    let resetBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Reset Password'));
    });
    await resetBtn.click();

    console.log("⏳ Waiting for UI to return to login form...");
    await page.waitForFunction(() => {
      return !!Array.from(document.querySelectorAll('button')).find(l => l.textContent.includes('Login to Dashboard'));
    }, { timeout: 10000 });
    console.log("✅ Password Reset Successful in UI.");

    await new Promise(r => setTimeout(r, 1000));

    // Step 6: Test Login with new password
    console.log("🔐 Testing login with new hashed password...");
    await page.evaluate(() => { document.querySelector('input[type="email"]').value = '' });
    await page.type('input[type="email"]', targetEmail);
    
    await page.evaluate(() => { document.querySelector('input[type="password"]').value = '' });
    await page.type('input[type="password"]', 'realnewpass123');
    
    const loginBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Login to Dashboard'));
    });
    await loginBtn.click();

    console.log("⏳ Waiting for dashboard redirect...");
    await page.waitForNavigation({ timeout: 10000 });
    
    const currentUrl = page.url();
    if (currentUrl.includes('/admin/dashboard')) {
      console.log(`🎉 SUCCESS: Logged in and reached dashboard for ${targetEmail}!`);
      return true;
    } else {
      console.log(`❌ FAILED: Did not reach dashboard, current URL is ${currentUrl}`);
      return false;
    }

  } catch (error) {
    console.error(`❌ E2E Test Failed for ${targetEmail}:`, error);
    return false;
  } finally {
    if (browser) await browser.close();
  }
}

async function runAll() {
  const t1 = await runTest('methodistchurch1975@gmail.com', true);
  if (!t1) process.exit(1);

  const t2 = await runTest('1234eruk1637@gmail.com', false);
  if (!t2) process.exit(1);
}

runAll();
