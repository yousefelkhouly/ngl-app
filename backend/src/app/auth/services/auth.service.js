import crypto from "crypto";
import * as userRepository from "../../user/repositories/user.repository.js";
import { NAME_MAX_LENGTH } from "../../user/models/user.model.js";
import { toSeconds } from "../../../pkg/utils/time.js";
import {
  emailNotSent,
  googleEmailNotVerified,
  invalidCredentials,
  invalidOTP,
  invalidRefreshToken,
  otpExpired,
  refreshTokenMissing,
  tooManyOtpAttempts,
  twoStepAlreadyInState,
  twoStepNotEnabled,
  wrongPassword,
  noEmailChangePending,
  sameEmail,
} from "../errors/errors.js";
import {
  userAlreadyExist,
  userAlreadyVerified,
  userNotExist,
  userNotVerified,
} from "../../user/errors.js";
import { generateOtp } from "../../../lib/utils/otp.js";
import {
  REFRESH_TOKEN_TTL,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/token.js";
import { comparePassword, hashPassword } from "../utils/hash.js";
import { verifyGoogleToken } from "../../../lib/utils/google-auth.js";
import { emailProvider } from "../../../lib/email/init.js";
import { cacheProvider } from "../../../lib/cache/init.js";
import { logger } from "../../../pkg/logger/logger.js";
import { revokeAccessTokens } from "../../../lib/auth/revocation.js";
import { codeEmail } from "../../../lib/email/templates.js";
import { storage } from "../../../lib/media/init.js";
import { generateUsername } from "../../user/utils/username.js";
import * as messageRepository from "../../message/repositories/message.repository.js";
import * as requestRepository from "../../request/repositories/request.repository.js";


const OTP_TTL = toSeconds(5, "minutes");
const MAX_OTP_ATTEMPTS = 5;

const OTP_KEYS = {
  account: "otp",
  login: "otp:login",
  // turning 2-step verification on or off, from the signed-in user's settings
  twoStep: "otp:two-step",
  // moving the account to a new address: the code goes to the new one
  changeEmail: "otp:change-email",
};

const pendingEmailKey = (userId) => `change-email:${userId}`;
const changeEmailPrefix = (userId) => `${OTP_KEYS.changeEmail}:${userId}`;

// a code asked for to turn it on can't be used to turn it off, and the other way round
const twoStepPrefix = (enabled) => `${OTP_KEYS.twoStep}:${enabled ? "on" : "off"}`;

const otpKey = (prefix, email) => `${prefix}:${email}`;
const attemptsKey = (prefix, email) => `${prefix}:attempts:${email}`;

// stores a new code (replacing any older one) and emails it. kind picks the email's wording
// (lib/email/templates.js)
async function sendCode(prefix, email, kind) {
  const code = generateOtp();
  await cacheProvider.set(otpKey(prefix, email), code, OTP_TTL);
  await cacheProvider.del(attemptsKey(prefix, email));
  const { subject, html, text } = codeEmail(kind, code);
  try {
    await emailProvider.sendmail(email, subject, html, text);
  } catch (error) {
    // the SMTP error stays in the logs; the client gets a message it can act on
    logger.error("sending an email failed", { stack: error.stack });
    throw emailNotSent;
  }
}

// throws unless code is the one stored for this email, counting wrong tries
async function checkOtp(email, code, prefix) {
  const key = otpKey(prefix, email);
  const otp = await cacheProvider.get(key);
  if (!otp) throw otpExpired;

  const attempts = await cacheProvider.incr(attemptsKey(prefix, email), OTP_TTL);
  if (attempts > MAX_OTP_ATTEMPTS) throw tooManyOtpAttempts;

  if (otp !== code) {
    if (attempts === MAX_OTP_ATTEMPTS) {
      await cacheProvider.del(key, attemptsKey(prefix, email));
      throw tooManyOtpAttempts;
    }
    throw invalidOTP;
  }
}

// a used code can't be used again
const forgetOtp = (email, prefix) =>
  cacheProvider.del(otpKey(prefix, email), attemptsKey(prefix, email));

async function verifyOtp(email, code, prefix, action) {
  await checkOtp(email, code, prefix);

  const user = await userRepository.findUserByEmail(email);
  if (!user) throw userNotExist;

  const result = await action(user);

  await forgetOtp(email, prefix);
  return result;
}

const refreshKey = (jti) => `refresh:${jti}`;
const userSessionsKey = (userId) => `refresh:user:${userId}`;

async function issueTokens(user) {
  const userId = user._id.toString();
  const accessToken = generateAccessToken({
    id: userId,
    email: user.email,
    name: user.name,
  });
  const { token: refreshToken, jti } = generateRefreshToken(userId);
  await cacheProvider.set(refreshKey(jti), userId, REFRESH_TOKEN_TTL);
  await cacheProvider.addToSet(userSessionsKey(userId), jti, REFRESH_TOKEN_TTL);
  return { accessToken, refreshToken };
}

async function revokeRefreshToken(userId, jti) {
  await cacheProvider.removeFromSet(userSessionsKey(userId), jti);
  // del returns how many keys it removed, so only one request can use a token
  return (await cacheProvider.del(refreshKey(jti))) > 0;
}

// after a change to what the access token carries (name, email): the browser's session is
// swapped for a new one, so the app shows the change straight away
export async function renewSession(userId, currentRefreshToken) {
  const user = await userRepository.findUserById(userId);
  if (!user) throw userNotExist;
  await logout(currentRefreshToken);
  return issueTokens(user);
}

async function revokeAllSessions(userId) {
  const key = userSessionsKey(userId);
  const jtis = await cacheProvider.getSet(key);
  await cacheProvider.del(key, ...jtis.map(refreshKey));
  // and the access tokens already handed out, which would otherwise live up to 15 minutes
  await revokeAccessTokens(userId);
}


export async function register(userData) {
  const userExist = await userRepository.findUserByEmail(userData.email);
  if (userExist) throw userAlreadyExist;

  const createdUser = await userRepository.createUserWithUsername(
    { ...userData, password: await hashPassword(userData.password) },
    () => generateUsername(userData.name),
  );

  try {
    await sendCode(OTP_KEYS.account, userData.email, "verifyAccount");
  } catch (error) {
    // without the code the account could never be verified, and signing up again
    // would say "user already exists": remove it so a retry works
    await userRepository.deleteUserById(createdUser._id);
    throw error;
  }

  return createdUser;
}

// the code proves the inbox is theirs, so it also signs them in: no typing the password again
export async function verifyAccount(email, code) {
  return verifyOtp(email, code, OTP_KEYS.account, async (user) => {
    if (user.isVerified) throw userAlreadyVerified;
    await userRepository.updateUserById(user._id, { isVerified: true });
    return issueTokens(user);
  });
}

// a new code for a new account, or to reset a password: the same code works for both
export async function sendOtp(email) {
  const user = await userRepository.findUserByEmail(email);
  if (!user) return;

  await sendCode(OTP_KEYS.account, email, user.isVerified ? "resetPassword" : "verifyAccount");
}

export async function resetPassword(email, code, newPassword) {
  await verifyOtp(email, code, OTP_KEYS.account, async (user) => {
    await userRepository.updateUserById(user._id, {
      password: await hashPassword(newPassword),
    });
    await revokeAllSessions(user._id.toString());
  });
}

let dummyHash;
const getDummyHash = () => (dummyHash ??= hashPassword(crypto.randomUUID()));

async function checkCredentials(email, password) {
  const user = await userRepository.findUserByEmail(email);

  if (!user?.password) {
    await comparePassword(password, await getDummyHash());
    throw invalidCredentials;
  }

  const match = await comparePassword(password, user.password);
  if (!match) throw invalidCredentials;

  if (!user.isVerified) throw userNotVerified;

  return user;
}

// without 2-step verification the password is enough. with it, a code is emailed
// and /verify-code-to-login takes it
export async function login(email, password) {
  const user = await checkCredentials(email, password);
  if (!user.twoStepVerification) {
    return { twoStepEnabled: false, tokens: await issueTokens(user) };
  }

  await sendCode(OTP_KEYS.login, email, "login");
  return { twoStepEnabled: true };
}

export async function verifyCodeToLogin(email, code) {
  return verifyOtp(email, code, OTP_KEYS.login, async (user) => {
    if (!user.isVerified) throw userNotVerified;
    if (!user.twoStepVerification) throw twoStepNotEnabled;
    return issueTokens(user);
  });
}

// the signed-in user asks to turn 2-step verification on or off: a code goes to their email,
// so whoever changes it has the inbox, not only an open session
export async function sendTwoStepCode(userId, enabled) {
  const user = await userRepository.findUserById(userId);
  if (!user) throw userNotExist;
  if (Boolean(user.twoStepVerification) === enabled) throw twoStepAlreadyInState(enabled);

  await sendCode(twoStepPrefix(enabled), user.email, enabled ? "twoStepOn" : "twoStepOff");
}

export async function setTwoStepVerification(userId, enabled, code) {
  const user = await userRepository.findUserById(userId);
  if (!user) throw userNotExist;

  await verifyOtp(user.email, code, twoStepPrefix(enabled), async (current) => {
    await userRepository.updateUserById(current._id, { twoStepVerification: enabled });
  });
  return { twoStepVerification: enabled };
}

export async function loginWithGoogle(idToken) {
  const googleUser = await verifyGoogleToken(idToken);

  if (!googleUser.email_verified) throw googleEmailNotVerified;

  const email = googleUser.email.toLowerCase();
  const user = await userRepository.findUserByEmail(email);

  if (user) {
    if (!user.isVerified) {
      await userRepository.updateUserById(user._id, { isVerified: true });
    }
    return issueTokens(user);
  }

  let name = (googleUser.name ?? email.split("@")[0]).slice(0, NAME_MAX_LENGTH).trim();
  if (name.length < 3) name = "google user";

  const createdUser = await userRepository.createUserWithUsername(
    { name, email, provider: "google", isVerified: true },
    () => generateUsername(name),
  );
  return issueTokens(createdUser);
}

// ---------- account settings (signed in) ----------

// accounts made with Google have no password: they can set one without a current one
export async function changePassword(userId, currentPassword, newPassword) {
  const user = await userRepository.findUserWithPasswordById(userId);
  if (!user) throw userNotExist;
  if (user.password) {
    const match = Boolean(currentPassword) && (await comparePassword(currentPassword, user.password));
    if (!match) throw wrongPassword;
  }

  await userRepository.updateUserById(user._id, { password: await hashPassword(newPassword) });
  // every other device is signed out; this one gets a fresh session
  await revokeAllSessions(userId);
  return issueTokens(user);
}

export async function requestEmailChange(userId, newEmail) {
  const user = await userRepository.findUserById(userId);
  if (!user) throw userNotExist;
  if (user.email === newEmail) throw sameEmail;
  if (await userRepository.findUserByEmail(newEmail)) throw userAlreadyExist;

  await cacheProvider.set(pendingEmailKey(userId), newEmail, OTP_TTL);
  await sendCode(changeEmailPrefix(userId), newEmail, "changeEmail");
  return { pendingEmail: newEmail };
}

export async function confirmEmailChange(userId, code, currentRefreshToken) {
  const newEmail = await cacheProvider.get(pendingEmailKey(userId));
  if (!newEmail) throw noEmailChangePending;

  await checkOtp(newEmail, code, changeEmailPrefix(userId));
  // someone may have signed up with it in the meantime
  if (await userRepository.findUserByEmail(newEmail)) throw userAlreadyExist;

  await userRepository.updateUserById(userId, { email: newEmail });
  await forgetOtp(newEmail, changeEmailPrefix(userId));
  await cacheProvider.del(pendingEmailKey(userId));
  return { email: newEmail, tokens: await renewSession(userId, currentRefreshToken) };
}

// the account can't be signed into or found again: personal details and files are removed,
// notes sent to it are hidden, and pending requests either way are declined. chats stay for
// the other person, under "deleted account"
export async function deleteAccount(userId, password) {
  const user = await userRepository.findUserWithPasswordById(userId);
  if (!user) throw userNotExist;
  if (user.password) {
    const match = Boolean(password) && (await comparePassword(password, user.password));
    if (!match) throw wrongPassword;
  }

  const files = [
    user.profilePicturePath,
    ...(user.coverImagesPath ?? []),
    ...(user.documents ?? []).map((document) => document.path),
  ].filter(Boolean);

  await userRepository.scrubDeletedUser(user._id);
  await Promise.all([
    messageRepository.hideAllForReceiver(user._id),
    requestRepository.declineAllPendingFor(user._id),
    revokeAllSessions(userId),
  ]);
  // last: a failure here leaves files behind, not a half-deleted account
  try {
    await storage.remove(files);
  } catch (error) {
    logger.error("removing a deleted account's files failed", { stack: error.stack });
  }
}


export async function refresh(refreshToken) {
  if (!refreshToken) throw refreshTokenMissing;

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw invalidRefreshToken;
  }

  const revoked = await revokeRefreshToken(payload.id, payload.jti);
  if (!revoked) throw invalidRefreshToken;

  const user = await userRepository.findUserById(payload.id);
  if (!user) throw userNotExist;

  return issueTokens(user);
}

export async function logout(refreshToken) {
  if (!refreshToken) return;
  try {
    const payload = verifyRefreshToken(refreshToken);
    await revokeRefreshToken(payload.id, payload.jti);
  } catch {
  }
}
