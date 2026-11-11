import { z } from "zod";
import type { SessionUser } from "@/lib/api/types";

// the access token the backend signs: { id, email, name, iat, exp }
const accessTokenPayload = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  exp: z.number(),
});

// treat a token this close to expiring as already expired, so a request made with it
// doesn't fail halfway
const EXPIRY_MARGIN_MS = 10_000;

// reads who the token belongs to WITHOUT verifying its signature: this app has no
// signing secret and must not have one. that's fine because it's only used to show
// the user's own name and link; every API call is checked by the backend, which does verify
export function readAccessToken(token: string): SessionUser | null {
  const payloadPart = token.split(".")[1];
  if (!payloadPart) return null;
  try {
    const json: unknown = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));
    const parsed = accessTokenPayload.safeParse(json);
    if (!parsed.success) return null;
    if (parsed.data.exp * 1000 < Date.now() + EXPIRY_MARGIN_MS) return null;
    return { id: parsed.data.id, email: parsed.data.email, name: parsed.data.name };
  } catch {
    return null;
  }
}

// the value of `name` from a list of Set-Cookie headers
export function cookieFromSetCookie(setCookies: string[], name: string): string | null {
  for (const header of setCookies) {
    const [pair] = header.split(";");
    const separator = pair.indexOf("=");
    if (pair.slice(0, separator).trim() === name) {
      return decodeURIComponent(pair.slice(separator + 1));
    }
  }
  return null;
}
