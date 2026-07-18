import * as cheerio from "cheerio";

const containsTamil = (text) => /[\u0B80-\u0BFF]/.test(text);

const cleanTitle = (rawTitle) => {
    let title = rawTitle.replace(/[a-zA-Z]/g, '')
                        .replace(/[^\u0B80-\u0BFF0-9\s]/g, ' ')
                        .replace(/\s+/g, ' ').trim();
    return title || rawTitle; 
};

const finalValidationFailKeywords = [
    "home", "blog", "faith score", "god medias", "save", "see more"
];

const blacklistKeywords = [
    "home", "blog", "god medias", "save", "saved", "removed", "faith score", 
    "see more", "related", "advertisement", "share", "tags", "category",
    "leave a reply", "song lyrics", "comments", "posted on", "you may also like"
];

const finalStopKeywords = [
    "lyrics in english", "english lyrics", "key takeaways", 
    "estimated reading time", "related songs"
];

export const extractLyricsFromHtml = (html, sourceUrl = "") => {
    const $ = cheerio.load(html);
    
    let rawTitle = $('h1').text().trim() || $('h1.entry-title').text().trim();
    
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
        titleTamil = cleanTitle(rawTitle);
    }

    const contentArea = $('.post-inner, .entry-content, .post-content, article').first();
    if (!contentArea.length) return null;

    // Remove obvious junk containers
    contentArea.find('.sharedaddy, .yarpp-related, #comments, .nav-links, .menu, header, footer, .author-box, style, script, .breadcrumb, aside, nav, iframe, .rp4wp-related-posts').remove();
    
    let rawHtml = contentArea.html() || "";
    rawHtml = rawHtml.replace(/<\/(p|div|h[1-6]|li|ul|ol|table)>/gi, '\n');
    rawHtml = rawHtml.replace(/<br\s*[\/]?>/gi, '\n');
    
    const plainText = cheerio.load(rawHtml).text();
    const splitLines = plainText.split('\n');

    let mode = "PRE_TAMIL"; 
    let tamilLines = [];

    for (let line of splitLines) {
        let originalLine = line.trim();
        
        if (!originalLine) {
            if (mode === "TAMIL" && tamilLines.length > 0 && tamilLines[tamilLines.length-1] !== "") {
                tamilLines.push("");
            }
            continue;
        }

        let lowerLine = originalLine.toLowerCase();
        
        // Hard Stop Detection
        if (finalStopKeywords.some(keyword => lowerLine.includes(keyword))) {
            break; 
        }

        // Blacklist Line Removal
        if (blacklistKeywords.some(keyword => lowerLine.includes(keyword)) || lowerLine.includes('»') || lowerLine.includes('©')) {
            continue;
        }
        
        let cleanedLine = originalLine.replace(/^[\s,.\-()–|:»]+/, '').replace(/[\s,.\-()–|:»]+$/, '').trim();
        if (!cleanedLine) continue;

        let isTamilLine = containsTamil(cleanedLine);

        if (mode === "PRE_TAMIL") {
            if (isTamilLine) {
                mode = "TAMIL"; // Started Tamil lyrics!
            } else {
                continue; // Skip anything before the first Tamil line (e.g. repeated titles, dates)
            }
        }
        
        if (mode === "TAMIL") {
            if (isTamilLine || /^[0-9]+$/.test(cleanedLine)) {
                // Strip stray english text from Tamil line
                let purelyTamil = cleanedLine.replace(/[a-zA-Z]/g, '').replace(/\s+/g, ' ').trim();
                // But preserve numbers like "1."
                if (!purelyTamil && /^[0-9.]+$/.test(cleanedLine)) {
                    purelyTamil = cleanedLine;
                }
                
                if (purelyTamil) {
                   tamilLines.push(purelyTamil);
                }
            }
        }
    }
    
    // Deduplicate consecutive lines
    let dedupTamil = [];
    let prevLine = null;
    let titleLikeCount = 0;
    for (const l of tamilLines) {
        if (l && l === prevLine && titleLikeCount < 4) continue; 
        dedupTamil.push(l);
        if (l) { prevLine = l; titleLikeCount++; }
    }
    
    const finalLyrics = dedupTamil.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    
    if (!finalLyrics || finalLyrics.length < 20) return null;

    // Final Validation
    const lowerLyrics = finalLyrics.toLowerCase();
    for (const badWord of finalValidationFailKeywords) {
        // We match words with boundaries if possible, but includes is safer for fragments like "home »"
        // Since we stripped english letters from lyrics, words like "home" won't be in the finalLyrics string anyway!
        // But if they are, we reject.
        if (lowerLyrics.includes(badWord)) {
            console.log(`[LyricsExtractor] Rejected due to bad word "${badWord}" found in final text.`);
            return null; 
        }
    }

    return { 
        title: rawTitle,
        titleTamil: titleTamil || rawTitle, 
        titleEnglish, 
        lyricsTamil: finalLyrics, 
        lyricsEnglish: "", // We stop before English, so this is blank.
        artist: "",
    };
};
