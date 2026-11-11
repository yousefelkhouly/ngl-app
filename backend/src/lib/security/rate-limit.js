import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { AppError } from "../errors/appError.js";
import { toMs } from "../../pkg/utils/time.js";

function limitHandler(req, res, next, options) {
  next(new AppError(options.message, options.statusCode));
}

// the visitor's address as the frontend vouched for it (see client-ip.js), else req.ip.
// ipKeyGenerator groups an IPv6 address with its /56, which one person usually controls
const keyGenerator = (req) => ipKeyGenerator(req.clientIp ?? req.ip);

export const globalLimiter = rateLimit({
  keyGenerator,
  limit: 100,
  windowMs: toMs(15, "minutes"),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: "too many requests, please try again later",
  handler: limitHandler,
});

export function authLimiter() {
  return rateLimit({
    keyGenerator,
    limit: 5,
    windowMs: toMs(3, "minutes"),
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: "too many attempts, please wait 3 minutes and try again",
    handler: limitHandler,
  });
}
