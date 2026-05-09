// cache.middleware.js
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes default TTL

export const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching for authenticated requests (sensitive data)
    if (req.headers.authorization) {
      return next();
    }

    const key = `__cache__${req.originalUrl}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      res.set('X-Cache', 'HIT');
      return res.status(200).json(cachedResponse);
    }

    // Store original json method
    const originalJson = res.json;

    res.json = function(data) {
      // Cache the response
      cache.set(key, data, duration);
      res.set('X-Cache', 'MISS');
      return originalJson.call(this, data);
    };

    next();
  };
};

export const clearCache = (pattern) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));

  matchingKeys.forEach(key => cache.del(key));
};

export { cache };