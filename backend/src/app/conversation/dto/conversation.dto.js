import { z } from "zod";
import { CONTENT_MAX_LENGTH } from "../../message/models/message.model.js";
import { objectIdField } from "../../../lib/validation/validation.js";

export const conversationIdDto = z.object({
  id: objectIdField("invalid conversation id"),
});

export const conversationMessageDto = z.object({
  content: z.string().trim().min(1).max(CONTENT_MAX_LENGTH),
});
