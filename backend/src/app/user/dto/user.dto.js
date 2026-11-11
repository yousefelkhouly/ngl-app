import { z } from "zod";
import { objectIdField } from "../../../lib/validation/validation.js";

export const userIdDto = z.object({
  id: objectIdField("invalid user id"),
});

export const documentIdDto = z.object({
  documentId: objectIdField("invalid document id"),
});
