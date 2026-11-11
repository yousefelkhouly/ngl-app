import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../../pkg/logger/logger.js";

const ATTEMPTS = 5;
const WAIT_MS = 3000;

// a mongodb+srv:// address needs a DNS lookup first, and a router's DNS sometimes times out
// (querySrv ETIMEOUT): retry a few times instead of crashing on the first blip
export async function connectDb() {
  for (let attempt = 1; ; attempt++) {
    try {
      await mongoose.connect(env.db.url);
      logger.info("connected to mongodb");
      return;
    } catch (error) {
      if (attempt === ATTEMPTS) throw error;
      logger.error(`connecting to mongodb failed (attempt ${attempt} of ${ATTEMPTS}), retrying`, {
        stack: error.stack,
      });
      await new Promise((resolve) => setTimeout(resolve, WAIT_MS));
    }
  }
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
