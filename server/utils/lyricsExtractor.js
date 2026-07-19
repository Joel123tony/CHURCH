import * as cheerio from "cheerio";
import { cleanLyricsWithAI } from "../services/aiLyricsCleaner.js";

const cleanTitle = (rawTitle) => {
    let title = rawTitle.replace(/[^\w\s\u0B80-\u0BFF]/g, ' ').replace(/\s+/g, ' ').trim();
    // Remove specific suffixes exactly as requested
    title = title.replace(/\b(Lyrics|Tamil Christian Song|Christian Song|Song Lyrics|Official Lyrics|Video Song|Song)\b/gi, '').trim();
    // Clean up any trailing hyphens or pipes left behind
    title = title.replace(/^[\s\-\|]+|[\s\-\|]+$/g, '').trim();
    return title || rawTitle; 
};

export const normalizeTitle = (title) => {
    if (!title) return "";
    let normalized = title.toLowerCase();
    // Remove specific keywords
    normalized = normalized.replace(/\b(lyrics|tamil christian song lyrics|tamil christian song|song)\b/gi, "");
    // Remove punctuation
    normalized = normalized.replace(/[^\w\s\u0B80-\u0BFF]/g, "");
    // Trim and normalize whitespace
    return normalized.replace(/\s+/g, ' ').trim();
};

export const isInvalidSongTitle = (title) => {
    if (!title) return true;
    const lowerTitle = title.toLowerCase();
    const invalidKeywords = [
        "top", "latest", "collection", "playlist", "album", 
        "archive", "category", "tag", "search", "songs", 
        "all songs", "lyrics index", "christmas collection", 
        "good friday collection", "download songs", 
        "tamil christian song lyrics", "worship medley"
    ];

    // If the title is almost entirely an invalid keyword, or contains collection indicators
    for (const keyword of invalidKeywords) {
        if (lowerTitle.includes(keyword)) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(lowerTitle)) {
                return true;
            }
        }
    }
    return false;
};

export const isMissingTitle = (title) => {
    if (!title) return true;
    const lowerTitle = title.toLowerCase().trim();
    const badTitles = [
        "unknown title", "untitled", "no title", "home", 
        "lyrics", "tamil christian songs", "wordpress"
    ];
    return badTitles.includes(lowerTitle);
};


const blacklistRegexes = [
    /^(home|blog|category|categories|tags|author)(\s*[»:\-|/]\s*.*)?$/i,
    /^(previous|next)[\s:»\-|>]+.*$/i,
    /^.*[\s:»\-|<]+(previous|next)$/i,
    /estimated reading time/i,
    /faith score/i,
    /save\s*saved\s*removed/i,
    /^\s*save\s*$/i,
    /^\s*saved\s*$/i,
    /^\s*removed\s*$/i,
    /^see more$/i,
    /^related( songs| posts)?/i,
    /^key takeaways$/i,
    /advertisement/i,
    /^share( this)?(:)?/i,
    /leave a reply/i,
    /^comments?$/i,
    /^posted on/i,
    /^download( now| here| pdf| ppt)?$/i,
    /you may also like/i,
    /^song lyrics$/i,
    /^english lyrics$/i,
    /^tamil lyrics$/i,
    /^lyrics in english$/i
];

