import { Types } from "mongoose";
import { z } from "zod";
import { CONTENT_MAX_LENGTH } from "../models/message.model.js";

export const sendMessageDto = z.object({
  // same max as the model, otherwise mongoose rejects it later with a confusing error
  content: z.string().trim().min(3).max(CONTENT_MAX_LENGTH),
  receiver: z
    .string()
    .trim()
    .refine((val) => Types.ObjectId.isValid(val), "invalid receiver id"),
});
