import { AppError } from "../../lib/errors/appError.js";

export const requestNotFound = new AppError("request not found", 404);
export const notRequestReceiver = new AppError(
  "only the receiver of this request can answer it",
  403,
);
export const requestAlreadyAnswered = new AppError(
  "this request was already answered",
  400,
);
