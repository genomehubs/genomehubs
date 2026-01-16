/**
 * In-memory cache for metadata (taxonomies, resultFields).
 * This provides fast access to frequently-needed metadata without requiring Redis.
 * Data is refreshed periodically or on demand.
 */

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

class MetadataCache {
  constructor() {
    this.store = new Map();
    this.timers = new Map();
    this.refreshTimers = new Map();
  }

  /**
   * Get cached data or compute it if not cached or expired
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Async function to fetch fresh data
   * @param {number} ttl - Time to live in milliseconds
   * @param {boolean} autoRefresh - Whether to auto-refresh before expiry
   * @returns {Promise<any>} Cached or fresh data
   */
  async get(key, fetchFn, ttl = DEFAULT_TTL, autoRefresh = true) {
    const cached = this.store.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    // Data is missing or expired - fetch fresh
    let freshData;
    try {
      freshData = await fetchFn();
    } catch (error) {
      // If fetch fails and we have stale data, return it
      if (cached) {
        return cached.data;
      }
      throw error;
    }

    this.set(key, freshData, ttl, autoRefresh);
    return freshData;
  }

  /**
   * Set cached data with optional auto-refresh
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds
   * @param {boolean} autoRefresh - Whether to auto-refresh before expiry
   */
  set(key, data, ttl = DEFAULT_TTL, autoRefresh = true) {
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Store data with expiry time
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });

    // Set expiry timer to remove from cache
    const timer = setTimeout(() => {
      this.store.delete(key);
      this.timers.delete(key);
    }, ttl);

    this.timers.set(key, timer);

    // Set up auto-refresh if enabled
    if (autoRefresh && this.refreshTimers.has(key)) {
      clearTimeout(this.refreshTimers.get(key));
    }
  }

  /**
   * Clear specific cache entry
   * @param {string} key - Cache key to clear
   */
  clear(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    if (this.refreshTimers.has(key)) {
      clearTimeout(this.refreshTimers.get(key));
      this.refreshTimers.delete(key);
    }
    this.store.delete(key);
  }

  /**
   * Clear all cached data
   */
  clearAll() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    for (const timer of this.refreshTimers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.refreshTimers.clear();
    this.store.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    return {
      entries: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }
}

export const metadataCache = new MetadataCache();
