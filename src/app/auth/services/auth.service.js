import * as userRepository from "../../user/repositories/user.repository.js";
import { NAME_MAX_LENGTH } from "../../user/models/user.model.js";
import { toSeconds } from "../../../pkg/utils/time.js";
import {
  googleEmailNotVerified,
  invalidCredentials,
  invalidOTP,
  invalidRefreshToken,
  noPasswordSet,
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
import { mailjetProvider } from "../../../lib/email/init.js";
import { cacheProvider } from "../../../lib/cache/init.js";

// ---------- one-time codes ----------

const OTP_TTL = toSeconds(5, "minutes");
const MAX_OTP_ATTEMPTS = 5;

// each kind of code has its own redis key, so a code can only be used for what it was sent for
const OTP_KEYS = {
  // register and /send-otp: used by /verify-account and /reset-password
  account: "otp",
  // /login: used by /verify-code-to-login and /enable-2-step-verification
  login: "otp:login",
};

const otpKey = (prefix, email) => `${prefix}:${email}`;
const attemptsKey = (prefix, email) => `${prefix}:attempts:${email}`;

// stores a new code (replacing any older one) and emails it
async function sendCode(prefix, email, subject, text) {
  const code = generateOtp();
  await cacheProvider.set(otpKey(prefix, email), code, OTP_TTL);
  // a new code gets a fresh set of tries
  await cacheProvider.del(attemptsKey(prefix, email));
  await mailjetProvider.sendmail(email, subject, `<h1>${text} ${code}</h1>`);
}

// checks the code, runs `action(user)`, then deletes the code so it can't be reused.
// after MAX_OTP_ATTEMPTS wrong codes the code is deleted: a 6 digit code has
// 1,000,000 possibilities, without a limit it could be guessed by a script
async function verifyOtp(email, code, prefix, action) {
  const user = await userRepository.findUserByEmail(email);
  if (!user) throw userNotExist;

  const key = otpKey(prefix, email);
  const otp = await cacheProvider.get(key);
  if (!otp) throw otpExpired;

  if (otp !== code) {
    const attempts = await cacheProvider.incr(attemptsKey(prefix, email), OTP_TTL);
    if (attempts >= MAX_OTP_ATTEMPTS) {
      await cacheProvider.del(key);
      await cacheProvider.del(attemptsKey(prefix, email));
      throw tooManyOtpAttempts;
    }
    throw invalidOTP;
  }

  const result = await action(user);

  await cacheProvider.del(key);
  await cacheProvider.del(attemptsKey(prefix, email));
  return result;
}

// ---------- tokens ----------

async function issueTokens(user) {
  const accessToken = generateAccessToken({
    id: user._id.toString(),
    email: user.email,
    name: user.name,
  });
  const { token: refreshToken, jti } = generateRefreshToken(user._id.toString());
  // the refresh token only works while this key exists, which is how logout revokes it
  await cacheProvider.set(`refresh:${jti}`, user._id.toString(), REFRESH_TOKEN_TTL);
  return { accessToken, refreshToken };
}

// ---------- register / verify ----------

export async function register(userData) {
  const userExist = await userRepository.findUserByEmail(userData.email);
  if (userExist) throw userAlreadyExist;

  const createdUser = await userRepository.createUser({
    ...userData,
    password: await hashPassword(userData.password),
  });

  await sendCode(OTP_KEYS.account, userData.email, "verification code", "your verification code is");

  // the model's toJSON removes the password hash when this is sent
  return createdUser;
}

export async function verifyAccount(email, code) {
  await verifyOtp(email, code, OTP_KEYS.account, async (user) => {
    if (user.isVerified) throw userAlreadyVerified;
    await userRepository.updateUserById(user._id, { isVerified: true });
  });
}

// sends a new account code, used to verify the account or to reset the password
export async function sendOtp(email) {
  const user = await userRepository.findUserByEmail(email);
  if (!user) throw userNotExist;

  await sendCode(OTP_KEYS.account, email, "new otp", "your new otp is");
}

export async function resetPassword(email, code, newPassword) {
  await verifyOtp(email, code, OTP_KEYS.account, async (user) => {
    await userRepository.updateUserById(user._id, {
      password: await hashPassword(newPassword),
    });
  });
}

// ---------- login ----------

// the same error for "no such user" and "wrong password",
// so the response doesn't tell a stranger which emails have an account
async function checkCredentials(email, password) {
  const user = await userRepository.findUserByEmail(email);
  if (!user) throw invalidCredentials;

  // google users have no password, and argon2.verify throws on a missing hash
  if (!user.password) throw noPasswordSet;

  const match = await comparePassword(password, user.password);
  if (!match) throw invalidCredentials;

  // checked after the password, so only the owner learns the account isn't verified
  if (!user.isVerified) throw userNotVerified;

  return user;
}

// every password login emails a code: users with 2FA use it on /verify-code-to-login,
// users without it use it on /enable-2-step-verification
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

// uses the code sent by login, so the password was already checked and access
// to the inbox alone can't turn on 2FA. the user did what login asked, so they're logged in too
export async function enable2StepVerification(email, code) {
  return verifyOtp(email, code, OTP_KEYS.login, async (user) => {
    await userRepository.updateUserById(user._id, { twoStepVerification: true });
    return issueTokens(user);
  });
}

export async function loginWithGoogle(idToken) {
  const googleUser = await verifyGoogleToken(idToken);

  // without this, a google account using someone else's unverified email
  // could log in to that person's account here
  if (!googleUser.email_verified) throw googleEmailNotVerified;

  const email = googleUser.email.toLowerCase();
  const user = await userRepository.findUserByEmail(email);

  if (user) {
    // google just proved this person owns the email
    if (!user.isVerified) {
      await userRepository.updateUserById(user._id, { isVerified: true });
    }
    return issueTokens(user);
  }

  // google names can be longer or shorter than the model allows
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

// ---------- refresh / logout ----------

export async function refresh(refreshToken) {
  if (!refreshToken) throw refreshTokenMissing;

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw invalidRefreshToken;
  }

  // del returns how many keys it removed, so only one request can use a token
  const deleted = await cacheProvider.del(`refresh:${payload.jti}`);
  if (deleted === 0) throw invalidRefreshToken;

  const user = await userRepository.findUserById(payload.id);
  if (!user) throw userNotExist;

  return issueTokens(user);
}

export async function logout(refreshToken) {
  if (!refreshToken) return;
  try {
    const payload = verifyRefreshToken(refreshToken);
    await cacheProvider.del(`refresh:${payload.jti}`);
  } catch {
    // token is already invalid, nothing to revoke
  }
}
