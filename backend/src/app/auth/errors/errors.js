import { AppError } from "../../../lib/errors/appError.js";

export const otpExpired = new AppError("otp expired", 404);
export const invalidOTP = new AppError("invalid otp", 400);
export const tooManyOtpAttempts = new AppError(
  "too many wrong codes, request a new one",
  429,
);

export const invalidCredentials = new AppError(
  "invalid email or password",
  401,
);
export const twoStepNotEnabled = new AppError(
  "2 step verification is not enabled",
  400,
);
export const googleEmailNotVerified = new AppError(
  "your google email is not verified",
  403,
);

// the SMTP server refused or couldn't be reached: worth retrying, unlike a 500
export const emailNotSent = new AppError(
  "we couldn't send the email, try again in a moment",
  503,
);

export const refreshTokenMissing = new AppError(
  "no refresh token provided",
  401,
);
export const invalidRefreshToken = new AppError(
  "invalid or expired refresh token",
  401,
);
