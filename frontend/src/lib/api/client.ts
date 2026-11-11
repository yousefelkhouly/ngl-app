// the one place the app talks to the backend. requests go to /api on this origin,
// app/api/[...path] forwards them to the backend, and the auth cookies travel with them

const API_BASE = "/api";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// every backend response: { message, success, data?, ...extra fields }
export interface ApiEnvelope<T = unknown> {
  message?: string;
  success?: boolean;
  data?: T;
  [key: string]: unknown;
}

type RequestBody = Record<string, unknown> | FormData;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: RequestBody;
  // for routes behind the backend's guard: on a 401 the session is refreshed once and
  // the request retried; if that fails, listeners of onSessionExpired are told
  auth?: boolean;
  signal?: AbortSignal;
}

function fallbackMessage(status: number): string {
  if (status === 429) return "Too many attempts. Wait a few minutes and try again.";
  if (status === 413) return "That's too large to send.";
  if (status >= 500) return "Something went wrong on our side. Try again in a moment.";
  return "That didn't work. Try again.";
}

// backend messages are written lowercase ("user does not exist"); show them as sentences
function toSentence(message: string): string {
  return message.charAt(0).toUpperCase() + message.slice(1);
}

async function readJson(response: Response): Promise<ApiEnvelope> {
  try {
    return (await response.json()) as ApiEnvelope;
  } catch {
    return {};
  }
}

// several requests can hit a 401 at the same moment: they all wait on one refresh
let refreshing: Promise<boolean> | null = null;

export function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    credentials: "same-origin",
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

const sessionExpiredListeners = new Set<() => void>();

export function onSessionExpired(listener: () => void): () => void {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

export async function apiRequest<T = ApiEnvelope>(
  path: string,
  { method = "GET", body, auth = false, signal }: RequestOptions = {},
): Promise<T> {
  const isForm = body instanceof FormData;
  const send = () =>
    fetch(`${API_BASE}${path}`, {
      method,
      credentials: "same-origin",
      signal,
      headers: body && !isForm ? { "Content-Type": "application/json" } : undefined,
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
    });

  let response: Response;
  try {
    response = await send();
    if (response.status === 401 && auth) {
      if (await refreshSession()) response = await send();
      if (response.status === 401) sessionExpiredListeners.forEach((listener) => listener());
    }
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }

  const json = await readJson(response);
  if (!response.ok) {
    const message =
      typeof json.message === "string" && json.message
        ? toSentence(json.message)
        : fallbackMessage(response.status);
    throw new ApiError(message, response.status);
  }
  return json as T;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Something went wrong. Try again.";
}
