import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { env } from "./lib/config/env.js";
import { handleError } from "./lib/errors/error-handle.js";
import { router } from "./routes.js";
import { correlationId } from "./pkg/correlation/correlation.js";
import { globalLimiter } from "./lib/security/rate-limit.js";
import { AppError } from "./lib/errors/appError.js";
import { UPLOADS_DIR } from "./pkg/media/multer.js";

export function createApp() {
  const app = express();

  // behind a proxy, req.ip would otherwise be the proxy's ip for every user,
  // and they would all share one rate limit
  app.set("trust proxy", env.trustProxy);

  // first, so every log line (including rate-limit errors) has a correlation id
  app.use(correlationId);

  // before the rate limiter, so its 429s also carry CORS headers and the frontend can read them.
  // credentials: the browser only sends the auth cookies when this is on
  app.use(cors({ origin: env.clientUrls, credentials: true }));

  app.use(globalLimiter);

  // nosniff: the browser uses the content-type from the extension
  // instead of guessing one from the file's bytes
  app.use(
    "/uploads",
    express.static(UPLOADS_DIR, {
      setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
    }),
  );

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
