import * as wtcProvider from "./worldTamilChristians.js";
import * as tcsProvider from "./tamilChristianSongs.js";
import * as tcwProvider from "./tamilChristianWorship.js";
import * as tcProvider from "./tamilChristianCom.js";
import * as tgmProvider from "./theGodsMusic.js";
import * as ytProvider from "./youtubeDiscovery.js";
import { getCached, setCached } from "../../utils/cache.js";
import { recordProviderHealth } from "../ai/providerHealth.js";

import { getProviderHealthSnapshot } from "../ai/providerHealth.js";

// Ordered by priority
const baseProviders = [
    { name: "World Tamil Christians", provider: wtcProvider, domain: "worldtamilchristians.com" },
    { name: "TamilChristianSongs.in", provider: tcsProvider, domain: "tamilchristiansongs.in" },
    { name: "TamilChristian.com", provider: tcProvider, domain: "tamilchristian.com" },
    { name: "TamilChristianWorship", provider: tcwProvider, domain: "tamilchristianworship.com" },
    { name: "The God's Music", provider: tgmProvider, domain: "thegodsmusic.com" },
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
    
    const searchPromise = (async () => {
        const activeProviders = await getActiveProviders();
        for (const { name, provider } of activeProviders) {
            console.log(`[AdapterManager] Trying source: ${name}...`);
            const start = Date.now();
            try {
                const result = await provider.searchSong(query);
                
                if (result && result.lyricsTamil) {
                    console.log(`[AdapterManager] Success found in ${name}!`);
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
                    setCached(cacheKey, result, 60 * 60 * 6);
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
            } catch (err) {
                console.error(`[AdapterManager] Error in ${name}:`, err.message);
                await recordProviderHealth({
                    provider: name,
                    success: false,
                    parsed: false,
                    processingTimeMs: Date.now() - start,
                    note: err.message
                });
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
    if (finalResult) setCached(cacheKey, finalResult, 60 * 60 * 6);
    
    return finalResult;
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
    const searchPromises = activeProviders.map(async ({ name, provider }) => {
        const start = Date.now();
        try {
            const result = await provider.searchSong(query);
            if (result && result.lyricsTamil) {
                await recordProviderHealth({
                    provider: name,
                    domain: result.sourceUrl || "",
                    success: true,
                    parsed: true,
                    confidence: result.confidenceScore || result.aiConfidence || 0,
                    processingTimeMs: Date.now() - start,
                    note: `candidate query:${query}`
                });
                return {
                    ...result,
                    source: result.source || name,
                    provider: name
                };
            }
            await recordProviderHealth({
                provider: name,
                success: false,
                parsed: true,
                processingTimeMs: Date.now() - start,
                missingLyrics: true,
                note: `candidate miss query:${query}`
            });
            return null;
        } catch (err) {
            console.error(`[AdapterManager] Candidate search failed in ${name}:`, err.message);
            await recordProviderHealth({
                provider: name,
                success: false,
                parsed: false,
                processingTimeMs: Date.now() - start,
                note: err.message
            });
            return null;
        }
    });

    const settled = await Promise.allSettled(searchPromises);
    for (const outcome of settled) {
        if (outcome.status === 'fulfilled' && outcome.value) {
            results.push(outcome.value);
        }
    }

    // Sort results to prioritize actual text lyrics over 'pending_fetch' (like YouTube transcripts)
    results.sort((a, b) => {
        const aIsPending = a.lyricsTamil === "pending_fetch" || a.lyrics === "pending_fetch";
        const bIsPending = b.lyricsTamil === "pending_fetch" || b.lyrics === "pending_fetch";
        if (aIsPending && !bIsPending) return 1;
        if (!aIsPending && bIsPending) return -1;
        return (b.confidenceScore || 0) - (a.confidenceScore || 0);
    });

    // Limit to maxResults
    const finalResults = results.slice(0, maxResults);

    setCached(cacheKey, finalResults, 60 * 60 * 6);
    return finalResults;
};
