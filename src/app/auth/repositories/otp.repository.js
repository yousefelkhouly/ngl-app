import { OTP } from "../models/otp.model.js";

export async function createOTP(otpData) {
  return await OTP.create(otpData);
}

export async function getOtpByEmail(email) {
  return await OTP.findOne({
    email: email,
  });
}

export async function deleteOTPByEmail(email) {
  return await OTP.deleteMany({ email: email });
}
