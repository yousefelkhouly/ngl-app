import jwt from "jsonwebtoken";
import crypto from "crypto";
import { toSeconds } from "../../../pkg/utils/time.js";
import { env } from "../../../lib/config/env.js";

export const ACCESS_TOKEN_TTL = toSeconds(15, "minutes");
export const REFRESH_TOKEN_TTL = toSeconds(7 * 24, "hours");

export function generateAccessToken(payload) {
  return jwt.sign(payload, env.secret.jwt, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function generateRefreshToken(userId) {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ id: userId, jti }, env.secret.jwtRefresh, {
    expiresIn: REFRESH_TOKEN_TTL,
  });
  return { token, jti };
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.secret.jwtRefresh);
}
