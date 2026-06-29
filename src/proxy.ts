// Voyle — proxy (formerly middleware)
// Gates all routes behind the auth cookie, with a global lockdown override.
//
// Two layers of protection:
//  1. Global lockdown — if the site_lockdown flag is true in Supabase, EVERY
//     route (including /login and /api/auth) is taken offline. The flag is
//     tripped automatically when someone attempts to log in with an email
//     that isn't in the users table. Recovery is manual (Supabase Table
//     Editor). The flag is cached in-memory for LOCKDOWN_CACHE_TTL_MS to
//     avoid hitting Supabase on every request.
//  2. Auth cookie — routes not in the public allowlist require a valid
//     voyle_auth HMAC-signed cookie. Public share/embed routes have been
//     removed from the allowlist so media only loads behind a session.

import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, isValidAuthToken } from "@/lib/auth";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

const PUBLIC_PATHS = ["/login"];

// --- Lockdown cache -------------------------------------------------------
// Edge function isolates persist module-level state across requests within
// the same isolate, so we cache the lockdown flag for a short TTL to avoid
// a Supabase round-trip on every single request.
const LOCKDOWN_CACHE_TTL_MS = 3_000; // 3 seconds — lockdown must activate fast
type LockdownCache = { value: boolean; expiresAt: number };
const g = globalThis as unknown as {
  __lockdownCache?: LockdownCache;
};

/**
 * Fetch the global lockdown flag from Supabase via the REST API (PostgREST).
 * Uses a 10-second in-memory cache. Returns false if Supabase is unreachable
 * or misconfigured (fail-open for availability; the auth route still trips
 * the flag on bad emails).
 */
async function isLockedDown(): Promise<boolean> {
  const now = Date.now();
  if (g.__lockdownCache && g.__lockdownCache.expiresAt > now) {
    return g.__lockdownCache.value;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  // Prefer the service-role key for reads too — more reliable, bypasses RLS.
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return false; // not configured — fail open
  }

  try {
    const url = `${supabaseUrl}/rest/v1/site_lockdown?id=eq.1&select=locked`;
    const res = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      // Always fetch fresh — no browser/CDN caching of this critical flag.
      cache: "no-store",
    });
    if (!res.ok) return false;
    const rows = (await res.json()) as { locked?: boolean }[];
    const locked = rows[0]?.locked === true;
    g.__lockdownCache = {
      value: locked,
      expiresAt: now + LOCKDOWN_CACHE_TTL_MS,
    };
    return locked;
  } catch {
    return false; // network error — fail open
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Layer 1: global lockdown -----------------------------------------
  // When locked, the entire site is offline — no exceptions.
  if (await isLockedDown()) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }
    // Rewrite page requests to the locked landing page (keeps the URL).
    return NextResponse.rewrite(new URL("/locked", request.url));
  }

  // --- Layer 2: auth cookie ---------------------------------------------

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

  // NOTE: Public share/embed routes (/p/, /embed/, /api/oembed, /api/og) were
  // intentionally REMOVED from the public allowlist. All media must now load
  // behind a valid session. These routes still work for authenticated users.

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