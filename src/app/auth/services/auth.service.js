import { sendEmail } from "../../../common/email/nodemailer.js";
import * as authRepository from "../repositories/auth.repository.js";
import * as otpRepository from "../repositories/otp.repository.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

export async function register(userData) {
  const userExist = await authRepository.checkUSerByEmail(userData.email);
  if (userExist) {
    throw new Error("user already exists");
  }
  userData.password = await bcrypt.hash(userData.password, 10);
  const createdUser = await authRepository.createUser(userData);
  const otp = crypto.randomInt(100000, 999999).toString();
  await otpRepository.createOTP({
    code: otp,
    email: userData.email,
    expiresAt: new Date(Date.now() + 1000 * 60 * 5),
  });

  await sendEmail(
    userData.email,
    "verification code",
    `<h1>your verification code is  ${otp}</h1>`,
  );
  return createdUser;
}
