import axios from "axios";
import * as cheerio from "cheerio";

export const searchChristSquare = async (query) => {
  try {
    const searchUrl = query 
      ? `https://www.christsquare.com/search?q=${encodeURIComponent(query)}`
      : `https://www.christsquare.com/`;
    
    const response = await axios.get(searchUrl, {
      timeout: 8000,
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const songs = [];

    // Parse search results based on the site's structure
    // (Assuming generic WordPress or custom search structure)
    $(".search-result, .song-item, article").each((i, el) => {
      const titleTag = $(el).find("h2 a, h3 a, .title a");
      const title = titleTag.text().trim();
      const url = titleTag.attr("href");
      
      const excerpt = $(el).find("p, .lyrics-preview").text().trim();

      if (title && url) {
        let songCategory = "Worship";
        if (title.toLowerCase().includes("traditional") || title.includes("ஆராதனை")) songCategory = "Traditional";
        if (title.toLowerCase().includes("paamalai") || title.includes("பாமலை")) songCategory = "Paamalai";
        if (title.toLowerCase().includes("keerthanai") || title.includes("கீர்த்தனை")) songCategory = "Keerthanai";

        songs.push({
          title,
          lyrics: excerpt,
          category: songCategory,
          language: "Tamil", // Default
          source: "ChristSquare.com",
          url: url.startsWith("http") ? url : `https://www.christsquare.com${url}`,
        });
      }
    });

    return songs;
  } catch (error) {
    console.error("ChristSquare Provider Error:", error.message);
    return [];
  }
};
