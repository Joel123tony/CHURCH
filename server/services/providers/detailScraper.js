import axios from "axios";
import * as cheerio from "cheerio";

export const scrapeSongDetails = async (url) => {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    const html = response.data;
    const $ = cheerio.load(html);

    let domain = "Generic";
    if (url.includes("tamilchristiansongs.in")) domain = "TamilChristianSongs";
    else if (url.includes("christiankeerthanaisong.com")) domain = "ChristianKeerthanai";
    else if (url.includes("christsquare.com")) domain = "ChristSquare";

    let possibleSelectors = [];
    if (domain === "TamilChristianSongs") {
      possibleSelectors = [".lyrics", ".entry-content", ".post-content", "article"];
    } else if (domain === "ChristianKeerthanai") {
      possibleSelectors = [".entry-content", ".post-content", "article", ".song-lyrics", "#content"];
    } else if (domain === "ChristSquare") {
      possibleSelectors = [".lyrics-content", ".song-content", ".post-content", "main", "article"];
    } else {
      possibleSelectors = [".entry-content", ".post-content", "article .content", "article"];
    }

    // Always fallback to body if all else fails
    possibleSelectors.push("body");

    let finalHtml = "";
    let usedSelector = "";

    for (const sel of possibleSelectors) {
      if ($(sel).length > 0) {
        // Try this selector
        const rawHtml = $(sel).html();
        const cleanHtml = cheerio.load(rawHtml);
        
        // Remove bad tags
        cleanHtml("script, style, iframe, img, aside, nav, footer, header, .sharedaddy, .yarpp, .comments-area, .sidebar, .widget, #comments, .post-navigation, .powerpoint, .download-btn, .addtoany_share_save_container, .entry-meta, .rp4wp-related-posts").remove();

        // Remove elements containing bad text safely (target only likely leaf/small container tags)
        cleanHtml("p, h1, h2, h3, h4, h5, h6, div, span, li, a").each((i, el) => {
          const node = cleanHtml(el);
          const text = node.text().trim().toLowerCase();
          
          if (el.tagName === 'a') {
            const href = (node.attr('href') || '').toLowerCase();
            if (href.includes('ppt') || href.includes('download')) {
              node.remove();
              return;
            }
          }

          // Only remove if this element specifically is mostly just this bad text (avoid deleting huge parent containers)
          // We check if the text length is relatively small (e.g., under 150 chars) to ensure it's a button/link/small blurb, not the main content.
          if (text.length < 150) {
            if (
              text.includes("powerpoint presentation") ||
              text.includes("download ppt") ||
              text.includes("fullscreen") ||
              text.includes("related posts") ||
              text.includes("share this") ||
              text.includes("leave a comment")
            ) {
              node.remove();
            }
          }
        });

        // Clean empty tags
        cleanHtml("p, div, span").each((i, el) => {
          if (!cleanHtml(el).text().trim() && !cleanHtml(el).find('br').length) {
            cleanHtml(el).remove();
          }
        });

        const cleanedText = cleanHtml.text().trim();
        // Validate content length (meaningful lyrics block should be > 50 chars)
        if (cleanedText.length > 50) {
          finalHtml = cleanHtml.html();
          usedSelector = sel;
          console.log(`[Scraper] ${domain}: Success with selector "${sel}"`);
          break;
        } else {
          console.log(`[Scraper] ${domain}: Selector "${sel}" failed validation (length: ${cleanedText.length}). Trying next...`);
        }
      } else {
        console.log(`[Scraper] ${domain}: Selector "${sel}" not found.`);
      }
    }

    if (finalHtml) {
      return finalHtml;
    } else {
      console.log(`[Scraper] ${domain}: All selectors failed.`);
      return "Lyrics not available.";
    }

  } catch (error) {
    console.error(`[Scraper] Error fetching ${url}:`, error.message);
    return "Lyrics not available.";
  }
};
