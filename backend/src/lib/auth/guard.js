import jwt from "jsonwebtoken";
import { AppError } from "../errors/appError.js";
import { env } from "../config/env.js";

export function guard(req, res, next) {
  try {
    const token = req.cookies.access_token;
    if (!token) throw new AppError("no token provided", 401);
    req.user = jwt.verify(token, env.secret.jwt);
    next();
  } catch (error) {
    // the client should call /api/auth/refresh when it gets this
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError("access token expired", 401));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError("invalid token", 401));
    }
    next(error);
  }
}
