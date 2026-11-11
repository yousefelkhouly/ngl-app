import { z } from "zod";

// the same limits the backend enforces (backend/src/app/*/dto, models). checked here for
// instant feedback only: the backend validates everything again

export const NAME_MIN = 3;
export const NAME_MAX = 20;
export const PASSWORD_MIN = 6;
export const PASSWORD_MAX = 30;
export const MESSAGE_MIN = 3;
export const CONTENT_MAX = 200;
export const MAX_UPLOAD_MB = 5;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
export const MAX_COVER_IMAGES = 4;

export const IMAGE_TYPES = ["image/jpeg", "image/png"];
// personal information. the backend checks the same list (allowedFields.personalDocument)
export const MAX_DOCUMENTS = 10;
export const DOCUMENTS_PER_UPLOAD = 5;
export const DOCUMENT_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
];

// for <input type="file" accept>. the extensions help pickers that don't know the docx type
export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");
export const DOCUMENT_ACCEPT = [".pdf", ".docx", ".xlsx", ".pptx", ".txt", ...DOCUMENT_TYPES].join(",");

const objectIdPattern = /^[0-9a-f]{24}$/i;
export const isObjectId = (value: string) => objectIdPattern.test(value);

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your email")
  .pipe(z.email("Enter a valid email"));

const password = z
  .string()
  .min(PASSWORD_MIN, `At least ${PASSWORD_MIN} characters`)
  .max(PASSWORD_MAX, `At most ${PASSWORD_MAX} characters`);

const code = z
  .string()
  .regex(/^\d{6}$/, "Enter the 6-digit code from your email");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const codeSchema = z.object({ code });

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(NAME_MIN, `At least ${NAME_MIN} characters`)
      .max(NAME_MAX, `At most ${NAME_MAX} characters`),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const emailSchema = z.object({ email });

export const verifySchema = z.object({ email, code });

export const resetPasswordSchema = z
  .object({
    code,
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const sendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(MESSAGE_MIN, `Write at least ${MESSAGE_MIN} characters`)
    .max(CONTENT_MAX, `At most ${CONTENT_MAX} characters`),
  revealable: z.boolean(),
});

export const chatMessageSchema = z.object({
  content: z.string().trim().min(1, "Write something first").max(CONTENT_MAX),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type CodeValues = z.infer<typeof codeSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type EmailValues = z.infer<typeof emailSchema>;
export type VerifyValues = z.infer<typeof verifySchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type SendMessageValues = z.infer<typeof sendMessageSchema>;
export type ChatMessageValues = z.infer<typeof chatMessageSchema>;

// checks a picked file before uploading. the backend re-checks the real type from the bytes
export function fileProblem(file: File, allowedTypes: string[]): string | null {
  if (!allowedTypes.includes(file.type)) return `${file.name}: this file type isn't allowed`;
  if (file.size > MAX_UPLOAD_BYTES) return `${file.name}: larger than ${MAX_UPLOAD_MB} MB`;
  return null;
}
