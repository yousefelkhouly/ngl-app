import { toMs } from "../../../pkg/utils/time.js";
import { env } from "../../../lib/config/env.js";

const cookieOptions = {
  httpOnly: true,
  sameSite: env.cookieSameSite,
  secure: env.isProduction || env.cookieSameSite === "none",
};
const refreshCookieOptions = {
  ...cookieOptions,
  path: "/api/auth",
};

export function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie("access_token", accessToken, {
    ...cookieOptions,
    maxAge: toMs(15, "minutes"),
  });
  res.cookie("refresh_token", refreshToken, {
    ...refreshCookieOptions,
    maxAge: toMs(7 * 24, "hours"),
  });
}

export function clearAuthCookies(res) {
  res.clearCookie("access_token", cookieOptions);
  res.clearCookie("refresh_token", refreshCookieOptions);
}
