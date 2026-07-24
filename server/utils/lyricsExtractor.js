import * as cheerio from "cheerio";
import { cleanLyricsWithAI } from "../services/aiLyricsCleaner.js";
import { buildSongPayload, normalizeLyricsText } from "./songNormalization.js";
import { extractAdaptiveLyrics, sanitizeScrapedHtml } from "../services/adaptiveExtractor.js";
import { recordPerf } from "./perfTracker.js";

const cleanTitle = (rawTitle) => {
    let title = rawTitle.replace(/[^\w\s\u0B80-\u0BFF]/g, " ").replace(/\s+/g, " ").trim();
    title = title.replace(/\b(Lyrics|Tamil Christian Song|Christian Song|Song Lyrics|Official Lyrics|Video Song|Song)\b/gi, "").trim();
    title = title.replace(/^[\s|/-]+|[\s|/-]+$/g, "").trim();
    return title || rawTitle;
};

export const normalizeTitle = (title) => {
    if (!title) return "";
    let normalized = title.toLowerCase();
    normalized = normalized.replace(/\b(lyrics|tamil christian song lyrics|tamil christian song|song)\b/gi, "");
    normalized = normalized.replace(/[^\w\s\u0B80-\u0BFF]/g, "");
    return normalized.replace(/\s+/g, " ").trim();
};

