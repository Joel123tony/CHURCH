import axios from "axios";
import * as cheerio from "cheerio";

async function run() {
  try {
    const indexRes = await axios.get("http://tamilchristianworship.com/newpraiselinks.html", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const $ = cheerio.load(indexRes.data);
    const links = [];
    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (href && href.endsWith(".html") && !href.includes("newpraiselinks")) {
        links.push(href);
      }
    });

    console.log("Found", links.length, "song links.");

    if (links[0]) {
      const songUrl = `http://tamilchristianworship.com/${links[0]}`;
      const songRes = await axios.get(songUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
      const song$ = cheerio.load(songRes.data);
      console.log("\n--- Extracting Lyrics ---");
      console.log(song$("body").text().length);
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

run();
