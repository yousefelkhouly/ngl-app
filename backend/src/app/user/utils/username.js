import crypto from "crypto";
import { User } from "../models/user.model.js";

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
// starts with a letter, so a username can never be mistaken for an account id
// (24 hex characters, which links made before usernames still use)
export const USERNAME_PATTERN = /^[a-z][a-z0-9_.]{2,19}$/;

// "Maya K." -> "mayak". latin letters and digits only; anything else becomes "user"
function baseFrom(name) {
  let base = String(name ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (!/^[a-z]/.test(base)) base = `user${base}`;
  return base.slice(0, USERNAME_MAX_LENGTH - 4).padEnd(USERNAME_MIN_LENGTH, "x");
}

export async function isUsernameTaken(username, exceptUserId) {
  const filter = { username };
  if (exceptUserId) filter._id = { $ne: exceptUserId };
  return Boolean(await User.exists(filter));
}

// the name itself if it's free, else the name with a few random digits. the unique index
// still has the last word: callers retry on a duplicate key error
export async function generateUsername(name) {
  const base = baseFrom(name);
  if (!(await isUsernameTaken(base))) return base;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `${base}${crypto.randomInt(100, 10_000)}`;
    if (!(await isUsernameTaken(candidate))) return candidate;
  }
  return `${base}${crypto.randomInt(10_000, 100_000)}`.slice(0, USERNAME_MAX_LENGTH);
}
