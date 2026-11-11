import Redis from "ioredis";

export class RedisCacheProvider {
  client;

  constructor(config) {
    const options = { lazyConnect: true, maxLoadingRetryTime: 3 };
    // a URL (hosted Redis) carries host, port, password and, with rediss://, TLS
    this.client = config.url
      ? new Redis(config.url, options)
      : new Redis({ host: config.host, port: config.port, password: config.password, ...options });
    this.client.on("error", (err) => console.log("Redis error", err.message));
    this.client
      .connect()
      .catch((err) => console.log("failed to connect to redis", err.message));
  }
  async set(key, value, ttl) {
    return this.client.set(key, value, "EX", ttl);
  }
  // atomic: true only for the one caller that created the key
  async setIfAbsent(key, value, ttl) {
    return (await this.client.set(key, value, "EX", ttl, "NX")) === "OK";
  }
  async get(key) {
    return this.client.get(key);
  }
  // returns how many of the keys existed
  async del(...keys) {
    return this.client.del(...keys);
  }
  // the set's ttl restarts on every add, so it lives as long as its newest member
  async addToSet(key, member, ttl) {
    await this.client.sadd(key, member);
    await this.client.expire(key, ttl);
  }
  async removeFromSet(key, member) {
    return this.client.srem(key, member);
  }
  async getSet(key) {
    return this.client.smembers(key);
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
