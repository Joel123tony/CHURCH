import axios from "axios";
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { withPerfTimer, recordPerf } from "./perfTracker.js";

puppeteer.use(StealthPlugin());

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

// Helper to generate a somewhat random but realistic user agent
function getRandomUserAgent() {
    const versions = ['122.0.0.0', '121.0.0.0', '120.0.0.0', '119.0.0.0'];
    const v = versions[Math.floor(Math.random() * versions.length)];
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v} Safari/537.36`;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithPuppeteer(url) {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list'
      ],
      ignoreHTTPSErrors: true
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280 + Math.floor(Math.random() * 100), height: 720 + Math.floor(Math.random() * 100) });
    
    // Set extra headers to look like a real browser
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
    });
    
    // Pass webdriver check
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });
    
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Some anti-bot pages require a short wait to solve JS challenges
    await sleep(2000);
    
    const html = await page.content();
    const status = response ? response.status() : 200;
    
    await browser.close();
    
    return {
      status,
      data: html,
      headers: response ? response.headers() : {}
    };
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}

export const resilientFetch = async (url, options = {}) => {
  const {
    maxRetries = 3,
    baseTimeout = 10000,
    backoffMs = 2000,
    headers = {},
    ...axiosOptions
  } = options;

  let attempt = 0;
  let lastError = null;

  while (attempt < maxRetries) {
    try {
      const parsedUrl = new URL(url);
      const host = parsedUrl.host;
      
      const mergedHeaders = {
        "User-Agent": getRandomUserAgent(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "cross-site",
        "Referer": `https://${host}/`,
        ...headers
      };

      const res = await withPerfTimer("htmlDownload", () => client.get(url, {
        ...axiosOptions,
        headers: mergedHeaders,
        timeout: baseTimeout,
        validateStatus: status => status < 500 && status !== 403 
      }));

      return res;
    } catch (error) {
      const isRateLimitOrBlocked = error.response && [403, 429, 503].includes(error.response.status);
      
      if (isRateLimitOrBlocked) {
        console.warn(`[resilientFetch] HTTP 403/503 detected for ${url}. Falling back to Puppeteer...`);
        try {
           const pupRes = await withPerfTimer("htmlDownload", () => fetchWithPuppeteer(url));
           return pupRes;
        } catch (pupError) {
           lastError = pupError;
           console.warn(`[resilientFetch] Puppeteer fallback failed for ${url}: ${pupError.message}`);
        }
      } else {
        lastError = error;
      }

      attempt++;
      if (attempt < maxRetries) {
        const delay = backoffMs * attempt + Math.floor(Math.random() * 1000); 
        await sleep(delay);
      }
    }
  }

  throw new Error(`[resilientFetch] Failed after ${maxRetries} attempts. Last error: ${lastError.message}`, { cause: lastError });
};
