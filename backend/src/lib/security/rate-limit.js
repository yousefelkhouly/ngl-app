import { rateLimit } from "express-rate-limit";
import { AppError } from "../errors/appError.js";
import { toMs } from "../../pkg/utils/time.js";

// the 4th argument holds the limiter's own options (message, statusCode...)
function limitHandler(req, res, next, options) {
  next(new AppError(options.message, options.statusCode));
}

// every route: generous, only stops scripts flooding the server
export const globalLimiter = rateLimit({
  limit: 100,
  windowMs: toMs(15, "minutes"),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: "too many requests, please try again later",
  handler: limitHandler,
});

// login and every route that sends an email or checks a code:
// strict, against password guessing, code guessing and email spam.
// a function so each route gets its own counter: register + verify + login
// in a row shouldn't share the same 5 tries
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
