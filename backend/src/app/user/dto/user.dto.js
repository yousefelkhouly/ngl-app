import { z } from "zod";
import { objectIdField } from "../../../lib/validation/validation.js";
import { NAME_MAX_LENGTH } from "../models/user.model.js";
import { USERNAME_PATTERN } from "../utils/username.js";

const usernameField = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    USERNAME_PATTERN,
    "username must be 3 to 20 letters, numbers, dots or underscores, starting with a letter",
  );

export const userIdDto = z.object({
  id: objectIdField("invalid user id"),
});

// a share link: /u/<username>, or /u/<account id> from before usernames
export const profileHandleDto = z.object({
  id: z.union([objectIdField("invalid user id"), usernameField]),
});

export const updateProfileDto = z
  .object({
    name: z.string().trim().min(3).max(NAME_MAX_LENGTH).optional(),
    username: usernameField.optional(),
  })
  .refine((value) => value.name !== undefined || value.username !== undefined, {
    message: "send a name or a username",
  });

export const documentIdDto = z.object({
  documentId: objectIdField("invalid document id"),
});
