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

// without 2-step verification this signs in (sets the auth cookies). with it, a code is
// emailed instead and verifyCodeToLogin takes it
export async function login(email: string, password: string): Promise<{ twoStepEnabled: boolean }> {
  const response = await apiRequest<ApiEnvelope & { twoStepEnabled?: boolean }>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  return { twoStepEnabled: Boolean(response.twoStepEnabled) };
}

// these two set the auth cookies on success
export function verifyCodeToLogin(email: string, code: string) {
  return apiRequest("/auth/verify-code-to-login", { method: "POST", body: { email, code } });
}

// turning 2-step verification on or off from settings: a code is emailed first
export function requestTwoStepCode(enabled: boolean) {
  return apiRequest("/auth/two-step/code", { method: "POST", body: { enabled }, auth: true });
}

export function setTwoStepVerification(enabled: boolean, code: string) {
  return apiRequest("/auth/two-step", { method: "PATCH", body: { enabled, code }, auth: true });
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

// account settings. each that changes what the session carries sets new auth cookies

// signs out every other device. currentPassword is left out by accounts without one
export function changePassword(currentPassword: string | undefined, newPassword: string) {
  return apiRequest("/auth/password", {
    method: "PATCH",
    body: { ...(currentPassword ? { currentPassword } : {}), newPassword },
    auth: true,
  });
}

// emails a code to the new address; confirmEmailChange takes it
export function requestEmailChange(email: string) {
  return apiRequest("/auth/email/code", { method: "POST", body: { email }, auth: true });
}

export function confirmEmailChange(code: string) {
  return apiRequest("/auth/email", { method: "PATCH", body: { code }, auth: true });
}

export function deleteAccount(password: string | undefined) {
  return apiRequest("/auth/account", {
    method: "DELETE",
    body: password ? { password } : {},
    auth: true,
  });
}
