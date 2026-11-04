import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../../pkg/logger/logger.js";

// awaited by server.js before it starts listening, so the app never takes
// requests without a database, and a bad MONGODB_URL stops startup with a clear error
export async function connectDb() {
  await mongoose.connect(env.db.url);
  logger.info("connected to mongodb");
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
