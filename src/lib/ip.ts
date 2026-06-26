// Voyle — client IP extraction
// Reads the client IP from proxy headers. Works in both the edge middleware
// (src/proxy.ts) and Node.js server components / route handlers.

import type { NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

/**
 * Extract the client IP from a NextRequest (edge middleware / route handler).
 *
 * Checks `x-forwarded-for` (first hop = the original client) and falls back to
 * `x-real-ip`. Returns null if no forwarding header is present.
 */
export function getRequestIP(request: NextRequest): string | null {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();
  return null;
}

/**
 * Extract the client IP from the Next.js `headers()` async context (Server
 * Components and route handlers that use `next/headers`).
 */
export async function getServerIP(): Promise<string | null> {
  const h = await nextHeaders();
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const xRealIp = h.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();
  return null;
}