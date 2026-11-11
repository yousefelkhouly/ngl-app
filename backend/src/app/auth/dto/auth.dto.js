import z from "zod";
import { NAME_MAX_LENGTH } from "../../user/models/user.model.js";

// trim and lowercase run before the email check, so " User@Mail.com " becomes "user@mail.com"
const emailField = z.string().trim().toLowerCase().pipe(z.email());
// not trimmed: spaces are valid password characters
const passwordField = z.string().min(6).max(30);
const codeField = z.string().trim().regex(/^\d{6}$/, "code must be 6 digits");

export const registerDTO = z.object({
  // same max as the model, otherwise mongoose rejects it later with a confusing error
  name: z.string().trim().min(3).max(NAME_MAX_LENGTH),
  email: emailField,
  password: passwordField,
  // no "provider" field: a client must not be able to register itself as a google user
  // JSON sends dates as strings, so coerce them into Date objects
  dob: z.coerce.date().optional(),
  gender: z.enum(["male", "female"]).default("male"),
});

// email + 6 digit code: verify-account, enable-2-step-verification, verify-code-to-login
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
