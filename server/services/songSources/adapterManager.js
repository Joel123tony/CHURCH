import * as wtcProvider from "./worldTamilChristians.js";
import * as tcsProvider from "./tamilChristianSongs.js";
import * as tcwProvider from "./tamilChristianWorship.js";
import * as tcProvider from "./tamilChristianCom.js";
import * as tgmProvider from "./theGodsMusic.js";
import * as ytProvider from "./youtubeDiscovery.js";
import { getCached, setCached } from "../../utils/cache.js";
import { recordProviderHealth } from "../ai/providerHealth.js";
import { getProviderHealthSnapshot } from "../ai/providerHealth.js";
import { withPerfTimer, recordPerf } from "../../utils/perfTracker.js";

// Ordered by priority
const baseProviders = [
    { name: "World Tamil Christians", provider: wtcProvider, domain: "worldtamilchristians.com" },
    { name: "The God's Music", provider: tgmProvider, domain: "thegodsmusic.com" },
    { name: "TamilChristianSongs.in", provider: tcsProvider, domain: "tamilchristiansongs.in" },
    { name: "TamilChristianWorship", provider: tcwProvider, domain: "tamilchristianworship.com" },
    { name: "TamilChristian.com", provider: tcProvider, domain: "tamilchristian.com" },
    { name: "YouTube", provider: ytProvider, domain: "youtube.com" }
];

export const providers = baseProviders; // Legacy export for backwards compatibility

export const getActiveProviders = async () => {
    try {
        const healthSnapshot = await getProviderHealthSnapshot();
        const healthMap = {};
        healthSnapshot.forEach(h => healthMap[h.provider] = h.healthScore);

        // Filter out completely dead providers (score < 40)
        let active = baseProviders.filter(p => {
            const score = healthMap[p.name] !== undefined ? healthMap[p.name] : 100;
            return score >= 40;
        });

        // Demote weak providers (score < 70) to the back of the queue
        active.sort((a, b) => {
            const scoreA = healthMap[a.name] !== undefined ? healthMap[a.name] : 100;
            const scoreB = healthMap[b.name] !== undefined ? healthMap[b.name] : 100;
            const isWeakA = scoreA < 70;
            const isWeakB = scoreB < 70;
            if (isWeakA && !isWeakB) return 1;
            if (!isWeakA && isWeakB) return -1;
            // Otherwise preserve original base priority index
            return baseProviders.indexOf(a) - baseProviders.indexOf(b);
        });

        return active.length > 0 ? active : baseProviders;
    } catch (e) {
        console.error("[AdapterManager] Error sorting providers by health:", e.message);
        return baseProviders;
    }
};

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

    const cacheKey = `provider_search_${query.toLowerCase().trim()}`;
    const cached = getCached(cacheKey);
    if (cached) {
        return cached;
    }
    
    console.log(`[AdapterManager] Initiating online search for: "${query}"`);
    
    const activeProviders = await getActiveProviders();
    
    // Group providers: Tier 1 (Priority) and Tier 2 (Others)
    const tier1Names = ["World Tamil Christians", "The God's Music"];
    const tier1 = activeProviders.filter(p => tier1Names.includes(p.name));
    const tier2 = activeProviders.filter(p => !tier1Names.includes(p.name));

    // Helper to run a single provider with a strict 3-second timeout
    const fetchFromProvider = async (providerObj) => {
        const { name, provider } = providerObj;
        const start = Date.now();
        console.log(`[AdapterManager] Trying source: ${name}...`);
        
        try {
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("timeout")), 3000)
            );
            
            const searchPromise = withPerfTimer(name, () => provider.searchSong(query), true);
            const result = await Promise.race([searchPromise, timeoutPromise]);
            
            if (result && (result.lyricsTamil || result.lyrics || result.cleanLyrics)) {
                console.log(`[AdapterManager] Success found in ${name}! (${Date.now() - start}ms)`);
                await recordProviderHealth({
                    provider: name,
                    domain: result.sourceUrl || "",
                    success: true,
                    parsed: true,
                    confidence: result.confidenceScore || result.aiConfidence || 0,
                    processingTimeMs: Date.now() - start,
                    missingLyrics: false,
                    missingVerse: false,
                    merged: false,
                    note: `query:${query}`
                });
                return result; 
            }
            
            await recordProviderHealth({
                provider: name,
                domain: result?.sourceUrl || "",
                success: false,
                parsed: true,
                confidence: result?.confidenceScore || 0,
                processingTimeMs: Date.now() - start,
                missingLyrics: true,
                note: `empty result for query:${query}`
            });
            throw new Error("No lyrics found"); // Throw to trigger Promise.any rejection
        } catch (err) {
            console.error(`[AdapterManager] Error/Timeout in ${name}:`, err.message);
            await recordProviderHealth({
                provider: name,
                success: false,
                parsed: false,
                processingTimeMs: Date.now() - start,
                note: err.message
            });
            throw err;
        }
    };

    // Run Tier 1 in parallel and find the best result
    try {
        const results = await Promise.allSettled(tier1.map(fetchFromProvider));
        const successful = results.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
        if (successful.length > 0) {
            // Sort to prefer ones with actual lyrics over just metadata/pending
            successful.sort((a, b) => {
                const aScore = (a.lyricsTamil && a.lyricsTamil !== "pending_fetch") ? 2 : (a.lyricsEnglish ? 1 : 0);
                const bScore = (b.lyricsTamil && b.lyricsTamil !== "pending_fetch") ? 2 : (b.lyricsEnglish ? 1 : 0);
                return bScore - aScore;
            });
            const bestResult = successful[0];
            setCached(cacheKey, bestResult, 60 * 60 * 6);
            return bestResult;
        }
    } catch (e) {
        console.log(`[AdapterManager] Tier 1 providers failed for "${query}". Falling back to Tier 2...`);
    }
    // Run Tier 2 in parallel if Tier 1 failed
    if (tier2.length > 0) {
        try {
            const results = await Promise.allSettled(tier2.map(fetchFromProvider));
            const successful = results.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
            if (successful.length > 0) {
                // Sort similarly
                successful.sort((a, b) => {
                    const aScore = (a.lyricsTamil && a.lyricsTamil !== "pending_fetch") ? 2 : (a.lyricsEnglish ? 1 : 0);
                    const bScore = (b.lyricsTamil && b.lyricsTamil !== "pending_fetch") ? 2 : (b.lyricsEnglish ? 1 : 0);
                    return bScore - aScore;
                });
                const bestResult = successful[0];
                setCached(cacheKey, bestResult, 60 * 60 * 6);
                return bestResult;
            }
        } catch (e) {
            console.log(`[AdapterManager] Tier 2 providers also failed for "${query}".`);
        }
    }
    
    console.log(`[AdapterManager] Exhausted all sources. No results found for "${query}".`);
    return null;
};

