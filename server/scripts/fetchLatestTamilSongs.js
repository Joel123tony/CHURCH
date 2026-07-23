import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import { connectDB } from "../config/db.js";
import Song from "../models/Song.js";
import { extractLyricsFromHtml } from "../utils/lyricsExtractor.js";

const envPath = fs.existsSync(path.join(process.cwd(), ".env"))
  ? path.join(process.cwd(), ".env")
  : path.join(process.cwd(), "..", ".env");
dotenv.config({ path: envPath });

const BASE_CATEGORY_URL = "https://www.worldtamilchristians.com/category/tamil-christians-songs/";
const SOURCE_NAME = "World Tamil Christians";
const STATE_FILE = path.join(process.cwd(), "scripts", "last_scraped_page.json");
const IS_TEST_MODE = process.argv.includes("--test");
const TEST_LIMIT = IS_TEST_MODE ? parseInt(process.argv[process.argv.indexOf("--test") + 1] || "5", 10) : 5;

const delay = () => new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 3000) + 1500));

const loadState = () => {
  if (!fs.existsSync(STATE_FILE)) return 1;
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    return state.page || 1;
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
      return extractLyricsFromHtml(res.data, songUrl);
    } catch {
      if (attempt === retries) return null;
      await delay();
    }
  }
  return null;
}

async function discoverLatestSongs() {
  console.log("Starting Advanced Song Discovery...");
  if (IS_TEST_MODE) console.log(`*** TEST MODE ENABLED (Max ${TEST_LIMIT} songs) ***`);

  let page = loadState();
  let discoveredCount = 0;

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
        if (IS_TEST_MODE && discoveredCount >= TEST_LIMIT) {
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

          const existingByTitle = await Song.findOne({
            $or: [
              { titleTamil: { $regex: new RegExp(`^${data.title}$`, "i") } },
              { title: { $regex: new RegExp(`^${data.title}$`, "i") } }
            ]
          });
          if (existingByTitle) continue;

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

        discoveredCount += 1;
        await delay();
      }

      if (!IS_TEST_MODE) saveState(page + 1);
      page += 1;
      await delay();
    } catch {
      break;
    }
  }

  console.log(`\nScraping complete! Added ${discoveredCount} songs.`);
  process.exit(0);
}

discoverLatestSongs();
