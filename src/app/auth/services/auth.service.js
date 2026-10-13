// import { Error } from "mongoose";
import { sendEmail } from "../../../common/email/nodemailer.js";
import * as authRepository from "../repositories/auth.repository.js";
import * as otpRepository from "../repositories/otp.repository.js";
import * as userRepository from "../../user/repositories/user.repository.js";
// import bcrypt from "bcrypt";
// import crypto from "crypto";
// import jwt from "jsonwebtoken";
import { toMs } from "../../../common/utils/time.js";
import { invalidOTP, invalidPassword, optExpired } from "../errors/errors.js";
import {
  userAlreadyExist,
  userAlreadyVerified,
  userNotExist,
  userNotVerified,
} from "../../user/errors.js";
import { generateOtp } from "../../../common/utils/otp.js";
import { generateToken } from "../utils/token.js";
import { comparePassword, hashPassword } from "../utils/hash.js";

export async function register(userData) {
  // const b = 23;
  // b = 52;
  const userExist = await authRepository.checkUSerByEmail(userData.email);
  if (userExist) {
    throw userAlreadyExist;
  }
  userData.password = await hashPassword(userData.password);
  const createdUser = await authRepository.createUser(userData);
  const otp = generateOtp();
  await otpRepository.createOTP({
    code: otp,
    email: userData.email,
    expiresAt: new Date(Date.now() + toMs(5, "minutes")),
  });

  await sendEmail(
    userData.email,
    "verification code",
    `<h1>your verification code is  ${otp}</h1>`,
  );
  return createdUser;
}

export async function verifyAccont(email, code) {
  const user = await authRepository.checkUSerByEmail(email);

  if (!user) throw userNotExist;

  if (user.isVerified === true) throw userAlreadyVerified;

  const otp = await otpRepository.getOtpByEmail(email);

  if (!otp) throw optExpired;

  if (otp.code !== code) throw invalidOTP;

  const updatedUser = await userRepository.updateUserByEmail(email, {
    isVerified: true,
  });

  await otpRepository.deleteOTPByEmail(email);

  return updatedUser;
}

export async function login(email, password) {
  const user = await authRepository.checkUSerByEmail(email);

  if (!user) throw userNotExist;

  if (user.isVerified === false) throw userNotVerified;

  const match = comparePassword(password, user["password"]);

  if (!match) throw invalidPassword;

  // const token = jwt.sign(
  //   { id: user._id, email: user.email, name: user.name },
  //   process.env.JWT_SECRET,
  //   { expiresIn: toMs(1, "hours") },
  // );
  return generateToken({ id: user._id, email: user.email, name: user.name });
}

export async function sendOtp(email) {
  const user = authRepository.checkUSerByEmail(email);

  if (!user) throw userNotExist;

  await otpRepository.deleteOTPByEmail(email);

  const code = generateOtp();
  await otpRepository.createOTP({
    code: code,
    email: email,
    expiresAt: Date.now() + toMs(5, "minutes"),
  });

  await sendEmail(email, "new otp", `<p>your new otp is ${code}</p>`);
}
