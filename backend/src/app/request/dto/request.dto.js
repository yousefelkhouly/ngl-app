import { z } from "zod";
import { objectIdField } from "../../../lib/validation/validation.js";

export const requestIdDto = z.object({
  id: objectIdField("invalid request id"),
});
