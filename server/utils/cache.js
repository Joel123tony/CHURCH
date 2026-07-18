// Simple in-memory cache for API optimization
const cacheStore = new Map();

/**
 * Get an item from the cache.
 * @param {string} key 
 * @returns {any|null} The cached data or null if not found/expired
 */
export const getCached = (key) => {
  const item = cacheStore.get(key);
  if (!item) return null;

  // Check expiration
  if (Date.now() > item.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return item.data;
};

/**
 * Set an item in the cache.
 * @param {string} key 
 * @param {any} data 
 * @param {number} ttlSeconds Time to live in seconds (default 60)
 */
export const setCached = (key, data, ttlSeconds = 60) => {
  cacheStore.set(key, {
    data,
    expiresAt: Date.now() + (ttlSeconds * 1000)
  });
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
