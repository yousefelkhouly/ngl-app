import { Types } from "mongoose";
import { z } from "zod";

// checked before it reaches mongoose, a bad id would otherwise throw a CastError (500)
export const requestIdDto = z.object({
  id: z
    .string()
    .trim()
    .refine((val) => Types.ObjectId.isValid(val), "invalid request id"),
});
