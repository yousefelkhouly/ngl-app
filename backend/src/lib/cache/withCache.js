import { cacheProvider } from "./init.js";

// caches successful GET responses for `ttl` seconds.
// only use it on public routes: the key is the URL, so every user gets the same answer
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
