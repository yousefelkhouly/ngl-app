import { cacheProvider } from "../cache/init.js";

// when a client retries a request with the same Idempotency-Key header,
// it gets the first response back instead of the action running twice.
// put it after guard so the key is per user
export function idempotency(ttl = 3600) {
  return async (req, res, next) => {
    const idempotencyKey = req.headers["idempotency-key"];
    // no header: nothing to dedupe, run the request normally
    if (!idempotencyKey) return next();

    const userId = req.user?.id ?? "anonymous";
    const key = `idempotency:${userId}:${req.method}:${req.originalUrl}:${idempotencyKey}`;

    const cachedData = await cacheProvider.get(key);
    if (cachedData) {
      res.setHeader("X-Idempotent-Replay", "true");
      return res.json(JSON.parse(cachedData));
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheProvider.set(key, JSON.stringify(body), ttl).catch(() => {});
      }
      // always send the response, errors included
      return originalJson(body);
    };
    next();
  };
}
