// LRU in-memory cache for API optimization
import { perfStorage } from "./perfTracker.js";

const cacheStore = new Map();
const MAX_CACHE_SIZE = 1000;

/**
 * Get an item from the cache.
 * @param {string} key 
 * @param {boolean} allowStale Return data even if it has expired (Stale-While-Revalidate)
 * @returns {any|null} The cached data or null if not found/expired
 */
export const getCached = (key, allowStale = false) => {
  const store = perfStorage.getStore();
  const start = process.hrtime.bigint();
  try {
    const item = cacheStore.get(key);
    if (!item) return null;

    // Check expiration
    if (Date.now() > item.expiresAt) {
      if (allowStale) {
        return item.data;
      }
      cacheStore.delete(key);
      return null;
    }
    
    // LRU behavior: Re-insert to push to the back (most recently used)
    cacheStore.delete(key);
    cacheStore.set(key, item);

    return item.data;
  } finally {
    if (store) {
      const duration = Number(process.hrtime.bigint() - start) / 1e6;
      store.cacheMs += duration;
    }
  }
};

/**
 * Check if cache item is stale/expired or missing.
 * @param {string} key 
 * @returns {boolean} True if cache needs refresh
 */
export const isCacheStale = (key) => {
  const item = cacheStore.get(key);
  if (!item) return true;
  return Date.now() > item.expiresAt;
};

/**
 * Set an item in the cache.
 * @param {string} key 
 * @param {any} data 
 * @param {number} ttlSeconds Time to live in seconds (default 60)
 */
export const setCached = (key, data, ttlSeconds = 60) => {
  const store = perfStorage.getStore();
  const start = process.hrtime.bigint();
  try {
    if (cacheStore.has(key)) {
      cacheStore.delete(key);
    } else if (cacheStore.size >= MAX_CACHE_SIZE) {
      // Evict least recently used (first item in Map)
      const firstKey = cacheStore.keys().next().value;
      cacheStore.delete(firstKey);
    }

    cacheStore.set(key, {
      data,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
  } finally {
    if (store) {
      const duration = Number(process.hrtime.bigint() - start) / 1e6;
      store.cacheMs += duration;
    }
  }
};

/**
 * Clear specific keys by prefix, or clear the entire cache if no prefix provided.
 * @param {string} [keyPrefix] 
 */
export const clearCache = (keyPrefix) => {
  if (!keyPrefix) {
    cacheStore.clear();
    return;
  }
  for (const key of cacheStore.keys()) {
    if (key.startsWith(keyPrefix)) {
      cacheStore.delete(key);
    }
  }
};
