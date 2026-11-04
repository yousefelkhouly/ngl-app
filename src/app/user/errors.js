import { AppError } from "../../lib/errors/appError.js";

export const userNotExist = new AppError("user does not exist", 404);
export const userAlreadyVerified = new AppError("user already verified", 400);
export const userAlreadyExist = new AppError("user already exists", 409);
export const userNotVerified = new AppError("user is not verified", 403);
