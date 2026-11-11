import { cacheProvider } from "./init.js";

export function withCache(ttl = 3600) {
  return async (req, res, next) => {
    const key = `cache:${req.method}:${req.originalUrl}`;

    const cachedData = await cacheProvider.get(key);
    if (cachedData) {
      res.setHeader("X-Cache", "HIT");
      return res.json(JSON.parse(cachedData));
    }

    const originalJson = res.json.bind(res);

    res.json = (body) => {
      res.setHeader("X-Cache", "MISS");
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // saving happens in the background, the response doesn't wait for redis
        cacheProvider.set(key, JSON.stringify(body), ttl).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
}
