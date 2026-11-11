import express from "express";
import cookieParser from "cookie-parser";
import { handleError } from "./lib/errors/error-handle.js";
import { router } from "./routes.js";
import { correlationId } from "./pkg/correlation/correlation.js";
import { globalLimiter } from "./lib/security/rate-limit.js";
import { AppError } from "./lib/errors/appError.js";

export function createApp() {
  const app = express();

  // first, so every log line (including rate-limit errors) has a correlation id
  app.use(correlationId);

  app.use(globalLimiter);

  app.use("/uploads", express.static("uploads"));

  // 100kb is express's default, written out so it's a visible decision
  app.use(express.json({ limit: "100kb" }));

  app.use(cookieParser());

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", router);

  // any route that didn't match: a JSON 404 instead of express's HTML page
  app.use((req, res, next) => {
    next(new AppError(`route ${req.method} ${req.originalUrl} not found`, 404));
  });

  app.use(handleError);

  return app;
}