export const extractLyricsFromHtml = async (html, sourceUrl = "") => {
    const $ = cheerio.load(html);
    
    // Attempt multiple methods to extract title
    let rawTitle = $('h1').first().text().trim() || $('h1.entry-title').first().text().trim();
    
    if (!rawTitle) {
        rawTitle = $('meta[property="og:title"]').attr('content') || "";
    }
    
    if (!rawTitle) {
        rawTitle = $('title').first().text().trim();
    }
    
    if (!rawTitle) {
        const ldJson = $('script[type="application/ld+json"]').html();
        if (ldJson) {
            try {
                const parsed = JSON.parse(ldJson);
                if (parsed && parsed.headline) rawTitle = parsed.headline;
                else if (parsed && parsed.name) rawTitle = parsed.name;
            } catch (e) {}
        }
    }
    
    if (!rawTitle && sourceUrl) {
        const parts = sourceUrl.split('/').filter(Boolean);
        if (parts.length > 0) {
            rawTitle = parts[parts.length - 1].replace(/-/g, ' ');
        }
    }
    
    let titleEnglish = "";
    let titleTamil = "";
    
    if (rawTitle.includes('–')) {
        const parts = rawTitle.split('–');
        titleEnglish = parts[0].replace(/Lyrics/gi, '').trim();
        titleTamil = parts[1].trim();
    } else if (rawTitle.includes('-')) {
        const parts = rawTitle.split('-');
        titleEnglish = parts[0].replace(/Lyrics/gi, '').trim();
        titleTamil = parts[1].trim();
    } else {
        titleTamil = rawTitle;
    }
    
    titleTamil = cleanTitle(titleTamil);
    if (titleEnglish) titleEnglish = cleanTitle(titleEnglish);

    if (isInvalidSongTitle(titleTamil) || isInvalidSongTitle(titleEnglish)) {
        throw new Error("Page title indicates this is a collection, playlist, or archive, not an individual song.");
    }
    
    if (isMissingTitle(titleTamil) && isMissingTitle(titleEnglish)) {
        throw new Error("Invalid or Missing Title");
    }

    const contentArea = $('.post-inner, .entry-content, .post-content, article, .td-post-content, .site-main, main, #contents').first();
    if (!contentArea.length) return null;

    // Remove obvious junk containers from DOM
    contentArea.find('.sharedaddy, .yarpp-related, #comments, .nav-links, .menu, header, footer, .author-box, style, script, .breadcrumb, aside, nav, iframe, .rp4wp-related-posts, .post-tags, .entry-meta, .post-categories, .crp_related, .wpcnt, .page-links, .navigation, .social-share, .addtoany_share_save_container').remove();
    
    let rawHtml = contentArea.html() || "";
    // Convert block elements to line breaks
    rawHtml = rawHtml.replace(/<\/(p|div|h[1-6]|li|ul|ol|table)>/gi, '\n');
    rawHtml = rawHtml.replace(/<br\s*[\/]?>/gi, '\n');
    
    const plainText = cheerio.load(rawHtml).text();
    
    // --- STRICT AI VALIDATION PIPELINE ---
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is required for strict lyrics extraction.");
    }

    console.log(`[Lyrics Extractor] Running Strict AI Pipeline for: ${titleTamil || titleEnglish || sourceUrl}`);
    const aiResult = await cleanLyricsWithAI(plainText);
    
    if (aiResult.valid === false) {
        if (aiResult.multiSong) {
            throw new Error("AI Detected Multi-Song page.");
        }
        throw new Error(`AI Rejected Import: ${aiResult.reason || "Dirty content or archive page."}`);
    }

    const cleanTitle = aiResult.title || titleTamil;
    const cleanLyrics = (aiResult.lyrics || "").trim();

    // Calculate Lyrics Quality Score
    let score = 100;
    if (aiResult.containsSeo) score -= 30;
    if (aiResult.containsRelatedSongs) score -= 30;
    if (aiResult.containsMetadata) score -= 20;
    if (aiResult.containsChords) score -= 20;
    
    // Check for "Trending" directly in text or AI title/lyrics just in case AI missed it
    const lowerLyrics = cleanLyrics.toLowerCase();
    if (lowerLyrics.includes("trending")) score -= 30;
    if (lowerLyrics.includes("god medias") || lowerLyrics.includes("tamil christians songs")) score -= 30;

    // Hard Validation rules before saving
    if (aiResult.containsRelatedSongs) throw new Error("Hard Reject: Contains Related Songs");
    if (aiResult.containsSeo) throw new Error("Hard Reject: Contains SEO");
    if (aiResult.containsMetadata) throw new Error("Hard Reject: Contains Metadata");
    if (isMissingTitle(cleanTitle)) throw new Error("Hard Reject: Invalid Title");
    if (cleanTitle.length < 2) throw new Error("Hard Reject: Title too short");
    
    const lyricsLines = cleanLyrics.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lyricsLines.length < 2) throw new Error("Hard Reject: Lyrics too short (< 2 lines)");
    if (cleanLyrics.length < 50) throw new Error("Hard Reject: Lyrics too short (< 50 chars)");

    if (score < 90) {
        throw new Error(`Hard Reject: Lyrics Quality Score too low (${score}/100)`);
    }

    console.log(`[Lyrics Extractor] AI Validation Passed. Quality Score: ${score}/100`);

    return [{
        titleTamil: cleanTitle,
        titleEnglish: titleEnglish,
        lyricsTamil: cleanLyrics,
        lyricsEnglish: ""
    }];
};

