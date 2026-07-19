import * as wtcProvider from "./worldTamilChristians.js";
import * as tcsProvider from "./tamilChristianSongs.js";
import * as tcwProvider from "./tamilChristianWorship.js";
import * as tcProvider from "./tamilChristianCom.js";
import * as ytProvider from "./youtubeDiscovery.js";

// Ordered by priority
export const providers = [
    { name: "World Tamil Christians", provider: wtcProvider, domain: "worldtamilchristians.com" },
    { name: "TamilChristianSongs.in", provider: tcsProvider, domain: "tamilchristiansongs.in" },
    { name: "TamilChristianWorship", provider: tcwProvider, domain: "tamilchristianworship.com" },
    { name: "TamilChristian.com", provider: tcProvider, domain: "tamilchristian.com" },
    { name: "YouTube", provider: ytProvider, domain: "youtube.com" }
];

export const detectProvider = (url) => {
    if (!url) return null;
    const lowerUrl = url.toLowerCase();
    for (const p of providers) {
        if (p.domain && lowerUrl.includes(p.domain)) {
            return p;
        }
    }
    return null;
};

export const searchOnlineSources = async (query) => {
    if (!query || query.length < 3) return null;
    
    console.log(`[AdapterManager] Initiating online search for: "${query}"`);
    
    const searchPromise = (async () => {
        for (const { name, provider } of providers) {
            console.log(`[AdapterManager] Trying source: ${name}...`);
            try {
                const result = await provider.searchSong(query);
                
                if (result && result.lyricsTamil) {
                    console.log(`[AdapterManager] Success found in ${name}!`);
                    return result; 
                }
            } catch (err) {
                console.error(`[AdapterManager] Error in ${name}:`, err.message);
            }
        }
        return null;
    })();

    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ error: 'timeout' }), 8000));
    
    const finalResult = await Promise.race([searchPromise, timeoutPromise]);
    
    if (finalResult && finalResult.error === 'timeout') {
        console.error(`[AdapterManager] Search for "${query}" timed out after 8 seconds.`);
        return null;
    }
    
    if (!finalResult) {
        console.log(`[AdapterManager] Exhausted all sources. No results found for "${query}".`);
    }
    
    return finalResult;
};
