import { NextResponse, type NextRequest } from "next/server";
import { cookieFromSetCookie, readAccessToken } from "@/lib/server/token";
import { backendUrlFor } from "@/lib/server/backend-proxy";
import type { SessionUser } from "@/lib/api/types";

// who is logged in. the backend has no "me" endpoint and its cookies are httpOnly, so this
// route (this app's own server, not the proxy in api/[...path]) reads them. it lives under /api/auth because
// the backend only sends the refresh_token cookie to paths under /api/auth

function respond(user: SessionUser | null) {
  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  const user = accessToken ? readAccessToken(accessToken) : null;
  if (user) return respond(user);

  // the access token is gone after 15 minutes; a refresh token may still be valid
  const refreshToken = request.cookies.get("refresh_token")?.value;
  if (!refreshToken) return respond(null);

  const forwardedFor = request.headers.get("x-forwarded-for");
  let backendResponse: Response;
  try {
    backendResponse = await fetch(backendUrlFor("/api/auth/refresh"), {
      method: "POST",
      headers: {
        cookie: `refresh_token=${refreshToken}`,
        ...(forwardedFor ? { "x-forwarded-for": forwardedFor } : {}),
      },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { user: null, error: "backend unreachable" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!backendResponse.ok) {
    // used, revoked or expired: remove it so the next check doesn't try it again
    const response = respond(null);
    response.cookies.set("refresh_token", "", { path: "/api/auth", maxAge: 0 });
    return response;
  }

  // pass the rotated cookies on to the browser, exactly as the backend set them
  const setCookies = backendResponse.headers.getSetCookie();
  const newAccessToken = cookieFromSetCookie(setCookies, "access_token");
  const response = respond(newAccessToken ? readAccessToken(newAccessToken) : null);
  for (const header of setCookies) response.headers.append("set-cookie", header);
  return response;
}
