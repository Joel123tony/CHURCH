import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import { connectDB } from "../config/db.js";
import Song from "../models/Song.js";

const envPath = fs.existsSync(path.join(process.cwd(), ".env"))
  ? path.join(process.cwd(), ".env")
  : path.join(process.cwd(), "..", ".env");
dotenv.config({ path: envPath });

const BASE_CATEGORY_URL = "https://www.worldtamilchristians.com/category/tamil-christians-songs/";
const SOURCE_NAME = "World Tamil Christians";
const STATE_FILE = path.join(process.cwd(), "scripts", "last_scraped_page.json");
const IS_TEST_MODE = process.argv.includes("--test");
const TEST_LIMIT = IS_TEST_MODE ? parseInt(process.argv[process.argv.indexOf("--test") + 1] || "5", 10) : 5;

const delay = () => new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 3000) + 2000));

const loadState = () => {
  if (!fs.existsSync(STATE_FILE)) return 1;
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")).page || 1;
  } catch {
    return 1;
  }
};

const saveState = (page) => {
  if (!IS_TEST_MODE) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ page }), "utf8");
  }
};

async function fetchSongLyrics(songUrl, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const res = await axios.get(songUrl, { timeout: 15000 });
      const $ = cheerio.load(res.data);
      const contentDiv = $(".post-inner");
      contentDiv.find(".sharedaddy, .yarpp-related, #comments, .nav-links, .menu, header, footer, .author-box, style, script, .breadcrumb").remove();

      let rawHtml = contentDiv.html() || "";
      rawHtml = rawHtml.replace(/<\/(p|div|h[1-6]|li)>/gi, "\n");
      rawHtml = rawHtml.replace(/<br\s*\/?>/gi, "\n");

      const lines = cheerio.load(rawHtml).text().split("\n");
      const lyrics = lines.map((line) => line.replace(/[a-zA-Z]/g, "").trim()).filter(Boolean).join("\n");
      const title = ($("h1").text().trim() || $("h1.entry-title").text().trim() || "Untitled").trim();

      return lyrics ? { title, lyrics } : null;
    } catch {
      if (attempt === retries) return null;
      await delay();
    }
  }
  return null;
}

async function scrapeSongs() {
  console.log("Starting scraper logic test...");
  if (IS_TEST_MODE) console.log(`*** TEST MODE ENABLED (Max ${TEST_LIMIT} songs) ***`);

  let page = loadState();
  let added = 0;

  if (!IS_TEST_MODE) {
    await connectDB();
    console.log("Database connected.");
  }

  while (true) {
    const pageUrl = page === 1 ? BASE_CATEGORY_URL : `${BASE_CATEGORY_URL}page/${page}/`;
    console.log(`\nFetching page ${page}: ${pageUrl}`);

    try {
      const res = await axios.get(pageUrl, { timeout: 15000 });
      const $ = cheerio.load(res.data);
      const songLinks = [];
      $("h2.entry-title a, article a").each((_, el) => {
        const href = $(el).attr("href");
        if (href && !href.includes("/category/") && !songLinks.includes(href)) {
          songLinks.push(href);
        }
      });

      if (!songLinks.length) break;

      for (const url of songLinks) {
        if (IS_TEST_MODE && added >= TEST_LIMIT) {
          console.log("\n--- REACHED TEST LIMIT ---");
          process.exit(0);
        }

        console.log(`\nScraping: ${url}`);
        const data = await fetchSongLyrics(url);
        if (!data?.lyrics) {
          console.log(`No valid Tamil lyrics found for ${url}, skipping.`);
          continue;
        }

        if (IS_TEST_MODE) {
          console.log(`TITLE:\n${data.title}`);
          console.log(`LYRICS PREVIEW:\n${data.lyrics.split("\n").slice(0, 10).join("\n")}`);
        } else {
          const existingByUrl = await Song.findOne({ url });
          if (existingByUrl) continue;

          await Song.create({
            title: data.title,
            lyrics: data.lyrics,
            language: "Tamil",
            category: "Tamil Christian Songs",
            source: SOURCE_NAME,
            url,
            sourceUrl: url,
            scrapeStatus: "success",
            lyricsLength: data.lyrics.length,
            importedAt: new Date()
          });
          console.log(`SUCCESS: Added "${data.title}"`);
        }

        added += 1;
        await delay();
      }

      if (!IS_TEST_MODE) saveState(page + 1);
      page += 1;
      await delay();
    } catch {
      break;
    }
  }

  console.log(`\nScraping complete! Added ${added} new songs.`);
  process.exit(0);
}

scrapeSongs();
