import { OTP } from "../models/otp.model.js";

export async function createOTP(otpData) {
  return await OTP.create(otpData);
}
