import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { AppError } from "../errors/appError.js";
import { toMs } from "../../pkg/utils/time.js";

function limitHandler(req, res, next, options) {
  next(new AppError(options.message, options.statusCode));
}

// the visitor's address as the frontend vouched for it (see client-ip.js), else req.ip.
// ipKeyGenerator groups an IPv6 address with its /56, which one person usually controls
const keyGenerator = (req) => ipKeyGenerator(req.clientIp ?? req.ip);

// reads and writes are counted apart. an open chat checks for new messages every few
// seconds (~200 reads in 15 minutes), which used up a shared limit and then locked the
// visitor out of everything, sending included. writes keep a tighter limit: spam is writes
const isRead = (req) => req.method === "GET" || req.method === "HEAD";

const shared = {
  keyGenerator,
  windowMs: toMs(15, "minutes"),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: "too many requests, please try again later",
  handler: limitHandler,
};

// the two keep separate counters: each limiter has its own store
export const readLimiter = rateLimit({
  ...shared,
  identifier: "reads",
  skip: (req) => !isRead(req),
  limit: 1000,
});

export const writeLimiter = rateLimit({
  ...shared,
  identifier: "writes",
  skip: isRead,
  limit: 150,
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
