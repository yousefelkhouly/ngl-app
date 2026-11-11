import { AppError } from "../../lib/errors/appError.js";

export const cannotMessageYourself = new AppError(
  "you can't send a message to yourself",
  400,
);