export const extractSongsFromHtml = async (html, sourceUrl = "") => {
    const $ = cheerio.load(html);
    

    let extractedSongsArray = [];
    try {
        extractedSongsArray = await extractLyricsFromHtml(html, sourceUrl);
    } catch (e) {
        // If it hard rejected, let it pass down or continue
        if (e.message.includes("AI Rejected Import") || e.message.includes("AI Detected Multi-Song")) {
            throw e;
        }
    }
    
    if (extractedSongsArray && extractedSongsArray.length > 0) {
        return extractedSongsArray;
    }

    const contentArea = $('.post-inner, .entry-content, .post-content, article, .td-post-content, .site-main, main, #contents').first();
    if (!contentArea.length) {
        throw new Error("No content area found for splitting.");
    }

    // Remove obvious junk containers before splitting
    contentArea.find('.sharedaddy, .yarpp-related, #comments, .nav-links, .menu, header, footer, .author-box, style, script, .breadcrumb, aside, nav, iframe, .rp4wp-related-posts, .post-tags, .entry-meta, .post-categories, .crp_related, .wpcnt, .page-links, .navigation, .social-share, .addtoany_share_save_container').remove();

    const children = contentArea.children();
    let currentTitle = $('h1').first().text().trim() || $('h1.entry-title').first().text().trim();
    let currentHtml = "";
    let songs = [];
    
    children.each((i, el) => {
        const tag = el.tagName ? el.tagName.toLowerCase() : '';
        const text = $(el).text().trim();
        
        // Boundary condition: heading tags, horizontal rules, or short paragraphs that are bolded (common for titles)
        const isBoundary = tag === 'h2' || tag === 'h3' || tag === 'hr' || (tag === 'p' && $(el).find('strong').length > 0 && text.length > 3 && text.length < 60);
        
        if (isBoundary) {
            // Push previous block if it has enough content
            if (currentHtml.length > 50) {
                songs.push({ title: currentTitle, html: currentHtml });
            }
            if (tag !== 'hr') {
                currentTitle = text;
            } else {
                // If it's an HR, the title might be the next element, so we just clear it for now
                currentTitle = $('h1').first().text().trim(); 
            }
            currentHtml = "";
        } else {
            currentHtml += $.html(el) + '\n';
        }
    });
    
    if (currentHtml.length > 50) {
        songs.push({ title: currentTitle, html: currentHtml });
    }

    if (songs.length > 1) {
        let extractedSongs = [];
        for (let s of songs) {
            try {
                // Reconstruct a mini-HTML document for the extractor
                const dummyHtml = `<h1>${s.title}</h1><div class="entry-content">${s.html}</div>`;
                const extracted = await extractLyricsFromHtml(dummyHtml, sourceUrl);
                if (extracted && extracted.length > 0) {
                    extractedSongs.push(...extracted);
                }
            } catch (e) {
                // Ignore segments that fail validation (e.g. not enough lyrics, invalid titles)
            }
        }
        if (extractedSongs.length > 0) {
            return extractedSongs;
        }
    }
    if (extractedSongsArray && extractedSongsArray.length > 0) return extractedSongsArray;
    throw new Error("Failed to extract any valid songs from page after splitting.");
};
