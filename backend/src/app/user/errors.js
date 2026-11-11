import { AppError } from "../../lib/errors/appError.js";

export const userNotExist = new AppError("user does not exist", 404);
export const userAlreadyVerified = new AppError("user already verified", 400);
export const userAlreadyExist = new AppError("user already exists", 409);
export const userNotVerified = new AppError("user is not verified", 403);
export const tooManyDocuments = (max) =>
  new AppError(`you can keep up to ${max} documents, delete some first`, 400);
export const documentNotFound = new AppError("document not found", 404);
