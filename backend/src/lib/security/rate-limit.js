import { rateLimit } from "express-rate-limit";
import { AppError } from "../errors/appError.js";
import { toMs } from "../../pkg/utils/time.js";

function limitHandler(req, res, next, options) {
  next(new AppError(options.message, options.statusCode));
}

export const globalLimiter = rateLimit({
  limit: 100,
  windowMs: toMs(15, "minutes"),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: "too many requests, please try again later",
  handler: limitHandler,
});

export function authLimiter() {
  return rateLimit({
    limit: 5,
    windowMs: toMs(3, "minutes"),
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: "too many attempts, please wait 3 minutes and try again",
    handler: limitHandler,
  });
}
