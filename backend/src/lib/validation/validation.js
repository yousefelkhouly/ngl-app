import z from "zod";
import { AppError } from "../errors/appError.js";

// a mongodb id: exactly 24 hex characters, lowercased. not ObjectId.isValid, which also
// accepts any 12 character string, and comparing ids as strings (like "is this my own id")
// only works when they're always written the same way.
// checked before it reaches mongoose, a bad id would otherwise throw a CastError
export const objectIdField = (message) =>
  z
    .string()
    .trim()
    .regex(/^[0-9a-f]{24}$/i, message)
    .transform((val) => val.toLowerCase());

export function validateDTO(dto, body) {
  const result = z.safeParse(dto, body);
  if (result.success === false) {
    const errMessages = result.error.issues.map(
      (issue) => `${issue.path[0] ?? "error"} : ${issue.message}`,
    );
    throw new AppError(errMessages.join(", "), 400);
  }
  return result.data;
}