export const advancedLyricsCleanup = (text) => {
    if (!text) return "";
    
    // Specifically block listed strings
    const blockedPhrases = [
        "god medias", "tamil christians songs", "tamil christian songs",
        "world tamil christians", "keyboard chords", "song lyrics", 
        "lyrics", "subscribe", "share", "download", "whatsapp", 
        "facebook", "youtube", "telegram", "click here", "chords for",
        "tamil christian worship song", "added to wishlist", "removed from wishlist",
        "christian song lyrics", "tamil christian song lyrics", "christian song in tamil",
        "christian song in english", "other songs from", "related songs", "similar songs",
        "song details", "wishlist", "views", "likes", "downloads", "previous song",
        "next song", "other songs", "breadcrumbs", "save saved removed", "faith score"
    ];
    
    // Remove hashtags
    let processedText = text.replace(/#[\w\u0B80-\u0BFF]+/g, "");

    // Split into lines to evaluate and clean
    const lines = processedText.split('\n');
    const cleanedLines = [];
    
    const truncatePhrases = [
        "other songs", "related songs", "similar songs", "click here to download"
    ];

    for (let line of lines) {
        let lowerLine = line.toLowerCase().trim();
        let skipLine = false;
        
        // Truncate everything after related songs
        if (truncatePhrases.some(phrase => lowerLine.includes(phrase))) {
            break; // Stop processing further lines
        }
        
        // Skip metadata lines
        if (lowerLine.startsWith("artist:") || lowerLine.startsWith("artist ") || lowerLine === "artist" ||
            lowerLine.startsWith("album:") || lowerLine.startsWith("album ") || lowerLine === "album" ||
            lowerLine.startsWith("composer:") || lowerLine.startsWith("composer ") || lowerLine === "composer" ||
            lowerLine.startsWith("music:") || lowerLine.startsWith("music ") || lowerLine === "music" ||
            lowerLine.startsWith("lyrics by:") || lowerLine.startsWith("lyrics by ") || lowerLine === "lyrics by" ||
            lowerLine.startsWith("sung by:") || lowerLine.startsWith("sung by ") || lowerLine === "sung by" ||
            lowerLine.startsWith("song by:") || lowerLine.startsWith("song by ") || lowerLine === "song by") {
            continue;
        }

        // If the entire line is just one of the blocked phrases, drop it completely
        for (const phrase of blockedPhrases) {
            if (lowerLine === phrase || lowerLine.startsWith(phrase + " :") || lowerLine.startsWith(phrase + " -")) {
                skipLine = true;
                break;
            }
        }
        
        // Some plugins put counts like "Save Saved Removed 2"
        if (lowerLine.includes("save saved removed") || lowerLine.includes("faith score") || lowerLine.includes("added to wishlist")) {
            skipLine = true;
        }
        
        if (skipLine) continue;
        
        // Replace phrases within the line
        let tempLine = line;
        for (const phrase of blockedPhrases) {
            const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
            tempLine = tempLine.replace(regex, "");
        }
        
        // Remove attribution patterns
        tempLine = tempLine.replace(/(?:Lyrics|Tune|Music|Sung)\s*(?:&|and)?\s*(?:Lyrics|Tune|Music|Sung)?\s*by[:\s]*[A-Za-z\.\s]+/gi, "");
        
        // Trim leftover noise (including numbers at the end of line left by buttons)
        tempLine = tempLine.replace(/^[\s\-\:]+|[\s\-\:\d]+$/g, "").trim();
        
        if (tempLine.length > 0) {
            cleanedLines.push(tempLine);
        }
    }
    
    // Remove duplicate lyric blocks
    const seenBlocks = new Set();
    const finalLines = [];
    let currentBlock = [];
    
    // Helper to flush current block
    const flushBlock = () => {
        if (currentBlock.length > 0) {
            const blockStr = currentBlock.join('\n').toLowerCase();
            // Optional section headers are allowed, but we don't treat them as unique text for duplication
            // We ignore Verse/Chorus headers when checking for block duplication
            const normalizedBlockStr = blockStr.replace(/^(verse\s*\d+|chorus|bridge|intro|outro|repeat)\s*\n/gi, '').trim();
            
            if (normalizedBlockStr.length > 10) { // Only deduplicate substantial blocks
                if (!seenBlocks.has(normalizedBlockStr)) {
                    seenBlocks.add(normalizedBlockStr);
                    finalLines.push(...currentBlock);
                    finalLines.push(""); // Add spacing
                }
            } else {
                finalLines.push(...currentBlock);
                finalLines.push("");
            }
            currentBlock = [];
        }
    };

    for (let i = 0; i < cleanedLines.length; i++) {
        const line = cleanedLines[i];
        const lowerLine = line.toLowerCase();
        
        // Treat Verse/Chorus/etc as block boundaries, OR if it's the start
        if (lowerLine.match(/^(verse\s*\d+|chorus|bridge|intro|outro|repeat)$/i)) {
            flushBlock();
            currentBlock.push(line);
        } 
        // If we see a big gap in meaning (not easy to detect without AI, so we rely on Verse/Chorus or blank lines if they existed)
        // Since we split by \n and removed blanks, everything is contiguous. Let's just group by 4-6 lines if no headers.
        else {
            currentBlock.push(line);
        }
    }
    flushBlock();
    
    return finalLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

export const isInvalidSongTitle = (title) => {
    if (!title) return false;
    const lowerTitle = title.toLowerCase();
    const invalidKeywords = [
        "top", "latest", "collection", "playlist", "album",
        "archive", "category", "tag", "search", "songs",
        "all songs", "lyrics index", "christmas collection",
        "good friday collection", "download songs",
        "tamil christian song lyrics", "worship medley"
    ];

    for (const keyword of invalidKeywords) {
        if (lowerTitle.includes(keyword)) {
            const regex = new RegExp(`\\b${keyword}\\b`, "i");
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

export const extractLyricsFromHtml = async (html, sourceUrl = "") => {
    const extractionStart = process.hrtime.bigint();
    const sanitizedHtml = sanitizeScrapedHtml(html);
    const $ = cheerio.load(sanitizedHtml);

    let rawTitle = $("h1").first().text().trim() || $("h1.entry-title").first().text().trim();

    if (!rawTitle) {
        rawTitle = $('meta[property="og:title"]').attr("content") || "";
    }

    if (!rawTitle) {
        rawTitle = $("title").first().text().trim();
    }

    if (!rawTitle) {
        const ldJson = $('script[type="application/ld+json"]').html();
        if (ldJson) {
            try {
                const parsed = JSON.parse(ldJson);
                if (parsed && parsed.headline) rawTitle = parsed.headline;
                else if (parsed && parsed.name) rawTitle = parsed.name;
            } catch {
                // Ignore malformed JSON-LD.
            }
        }
    }

    if (!rawTitle && sourceUrl) {
        const parts = sourceUrl.split("/").filter(Boolean);
        if (parts.length > 0) {
            rawTitle = parts[parts.length - 1].replace(/-/g, " ");
        }
    }

    let titleEnglish;
    let titleTamil;

    if (rawTitle.includes("â€“")) {
        const parts = rawTitle.split("â€“");
        titleEnglish = parts[0].replace(/Lyrics/gi, "").trim();
        titleTamil = parts[1].trim();
    } else if (rawTitle.includes("-")) {
        const parts = rawTitle.split("-");
        titleEnglish = parts[0].replace(/Lyrics/gi, "").trim();
        titleTamil = parts[1].trim();
    } else {
        titleTamil = rawTitle;
    }

    titleTamil = cleanTitle(titleTamil);
    if (titleEnglish) titleEnglish = cleanTitle(titleEnglish);

    if (isInvalidSongTitle(titleTamil) || isInvalidSongTitle(titleEnglish)) {
        console.log(`[Extractor] Rejecting due to title: titleTamil="${titleTamil}", titleEnglish="${titleEnglish}", rawTitle="${rawTitle}"`);
        throw new Error("Page title indicates this is a collection, playlist, or archive, not an individual song.");
    }

    if (isMissingTitle(titleTamil) && isMissingTitle(titleEnglish)) {
        throw new Error("Invalid or Missing Title");
    }

    const contentArea = $(".post-inner, .entry-content, .post-content, article, .td-post-content, .content-area, .site-main, main, #contents").first();
    const adaptive = extractAdaptiveLyrics(sanitizedHtml, {
        titleHint: titleTamil || titleEnglish || rawTitle || "",
        sourceUrl
    });

    if (adaptive.isCollectionPage || adaptive.multipleSongSignals) {
        throw new Error("Collection page detected. Refusing to import unrelated song listings.");
    }
    
    const canonicalText = adaptive.blockText || adaptive.lyrics || "";
    if (!contentArea.length && !canonicalText) return null;
    if (!canonicalText) {
        throw new Error("No canonical song block found.");
    }

    const plainText = canonicalText;
    const extractionConfidence = adaptive.confidence || 0;
    
    const extractionEnd = process.hrtime.bigint();
    recordPerf("parsing", Number(extractionEnd - extractionStart) / 1000000);
    
    console.log(`[Lyrics Extractor] Running advanced regex cleanup pipeline for: ${titleTamil || titleEnglish || sourceUrl}`);
    
    const cleaningStart = process.hrtime.bigint();
    const cleanLyrics = advancedLyricsCleanup(normalizeLyricsText(plainText));
    const cleaningEnd = process.hrtime.bigint();
    recordPerf("cleaning", Number(cleaningEnd - cleaningStart) / 1000000);
    
    const resolvedTitle = titleTamil || titleEnglish || rawTitle || "";

    const validationStart = process.hrtime.bigint();
    const lowerLyrics = cleanLyrics.toLowerCase();

    if (lowerLyrics.includes("added to wishlist") || 
        lowerLyrics.includes("tamil christian songs") || 
        lowerLyrics.includes("related songs") || 
        lowerLyrics.includes("share") || 
        lowerLyrics.includes("download") || 
        lowerLyrics.includes("subscribe")) {
        throw new Error("Hard Reject: Contains Wishlist/SEO/Spam after cleanup");
    }
    
    if (isMissingTitle(resolvedTitle)) throw new Error("Hard Reject: Invalid Title");
    if (resolvedTitle.length < 2) throw new Error("Hard Reject: Title too short");

    const lyricsLines = cleanLyrics.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
    if (lyricsLines.length < 2) throw new Error("Hard Reject: Lyrics too short (< 2 lines)");
    if (cleanLyrics.length < 50) throw new Error("Hard Reject: Lyrics too short (< 50 chars)");
    
    const validationEnd = process.hrtime.bigint();
    recordPerf("validation", Number(validationEnd - validationStart) / 1000000);

    console.log(`[Lyrics Extractor] Validation Passed for ${resolvedTitle}`);

    const songRecord = buildSongPayload({
        title: resolvedTitle,
        titleTamil: titleTamil || resolvedTitle,
        titleEnglish: titleEnglish || "",
        lyrics: cleanLyrics,
        originalLyrics: plainText,
        cleanLyrics: cleanLyrics,
        cleanedLyrics: cleanLyrics,
        lyricsEnglish: "", // Will be populated by AI worker
        sourceUrl,
        language: "Tamil",
        aiStatus: "pending",
        aiProvider: "heuristic",
        aiConfidence: extractionConfidence,
        aiProcessedAt: null,
        aiMetadata: {},
        extractionConfidence,
        extractionMode: adaptive.matchedSelector ? "adaptive" : "dom",
        extractionSelectors: adaptive.selectorsTried || [],
        keywords: [],
        themes: [],
        bibleReferences: [],
        author: "",
        composer: "",
        album: "",
        year: "",
        lyricsStatus: "pending", // Important: Set pending so frontend polls while AI cleans
        scrapeStatus: "success",
        status: "completed",
        isPublished: true
    }, {
        sourceUrl,
        category: "Tamil Christian Songs",
        source: "Regex Extractor"
    });

    return [songRecord];
};

export const extractSongsFromHtml = async (html, sourceUrl = "") => {
  const $ = cheerio.load(html);
  const preview = extractAdaptiveLyrics(html, { sourceUrl });
  if (preview.isCollectionPage || preview.multipleSongSignals) {
    throw new Error("Collection page detected. Refusing to split into multiple songs.");
  }

    let extractedSongsArray = [];
    try {
        extractedSongsArray = await extractLyricsFromHtml(html, sourceUrl);
    } catch (e) {
        console.log(`[Extractor Error] ${e.message}`);
        const hardRejectMessages = [
            "AI Rejected Import",
            "AI Detected Multi-Song",
            "Hard Reject",
            "Collection page detected",
            "No canonical song block found",
            "Page title indicates this is a collection"
        ];
        if (hardRejectMessages.some((message) => e.message.includes(message))) {
            throw e;
        }
    }

    if (extractedSongsArray && extractedSongsArray.length > 0) {
        return extractedSongsArray;
    }

    const contentArea = $(".post-inner, .entry-content, .post-content, article, .td-post-content, .content-area, .site-main, main, #contents").first();
    if (!contentArea.length) {
        throw new Error("No content area found for splitting.");
    }

    contentArea.find(".sidebar, .widget, .related-posts, .related-songs, .advertisement, .adsbygoogle, .a-z-index, .category-list, .sharedaddy, .yarpp-related, #comments, .nav-links, .menu, header, footer, .author-box, style, script, .breadcrumb, aside, nav, iframe, .rp4wp-related-posts, .post-tags, .entry-meta, .post-categories, .crp_related, .wpcnt, .page-links, .navigation, .social-share, .addtoany_share_save_container").remove();
    
    // Aggressive DOM removal for noise
    contentArea.find(".wishlist-btn, .wishlist-text, [class*='wishlist'], .song-details, .metadata, .breadcrumbs, [class*='share'], [class*='social'], [id*='related']").remove();

    // Specific noise removal
    contentArea.find("p, div, span, h1, h2, h3, h4, h5, h6").each((i, el) => {
        const text = $(el).text().toLowerCase().trim();
        if (text.startsWith("keyboard chords for") || 
            text.startsWith("chords for") || 
            text.includes("click here to download") ||
            text.includes("added to wishlist") ||
            text.includes("related songs") ||
            text.includes("other songs") ||
            text.includes("download")) {
            $(el).remove();
        }
    });

    const children = contentArea.children();
    let currentTitle = $("h1").first().text().trim() || $("h1.entry-title").first().text().trim();
    let currentHtml = "";
    let songs = [];

    children.each((i, el) => {
        const tag = el.tagName ? el.tagName.toLowerCase() : "";
        const text = $(el).text().trim();

        const isBoundary = tag === "h2" || tag === "h3" || tag === "hr" || (tag === "p" && $(el).find("strong").length > 0 && text.length > 3 && text.length < 60);

        if (isBoundary) {
            if (currentHtml.length > 50) {
                songs.push({ title: currentTitle, html: currentHtml });
            }
            if (tag !== "hr") {
                currentTitle = text;
            } else {
                currentTitle = $("h1").first().text().trim();
            }
            currentHtml = "";
        } else {
            currentHtml += $.html(el) + "\n";
        }
    });

    if (currentHtml.length > 50) {
        songs.push({ title: currentTitle, html: currentHtml });
    }

    if (songs.length > 1) {
        let extractedSongs = [];
        for (const s of songs) {
            try {
                const dummyHtml = `<h1>${s.title}</h1><div class="entry-content">${s.html}</div>`;
                const extracted = await extractLyricsFromHtml(dummyHtml, sourceUrl);
                if (extracted && extracted.length > 0) {
                    extractedSongs.push(...extracted);
                }
            } catch {
                // Ignore segments that fail validation.
            }
        }
        if (extractedSongs.length > 0) {
            return extractedSongs;
        }
    }

    if (extractedSongsArray && extractedSongsArray.length > 0) return extractedSongsArray;
    throw new Error("Failed to extract any valid songs from page after splitting.");
};
