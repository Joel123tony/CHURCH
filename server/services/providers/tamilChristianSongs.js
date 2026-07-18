import axios from "axios";
import * as cheerio from "cheerio";

export const searchTamilChristianSongs = async (query, category) => {
  try {
    // If category is strict Keerthanai/Paamalai and this provider doesn't match perfectly, we can still search
    // But tamilchristiansongs.in has a variety of songs. We'll mark them as "Worship" by default 
    // unless the title implies something else.
    
    const searchUrl = query 
      ? `https://tamilchristiansongs.in/tamil/?s=${encodeURIComponent(query)}` 
      : `https://tamilchristiansongs.in/tamil/lyrics/`;
    
    const response = await axios.get(searchUrl, {
      timeout: 4000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const songs = [];

    if (query) {
      // Parse search results (has <article>)
      $("article").each((i, el) => {
        const titleTag = $(el).find(".entry-title a");
        const title = titleTag.text().trim();
        const url = titleTag.attr("href");
        const excerpt = $(el).find(".entry-summary p").text().trim();

        if (title && url && url.includes("/tamil/lyrics/")) {
          songs.push({
            title,
            lyrics: excerpt,
            category: "Worship",
            language: "Tamil",
            source: "TamilChristianSongs.in",
            url,
          });
        }
      });
    } else {
      // Parse homepage (just a lists)
      $("a").each((i, el) => {
        const title = $(el).text().trim();
        const url = $(el).attr("href");

        if (title && url && url.includes("/tamil/lyrics/") && title.length > 2 && title !== "பாடல் வரிகள்" && title !== "Lyrics") {
          songs.push({
            title,
            lyrics: "Lyrics preview not available.",
            category: "Worship",
            language: "Tamil",
            source: "TamilChristianSongs.in",
            url,
          });
        }
      });
    }

    return songs;
  } catch (error) {
    console.error("TamilChristianSongs Provider Error:", error.message);
    return [];
  }
};