export const searchOnlineSourcesAcrossProviders = async (query, maxResults = 3) => {
    if (!query || query.length < 3) return [];

    const cacheKey = `provider_candidates_${query.toLowerCase().trim()}_${maxResults}`;
    const cached = getCached(cacheKey);
    if (cached) {
        return cached;
    }

    const results = [];
    const activeProviders = await getActiveProviders();
    
    let foundHighConfidence = false;
    let currentIndex = 0;
    const CONCURRENCY_LIMIT = 2;

    const worker = async () => {
        while (currentIndex < activeProviders.length && !foundHighConfidence) {
            const { name, provider } = activeProviders[currentIndex++];
            const start = Date.now();
            try {
                const result = await withPerfTimer(name, () => provider.searchSong(query), true);
                if (result && (result.lyricsTamil || result.lyrics || result.cleanLyrics)) {
                    await recordProviderHealth({
                        provider: name,
                        domain: result.sourceUrl || "",
                        success: true,
                        parsed: true,
                        confidence: result.confidenceScore || result.aiConfidence || 0,
                        processingTimeMs: Date.now() - start,
                        note: `candidate query:${query}`
                    });
                    
                    const formattedResult = {
                        ...result,
                        source: result.source || name,
                        provider: name
                    };
                    
                    results.push(formattedResult);
                    
                    // If we found a real text result (not pending_fetch) with high confidence, stop others
                    if (formattedResult.lyricsTamil !== "pending_fetch" && (!formattedResult.confidenceScore || formattedResult.confidenceScore >= 0.85)) {
                        foundHighConfidence = true;
                    }
                } else {
                    await recordProviderHealth({
                        provider: name,
                        success: false,
                        parsed: true,
                        processingTimeMs: Date.now() - start,
                        missingLyrics: true,
                        note: `candidate miss query:${query}`
                    });
                }
            } catch (err) {
                console.error(`[AdapterManager] Candidate search failed in ${name}:`, err.message);
                await recordProviderHealth({
                    provider: name,
                    success: false,
                    parsed: false,
                    processingTimeMs: Date.now() - start,
                    note: err.message
                });
            }
        }
    };

    // Run workers in parallel
    const workers = Array(Math.min(CONCURRENCY_LIMIT, activeProviders.length)).fill(0).map(() => worker());
    await Promise.all(workers);

    // Sort results to prioritize actual text lyrics, then by provider priority, then by confidence
    results.sort((a, b) => {
        const aIsPending = a.lyricsTamil === "pending_fetch" || a.lyrics === "pending_fetch";
        const bIsPending = b.lyricsTamil === "pending_fetch" || b.lyrics === "pending_fetch";
        if (aIsPending && !bIsPending) return 1;
        if (!aIsPending && bIsPending) return -1;
        
        // Find indices in activeProviders
        const aIndex = activeProviders.findIndex(p => p.name === a.provider);
        const bIndex = activeProviders.findIndex(p => p.name === b.provider);
        
        if (aIndex !== bIndex) {
            return aIndex - bIndex; // Lower index (higher priority) comes first
        }
        
        return (b.confidenceScore || 0) - (a.confidenceScore || 0);
    });

    // Limit to maxResults
    const finalResults = results.slice(0, maxResults);

    setCached(cacheKey, finalResults, 1800); // 30 minutes cache for candidates
    return finalResults;
};
