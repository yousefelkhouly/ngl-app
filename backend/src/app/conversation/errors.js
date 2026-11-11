import { AppError } from "../../lib/errors/appError.js";

// also when the user isn't part of it, so strangers can't tell which ids exist
export const conversationNotFound = new AppError("conversation not found", 404);
