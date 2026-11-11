import { cacheProvider } from "../cache/init.js";
import { AppError } from "../errors/appError.js";

// saved under the key while the first request is still running
const IN_PROGRESS = "in-progress";

const stillRunning = new AppError(
  "a request with this idempotency key is still being processed",
  409,
);

export function idempotency(ttl = 3600) {
  return async (req, res, next) => {
    try {
      const idempotencyKey = req.headers["idempotency-key"];
      if (!idempotencyKey) return next();

      const userId = req.user?.id ?? "anonymous";
      const key = `idempotency:${userId}:${req.method}:${req.originalUrl}:${idempotencyKey}`;

      const claimed = await cacheProvider.setIfAbsent(key, IN_PROGRESS, ttl);
      if (!claimed) {
        const saved = await cacheProvider.get(key);
        if (!saved || saved === IN_PROGRESS) throw stillRunning;
        const { status, body } = JSON.parse(saved);
        res.setHeader("X-Idempotent-Replay", "true");
        return res.status(status).json(body);
      }

      let stored = false;
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          stored = true;
          cacheProvider
            .set(key, JSON.stringify({ status: res.statusCode, body }), ttl)
            .catch(() => {});
        }
        return originalJson(body);
      };
      res.on("close", () => {
        if (!stored) cacheProvider.del(key).catch(() => {});
      });

      next();
    } catch (error) {
      next(error);
    }
  };
}


