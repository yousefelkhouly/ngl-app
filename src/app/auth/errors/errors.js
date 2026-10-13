import { AppError } from "../../../common/errors/appError.js";

export const optExpired = new AppError("otp expired", 404);
export const invalidOTP = new AppError("invalid otp", 400);

export const invalidPassword = new AppError("invalid password", 403);
