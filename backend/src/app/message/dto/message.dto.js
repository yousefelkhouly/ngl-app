import { z } from "zod";
import { CONTENT_MAX_LENGTH } from "../models/message.model.js";
import { REPORT_REASONS } from "../models/report.model.js";
import { objectIdField } from "../../../lib/validation/validation.js";

export const sendMessageDto = z.object({
  content: z.string().trim().min(3).max(CONTENT_MAX_LENGTH),
  receiver: objectIdField("invalid receiver id"),
});

export const messageIdDto = z.object({
  id: objectIdField("invalid note id"),
});

export const reportDto = z.object({
  reason: z.enum(REPORT_REASONS),
});
