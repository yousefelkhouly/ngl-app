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
  twoStepNotEnabled,
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


const OTP_TTL = toSeconds(5, "minutes");
const MAX_OTP_ATTEMPTS = 5;

const OTP_KEYS = {
  account: "otp",
  login: "otp:login",
};

const otpKey = (prefix, email) => `${prefix}:${email}`;
const attemptsKey = (prefix, email) => `${prefix}:attempts:${email}`;

// stores a new code (replacing any older one) and emails it
async function sendCode(prefix, email, subject, text) {
  const code = generateOtp();
  await cacheProvider.set(otpKey(prefix, email), code, OTP_TTL);
  await cacheProvider.del(attemptsKey(prefix, email));
  try {
    await emailProvider.sendmail(email, subject, `<h1>${text} ${code}</h1>`, `${text} ${code}`);
  } catch (error) {
    // the SMTP error stays in the logs; the client gets a message it can act on
    logger.error("sending an email failed", { stack: error.stack });
    throw emailNotSent;
  }
}

async function verifyOtp(email, code, prefix, action) {
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

  const user = await userRepository.findUserByEmail(email);
  if (!user) throw userNotExist;

  const result = await action(user);

  await cacheProvider.del(key, attemptsKey(prefix, email));
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

async function revokeAllSessions(userId) {
  const key = userSessionsKey(userId);
  const jtis = await cacheProvider.getSet(key);
  await cacheProvider.del(key, ...jtis.map(refreshKey));
}


export async function register(userData) {
  const userExist = await userRepository.findUserByEmail(userData.email);
  if (userExist) throw userAlreadyExist;

  const createdUser = await userRepository.createUser({
    ...userData,
    password: await hashPassword(userData.password),
  });

  try {
    await sendCode(OTP_KEYS.account, userData.email, "verification code", "your verification code is");
  } catch (error) {
    // without the code the account could never be verified, and signing up again
    // would say "user already exists": remove it so a retry works
    await userRepository.deleteUserById(createdUser._id);
    throw error;
  }

  return createdUser;
}

export async function verifyAccount(email, code) {
  await verifyOtp(email, code, OTP_KEYS.account, async (user) => {
    if (user.isVerified) throw userAlreadyVerified;
    await userRepository.updateUserById(user._id, { isVerified: true });
  });
}

export async function sendOtp(email) {
  const user = await userRepository.findUserByEmail(email);
  if (!user) return;

  await sendCode(OTP_KEYS.account, email, "new otp", "your new otp is");
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

export async function login(email, password) {
  const user = await checkCredentials(email, password);
  const twoStepEnabled = Boolean(user.twoStepVerification);

  await sendCode(
    OTP_KEYS.login,
    email,
    twoStepEnabled ? "login verification code" : "enable 2 step verification",
    twoStepEnabled
      ? "your login verification code is"
      : "your code to enable 2 step verification is",
  );

  return { twoStepEnabled };
}

export async function verifyCodeToLogin(email, code) {
  return verifyOtp(email, code, OTP_KEYS.login, async (user) => {
    if (!user.isVerified) throw userNotVerified;
    if (!user.twoStepVerification) throw twoStepNotEnabled;
    return issueTokens(user);
  });
}

export async function enable2StepVerification(email, code) {
  return verifyOtp(email, code, OTP_KEYS.login, async (user) => {
    await userRepository.updateUserById(user._id, { twoStepVerification: true });
    return issueTokens(user);
  });
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

  const createdUser = await userRepository.createUser({
    name,
    email,
    provider: "google",
    isVerified: true,
  });
  return issueTokens(createdUser);
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
