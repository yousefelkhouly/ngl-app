import z from "zod";
import { NAME_MAX_LENGTH } from "../../user/models/user.model.js";

const emailField = z.string().trim().toLowerCase().pipe(z.email());
const passwordField = z.string().min(6).max(30);
const codeField = z.string().trim().regex(/^\d{6}$/, "code must be 6 digits");

export const registerDTO = z.object({
  name: z.string().trim().min(3).max(NAME_MAX_LENGTH),
  email: emailField,
  password: passwordField,
  dob: z.coerce.date().optional(),
  gender: z.enum(["male", "female"]).default("male"),
});

export const emailCodeDTO = z.object({
  email: emailField,
  code: codeField,
});

export const loginDTO = z.object({
  email: emailField,
  password: passwordField,
});

export const sendOtpDTO = z.object({
  email: emailField,
});

export const resetPasswordDTO = z.object({
  email: emailField,
  code: codeField,
  newPassword: passwordField,
});

export const googleLoginDTO = z.object({
  idToken: z.string().min(1),
});
