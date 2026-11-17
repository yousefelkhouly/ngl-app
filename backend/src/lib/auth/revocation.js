import { cacheProvider } from "../cache/init.js";
import { ACCESS_TOKEN_TTL } from "../../app/auth/utils/token.js";

// access tokens are checked by signature alone, so a stolen one would keep working for up to
// 15 minutes after "sign out everywhere". this keeps, per user, the moment their sessions were
// revoked; the guard refuses any access token issued at or before it. the key only has to
// outlive the tokens it can refuse, so it expires with them
const revokedAtKey = (userId) => `revoked-at:${userId}`;

export async function revokeAccessTokens(userId) {
  const now = Math.floor(Date.now() / 1000);
  await cacheProvider.set(revokedAtKey(userId), String(now), ACCESS_TOKEN_TTL);
}

// iat is in whole seconds. a token from the same second as the revocation is kept: that's
// the new session a password change hands out right after revoking the others
export async function isAccessTokenRevoked({ id, iat }) {
  const revokedAt = await cacheProvider.get(revokedAtKey(id));
  return revokedAt !== null && iat < Number(revokedAt);
}
