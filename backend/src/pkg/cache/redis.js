import Redis from "ioredis";

export class RedisCacheProvider {
  client;

  constructor(config) {
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      lazyConnect: true,
      maxLoadingRetryTime: 3,
    });
    this.client.on("error", (err) => console.log("Redis error", err.message));
    this.client
      .connect()
      .catch((err) => console.log("failed to connect to redis", err.message));
  }
  async set(key, value, ttl) {
    return this.client.set(key, value, "EX", ttl);
  }
  async get(key) {
    return this.client.get(key);
  }
  async del(key) {
    return this.client.del(key);
  }
  // adds 1 and returns the new count; the ttl is only set on the first hit,
  // so the window starts at the first attempt and isn't pushed back by later ones
  async incr(key, ttl) {
    const count = await this.client.incr(key);
    if (count === 1) await this.client.expire(key, ttl);
    return count;
  }
  // seconds until the key expires (-2 if it doesn't exist, -1 if it has no expiry)
  async ttl(key) {
    return this.client.ttl(key);
  }
  async quit() {
    return this.client.quit();
  }
}
