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

/**
 * Calculates string similarity between 0 and 1.
 * Uses a basic Levenshtein distance algorithm.
 */
export const calculateSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;
    
    // Normalize both strings heavily for comparison
    const s1 = normalizeTanglish(str1).replace(/\s+/g, '');
    const s2 = normalizeTanglish(str2).replace(/\s+/g, '');
    
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;
    
    const track = Array(s2.length + 1).fill(null).map(() =>
        Array(s1.length + 1).fill(null)
    );
    for (let i = 0; i <= s1.length; i += 1) {
        track[0][i] = i;
    }
    for (let j = 0; j <= s2.length; j += 1) {
        track[j][0] = j;
    }
    for (let j = 1; j <= s2.length; j += 1) {
        for (let i = 1; i <= s1.length; i += 1) {
            const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1,
                track[j - 1][i] + 1,
                track[j - 1][i - 1] + indicator
            );
        }
    }
    const distance = track[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    return maxLength === 0 ? 1.0 : (maxLength - distance) / maxLength;
};
