import { env } from "../config/env.js";
import { RedisCacheProvider } from "./../../pkg/cache/redis.js";

export const cacheProvider = new RedisCacheProvider({
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password || "",
});
