import { apiRequest, type ApiEnvelope } from "./client";
import type { SessionUser } from "./types";

// backend/src/app/auth/auth.route.js

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export function register(input: RegisterInput) {
  return apiRequest("/auth/register", { method: "POST", body: { ...input } });
}

export function verifyAccount(email: string, code: string) {
  return apiRequest("/auth/verify-account", { method: "PATCH", body: { email, code } });
}

// always answers with success, whether or not the email has an account
export function sendOtp(email: string) {
  return apiRequest("/auth/send-otp", { method: "POST", body: { email } });
}

export function resetPassword(email: string, code: string, newPassword: string) {
  return apiRequest("/auth/reset-password", {
    method: "PATCH",
    body: { email, code, newPassword },
  });
}

// never logs in by itself: it emails a code. twoStepEnabled says which endpoint takes it
export async function login(email: string, password: string): Promise<{ twoStepEnabled: boolean }> {
  const response = await apiRequest<ApiEnvelope & { twoStepEnabled?: boolean }>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  return { twoStepEnabled: Boolean(response.twoStepEnabled) };
}

// these three set the auth cookies on success
export function verifyCodeToLogin(email: string, code: string) {
  return apiRequest("/auth/verify-code-to-login", { method: "POST", body: { email, code } });
}

export function enableTwoStepVerification(email: string, code: string) {
  return apiRequest("/auth/enable-2-step-verification", {
    method: "PATCH",
    body: { email, code },
  });
}

export function loginWithGoogle(idToken: string) {
  return apiRequest("/auth/login-with-google", { method: "POST", body: { idToken } });
}

export function logout() {
  return apiRequest("/auth/logout", { method: "POST" });
}

// not a backend route: app/api/auth/session/route.ts, this app's own server
export async function fetchSession(): Promise<SessionUser | null> {
  const response = await fetch("/api/auth/session", {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("session check failed");
  const json = (await response.json()) as { user: SessionUser | null };
  return json.user;
}
