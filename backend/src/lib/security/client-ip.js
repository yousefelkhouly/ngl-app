import crypto from "crypto";
import net from "net";
import { env } from "../config/env.js";

// the frontend's server forwards every request, so to the backend all visitors come from it.
// when PROXY_SECRET is set, the frontend sends the visitor's address in X-Client-IP along with
// the secret; the address is trusted only with the right secret, so a request sent straight to
// the backend can't pick its own rate-limit bucket. without the secret, req.ip (TRUST_PROXY) is used
const expected = env.proxySecret ? Buffer.from(env.proxySecret) : null;

function hasSecret(header) {
  if (!expected || typeof header !== "string") return false;
  const given = Buffer.from(header);
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

export function clientIp(req, res, next) {
  const forwarded = req.headers["x-client-ip"];
  if (hasSecret(req.headers["x-proxy-secret"]) && typeof forwarded === "string" && net.isIP(forwarded)) {
    req.clientIp = forwarded;
  }
  next();
}
