// Voyle — proxy (formerly middleware)
// Gates all routes except /login and static assets behind the auth cookie.

import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, isValidAuthToken } from "@/lib/auth";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

const PUBLIC_PATHS = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Allow Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/auth") // auth + logout endpoints must be accessible
  ) {
    return NextResponse.next();
  }

  // Public routes — accessible without auth so media can be shared & embedded.
  // /p/[id]    — share landing page (OG previews, full media view)
  // /embed/[id] — iframe-able viewer for third-party sites
  // /api/oembed — oEmbed discovery endpoint
  // /api/og     — dynamic OG image generator (used by /p/[id] metadata)
  if (
    pathname.startsWith("/p/") ||
    pathname.startsWith("/embed/") ||
    pathname.startsWith("/api/oembed") ||
    pathname.startsWith("/api/og")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (isValidAuthToken(token)) {
    return NextResponse.next();
  }

  // Redirect to login for page requests, 401 for API requests
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}