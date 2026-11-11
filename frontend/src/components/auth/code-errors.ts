import { ApiError, errorMessage } from "@/lib/api/client";

// the backend's code errors ("invalid otp", "otp expired"...), said the way a person would
export function codeErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const message = error.message.toLowerCase();
    if (message === "invalid otp") return "That code isn't right. Check your email and try again.";
    if (message === "otp expired") return "That code expired or was already used. Send yourself a new one.";
    if (error.status === 429 && message.includes("wrong codes")) {
      return "Too many wrong codes. Send yourself a new one.";
    }
  }
  return errorMessage(error);
}

// the form error of a code step: the code's own error first, then a failed "send a new code"
export function codeStepError(codeError: unknown, resendError: unknown): string | null {
  if (codeError) return codeErrorMessage(codeError);
  if (resendError) return errorMessage(resendError);
  return null;
}
