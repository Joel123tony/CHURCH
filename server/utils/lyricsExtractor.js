import * as cheerio from "cheerio";

const cleanTitle = (rawTitle) => {
    let title = rawTitle.replace(/[^\w\s\u0B80-\u0BFF]/g, ' ')
                        .replace(/\s+/g, ' ').trim();
    return title || rawTitle; 
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

export const extractLyricsFromHtml = (html, sourceUrl = "") => {
    const $ = cheerio.load(html);
    
    let rawTitle = $('h1').first().text().trim() || $('h1.entry-title').first().text().trim();
    
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

    const contentArea = $('.post-inner, .entry-content, .post-content, article, .td-post-content, .site-main, main, #contents').first();
    if (!contentArea.length) return null;

    // Remove obvious junk containers from DOM
    contentArea.find('.sharedaddy, .yarpp-related, #comments, .nav-links, .menu, header, footer, .author-box, style, script, .breadcrumb, aside, nav, iframe, .rp4wp-related-posts, .post-tags, .entry-meta, .post-categories, .crp_related, .wpcnt, .page-links, .navigation, .social-share, .addtoany_share_save_container').remove();
    
    let rawHtml = contentArea.html() || "";
    // Convert block elements to line breaks
    rawHtml = rawHtml.replace(/<\/(p|div|h[1-6]|li|ul|ol|table)>/gi, '\n');
    rawHtml = rawHtml.replace(/<br\s*[\/]?>/gi, '\n');
    
    const plainText = cheerio.load(rawHtml).text();
    const splitLines = plainText.split('\n');

    let validLines = [];

    for (let line of splitLines) {
        let originalLine = line.trim();
        
        if (!originalLine) {
            validLines.push("");
            continue;
        }

        // Remove leading/trailing punctuation (like », -, |)
        let cleanedLine = originalLine.replace(/^[\s,.\-()–|:»>]+/, '').replace(/[\s,.\-()–|:»<]+$/, '').trim();
        if (!cleanedLine) continue;

        // Check against blacklist
        let isBlacklisted = blacklistRegexes.some(regex => regex.test(cleanedLine));
        if (isBlacklisted) continue;

        // Check for standalone numbers (matches lines with ONLY numbers and punctuation)
        if (/^[\d\s.,()[\]{}]+$/.test(cleanedLine)) {
            continue;
        }

        // If it survived, it's a valid lyric line (Tamil or English transliteration)
        validLines.push(cleanedLine);
    }
    
    // Normalize blank lines: convert 3+ blank lines to 1 blank line, trim edges
    let text = validLines.join('\n');
    text = text.replace(/\n{3,}/g, '\n\n').trim();

    // Deduplicate the same line appearing consecutively more than twice
    const lines = text.split('\n');
    let dedupLines = [];
    let prevLine = null;
    let consecutiveCount = 0;
    
    for (const l of lines) {
        if (l && l === prevLine) {
            consecutiveCount++;
            if (consecutiveCount >= 3) continue; // skip if repeated 3+ times consecutively
        } else {
            consecutiveCount = 0;
        }
        dedupLines.push(l);
        if (l) prevLine = l;
    }

    const finalLyrics = dedupLines.join('\n').trim();

    if (!finalLyrics) {
        throw new Error("No lyrics detected");
    }

    const meaningfulLinesCount = dedupLines.filter(l => l.trim().length > 0).length;
    
    if (meaningfulLinesCount < 2) {
        throw new Error("Too few lyric lines (minimum 2 required)");
    }

    return { 
        title: rawTitle,
        titleTamil: titleTamil || rawTitle, 
        titleEnglish, 
        lyricsTamil: finalLyrics, 
        lyricsEnglish: "", // We preserve English lines inline in lyricsTamil now, or it could be split if needed.
        artist: "",
    };
};
