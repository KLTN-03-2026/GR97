// Simple in-memory cache for development
class Cache {
  constructor() {
    this.cache = new Map();
  }

  set(key, value, ttl = 300000) { // 5 minutes default TTL
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Clean expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const cache = new Cache();

// Cleanup expired entries every 10 minutes
setInterval(() => {
  cache.cleanup();
}, 600000);