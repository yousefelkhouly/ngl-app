import { AppError } from "../../lib/errors/appError.js";

export const cannotMessageYourself = new AppError(
  "you can't send a message to yourself",
  400,
);

// also when the note isn't in this user's inbox, so ids can't be probed
export const messageNotFound = new AppError("note not found", 404);

export const noSenderToBlock = new AppError(
  "this note was sent without an account, so there's no one to block",
  400,
);

export const alreadyReported = new AppError("you already reported this note", 409);

// said the same whichever of the two did the blocking
export const blockedFromMessaging = new AppError("you can't send messages to this person", 403);
