import type { NextRequest } from "next/server";

// forwards a browser request to the backend and streams the answer back unchanged
// (status, body, Set-Cookie). done with fetch instead of a next.config rewrite because:
// - fetch honours the backend's "Keep-Alive: timeout=5" header; the rewrite proxy reuses
//   sockets the backend is closing at that moment and fails with ECONNRESET
// - BACKEND_URL is read at runtime, so one build works against any backend

const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:5000").replace(/\/+$/, "");

// per-connection headers, meaningful only between two hops
const HOP_BY_HOP = [
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
];

export function backendUrlFor(path: string): string {
  return `${backendUrl}${path}`;
}

// the catch-all segments of /api/[...path] or /uploads/[...path], or null when one tries
// to step outside that prefix ("..", an encoded slash)
export function safeSegments(segments: string[]): string | null {
  if (segments.some((segment) => segment === "." || segment === ".." || segment.includes("/"))) {
    return null;
  }
  return segments.map(encodeURIComponent).join("/");
}

export async function proxyToBackend(request: NextRequest, path: string): Promise<Response> {
  const target = backendUrlFor(path) + request.nextUrl.search;
  const headers = new Headers(request.headers);
  for (const name of HOP_BY_HOP) headers.delete(name);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let response: Response;
  try {
    response = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      // a streamed request body (uploads) needs half-duplex
      ...(hasBody ? { duplex: "half" } : {}),
      redirect: "manual",
      cache: "no-store",
    } as RequestInit);
  } catch {
    return Response.json(
      { message: "can't reach the server, try again in a moment", success: false },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers(response.headers);
  // fetch already decoded the body, so its encoding and length no longer apply
  for (const name of [...HOP_BY_HOP, "content-encoding"]) responseHeaders.delete(name);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}
