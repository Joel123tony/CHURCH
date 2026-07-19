/**
 * Normalizes Tanglish spellings to a standard phonetic mapping.
 * Example: 'yesu', 'yeshu', 'iyesu' -> 'iyesu'
 */
export const normalizeTanglish = (text) => {
    if (!text) return "";
    let normalized = text.toLowerCase();
    
    // Normalize Yesu permutations
    normalized = normalized.replace(/\b(yesu|yeshu|iyesu|yeshua)\b/g, "iyesu");
    
    // Normalize Devan permutations
    normalized = normalized.replace(/\b(devan|thevan|dhevan)\b/g, "thevan");

    // Normalize Karthar permutations
    normalized = normalized.replace(/\b(karthar|kartar|karththar)\b/g, "karthar");

    // General phonetics
    normalized = normalized.replace(/sh/g, "s");
    normalized = normalized.replace(/zh/g, "l"); // Tamil 'zh' often searched as 'l'
    normalized = normalized.replace(/dh/g, "th");
    
    // Remove non-alphanumeric chars for indexing
    normalized = normalized.replace(/[^\w\s\u0B80-\u0BFF]/g, "");
    
    return normalized.trim();
};
