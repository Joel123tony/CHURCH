import * as cheerio from "cheerio";
import { cleanLyricsWithAI } from "../services/aiLyricsCleaner.js";
import { buildSongPayload, normalizeLyricsText } from "./songNormalization.js";
import { extractAdaptiveLyrics, sanitizeScrapedHtml } from "../services/adaptiveExtractor.js";

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

export const removeProviderBranding = (text) => {
    if (!text) return "";
    
    // Specifically block listed strings
    const blockedPhrases = [
        "god medias", "tamil christians songs", "tamil christian songs",
        "world tamil christians", "keyboard chords", "song lyrics", 
        "lyrics", "subscribe", "share", "download", "whatsapp", 
        "facebook", "youtube", "telegram", "click here", "chords for",
        "tamil christian worship song"
    ];
    
    // Split into lines to evaluate and clean
    const lines = text.split('\n');
    const cleanedLines = [];
    
    for (let line of lines) {
        let lowerLine = line.toLowerCase().trim();
        let skipLine = false;
        
        // If the entire line is just one of the blocked phrases, drop it completely
        for (const phrase of blockedPhrases) {
            if (lowerLine === phrase || lowerLine.startsWith(phrase + " :") || lowerLine.startsWith(phrase + " -")) {
                skipLine = true;
                break;
            }
        }
        
        if (skipLine) continue;
        
        // Otherwise, just replace the phrases within the line
        let tempLine = line;
        for (const phrase of blockedPhrases) {
            const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
            tempLine = tempLine.replace(regex, "");
        }
        
        // Also remove attribution patterns like "Lyrics & Tune by Pr. Beviston"
        tempLine = tempLine.replace(/(?:Lyrics|Tune|Music|Sung)\s*(?:&|and)?\s*(?:Lyrics|Tune|Music|Sung)?\s*by[:\s]*[A-Za-z\.\s]+/gi, "");
        
        // Trim any leftover dashes or colons at the start/end
        tempLine = tempLine.replace(/^[\s\-\:]+|[\s\-\:]+$/g, "").trim();
        
        if (tempLine.length > 0) {
            cleanedLines.push(tempLine);
        }
    }
    
    return cleanedLines.join('\n');
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

    contentArea.find(".sidebar, .widget, .related-posts, .related-songs, .advertisement, .adsbygoogle, .a-z-index, .category-list, .sharedaddy, .yarpp-related, #comments, .nav-links, .menu, header, footer, .author-box, style, script, .breadcrumb, aside, nav, iframe, .rp4wp-related-posts, .post-tags, .entry-meta, .post-categories, .crp_related, .wpcnt, .page-links, .navigation, .social-share, .addtoany_share_save_container").remove();
    
    // TGM specific noise removal
    contentArea.find("p, div, span").each((i, el) => {
        const text = $(el).text().toLowerCase().trim();
        if (text.startsWith("keyboard chords for") || text.startsWith("chords for") || text.includes("click here to download")) {
            $(el).remove();
        }
    });

    const plainText = canonicalText;
    const extractionConfidence = adaptive.confidence || 0;
    console.log("=== PLAINTEXT SENT TO AI ===");
    console.log(plainText.substring(0, 500));
    console.log("============================");

    console.log(`[Lyrics Extractor] Running cleanup pipeline for: ${titleTamil || titleEnglish || sourceUrl}`);
    const aiResult = await cleanLyricsWithAI(plainText, {
        title: titleTamil || titleEnglish || rawTitle || "",
        titleTamil,
        titleEnglish,
        sourceUrl,
        extractedFrom: adaptive.matchedSelector ? "canonical-block" : "canonical-text",
        extractionConfidence,
        extractionSelectors: adaptive.selectorsTried || [],
        extractionMode: adaptive.matchedSelector ? "adaptive" : "canonical",
        extractionBlockSelector: adaptive.matchedSelector || ""
    });

    if (aiResult.valid === false && !aiResult.multiSong) {
        throw new Error(`AI Rejected Import: ${aiResult.reason || "Dirty content or archive page."}`);
    }

    const resolvedTitle = aiResult.title || titleTamil || titleEnglish;
    const cleanLyrics = removeProviderBranding(normalizeLyricsText(aiResult.lyrics || ""));

    let score = 100;
    if (aiResult.containsSeo) score -= 30;
    if (aiResult.containsRelatedSongs) score -= 30;
    if (aiResult.containsMetadata) score -= 20;
    if (aiResult.containsChords) score -= 20;

    const lowerLyrics = cleanLyrics.toLowerCase();
    if (lowerLyrics.includes("trending")) score -= 30;
    if (lowerLyrics.includes("god medias") || lowerLyrics.includes("tamil christians songs")) score -= 30;

    if (aiResult.containsRelatedSongs) throw new Error("Hard Reject: Contains Related Songs");
    if (aiResult.containsSeo) throw new Error("Hard Reject: Contains SEO");
    if (aiResult.containsMetadata) throw new Error("Hard Reject: Contains Metadata");
    if (isMissingTitle(resolvedTitle)) throw new Error("Hard Reject: Invalid Title");
    if (resolvedTitle.length < 2) throw new Error("Hard Reject: Title too short");

    const lyricsLines = cleanLyrics.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
    if (lyricsLines.length < 2) throw new Error("Hard Reject: Lyrics too short (< 2 lines)");
    if (cleanLyrics.length < 50) throw new Error("Hard Reject: Lyrics too short (< 50 chars)");

    if (score < 90) {
        throw new Error(`Hard Reject: Lyrics Quality Score too low (${score}/100)`);
    }

    console.log(`[Lyrics Extractor] AI Validation Passed. Quality Score: ${score}/100`);

    const songRecord = buildSongPayload({
        title: resolvedTitle,
        titleTamil: resolvedTitle,
        titleEnglish: aiResult.alternateTitle || titleEnglish,
        lyrics: cleanLyrics,
        originalLyrics: aiResult.originalLyrics || plainText,
        cleanLyrics,
        cleanedLyrics: cleanLyrics,
        lyricsEnglish: aiResult.language === "English" ? cleanLyrics : "",
        sourceUrl,
        language: aiResult.language || "Tamil",
        aiStatus: aiResult.aiStatus || (aiResult.aiUsed ? "processed" : "fallback"),
        aiProvider: aiResult.aiProvider || (aiResult.aiUsed ? "gemini" : "heuristic"),
        aiConfidence: aiResult.confidenceScore || 0,
        aiProcessedAt: aiResult.aiProcessedAt || null,
        aiMetadata: aiResult.metadata || {},
        extractionConfidence,
        extractionMode: adaptive.matchedSelector ? "adaptive" : "dom",
        extractionSelectors: adaptive.selectorsTried || [],
        keywords: aiResult.tags || [],
        themes: aiResult.themes || [],
        bibleReferences: aiResult.scriptureReferences || [],
        author: aiResult.author || "",
        composer: aiResult.composer || "",
        album: aiResult.album || "",
        year: aiResult.year || "",
        lyricsStatus: "found",
        scrapeStatus: "success",
        status: "completed",
        isPublished: true
    }, {
        sourceUrl,
        category: "Tamil Christian Songs",
        source: aiResult.aiProvider || "Unknown"
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
    
    contentArea.find("p, div, span").each((i, el) => {
        const text = $(el).text().toLowerCase().trim();
        if (text.startsWith("keyboard chords for") || text.startsWith("chords for") || text.includes("click here to download")) {
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
