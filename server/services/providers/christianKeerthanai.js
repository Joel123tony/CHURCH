import axios from "axios";
import * as cheerio from "cheerio";

export const searchChristianKeerthanai = async (query, category) => {
  try {
    const searchUrl = query 
      ? `https://christiankeerthanaisong.com/?s=${encodeURIComponent(query)}`
      : `https://christiankeerthanaisong.com/`;
    
    const response = await axios.get(searchUrl, {
      timeout: 8000,
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const songs = [];

    // Their search results
    $(".post, article").each((i, el) => {
      const titleTag = $(el).find(".entry-title a");
      const title = titleTag.text().trim();
      const url = titleTag.attr("href");
      
      const excerpt = $(el).find(".entry-content p, .entry-summary p").text().trim();

      if (title && url) {
        // Derive category based on site name / title
        let songCategory = "Keerthanai";
        if (title.toLowerCase().includes("paamalai")) songCategory = "Paamalai";
        if (title.toLowerCase().includes("traditional")) songCategory = "Traditional";
        
        songs.push({
          title,
          lyrics: excerpt,
          category: songCategory,
          language: "Tamil",
          source: "ChristianKeerthanai.com",
          url,
        });
      }
    });

    return songs;
  } catch (error) {
    console.error("ChristianKeerthanai Provider Error:", error.message);
    return [];
  }
};
