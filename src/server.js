import http from "http";
import { createApp } from "./app.js";
import { env } from "./lib/config/env.js";
import { connectDb, disconnectDb } from "./lib/db/mongoose.js";
import { cacheProvider } from "./lib/cache/init.js";
import { logger } from "./pkg/logger/logger.js";

async function start() {
  await connectDb();

  const server = http.createServer(createApp());
  server.listen(env.port, () =>
    logger.info(`app is running at port ${env.port}`),
  );

  // stop taking new requests, let open ones finish, then close connections
  async function shutdown(signal) {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDb();
      await cacheProvider.quit();
      process.exit(0);
    });
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((error) => {
  logger.error("failed to start the server", { stack: error.stack });
  process.exit(1);
});
