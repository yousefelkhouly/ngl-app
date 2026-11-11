import type { NextRequest } from "next/server";
import { proxyToBackend, safeSegments } from "@/lib/server/backend-proxy";

// every /api/* call from the browser goes to the backend through here
// (except /api/auth/session, which this app answers itself)
async function handle(request: NextRequest, { params }: RouteContext<"/api/[...path]">) {
  const path = safeSegments((await params).path);
  if (path === null) return Response.json({ message: "not found", success: false }, { status: 404 });
  return proxyToBackend(request, `/api/${path}`);
}

export { handle as GET, handle as POST, handle as PATCH, handle as PUT, handle as DELETE };
