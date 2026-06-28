// Voyle — auth API route
// POST with { email, code } → checks email exists in Supabase users table
// AND passcode matches AND (if bound) the request originates from the same IP
// that first signed in → sets signed HttpOnly cookie with email, returns success.
//
// Security ordering (important):
//   1. Email check FIRST. If the email is NOT in the users table, trip the
//      global lockdown flag (site_lockdown.locked = true) and reject. This
//      happens regardless of whether the passcode is correct.
//   2. Passcode check against AUTH_CODE.
//   3. IP pinning — first login binds the IP; subsequent logins must match.

import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, createAuthToken } from "@/lib/auth";
import { getRequestIP } from "@/lib/ip";
import { createClient } from "@supabase/supabase-js";

/** Flip the global lockdown flag on. Called when a bad email is attempted. */
async function triggerLockdown(
  supabaseUrl: string,
  supabaseKey: string,
  email: string
): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase
      .from("site_lockdown")
      .update({
        locked: true,
        triggered_by: email,
        triggered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
  } catch {
    // Swallow — the bad-email attempt is still rejected below.
  }
}

/**
 * Log a blocked login attempt to the login_attempts table for auditing.
 * Records who tried, why they were blocked, and from what IP.
 */
async function logAttempt(
  supabaseUrl: string,
  supabaseKey: string,
  email: string,
  reason: string,
  ip: string | null
): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase.from("login_attempts").insert({
      email,
      reason,
      ip_address: ip,
      attempted_at: new Date().toISOString(),
    });
  } catch {
    // Swallow — the attempt is still rejected below.
  }
}

// Domain that instantly unplugs the site if used in a login attempt.
const BLOCKED_DOMAIN = "@mesivta.co.uk";

export async function POST(request: NextRequest) {
  let body: { email?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const submittedCode = body.code?.trim();

  // Check email is provided
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Supabase config (server-only env vars — read at runtime, not build time).
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const clientIP = getRequestIP(request);

  // --- Step 0: blocked-domain check (BEFORE everything else) ------------
  // Any login attempt with an email ending in @mesivta.co.uk instantly
  // unplugs the site and logs the attempt to Supabase.
  if (email.endsWith(BLOCKED_DOMAIN)) {
    await triggerLockdown(supabaseUrl, supabaseKey, email);
    await logAttempt(supabaseUrl, supabaseKey, email, "blocked_domain", clientIP);
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // --- Step 1: email allowlist check (BEFORE passcode) -------------------
  // If the email isn't in the users table, trip the global lockdown and
  // reject. This fires regardless of passcode correctness.
  // We select "*" so the query doesn't break if the first_login_ip column
  // hasn't been added yet (migration not run). first_login_ip will simply
  // be undefined, which the IP-pinning step handles gracefully.
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !data) {
    await triggerLockdown(supabaseUrl, supabaseKey, email);
    await logAttempt(supabaseUrl, supabaseKey, email, "not_allowlisted", clientIP);
    // Deliberately generic message — don't reveal the lockdown was tripped.
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // --- Step 2: passcode check -------------------------------------------
  const expectedCode = process.env.AUTH_CODE;
  if (!expectedCode) {
    return NextResponse.json({ error: "Server auth not configured" }, { status: 500 });
  }
  if (!submittedCode || submittedCode !== expectedCode) {
    return NextResponse.json({ error: "Wrong passcode" }, { status: 401 });
  }

  // --- Step 3: IP pinning -----------------------------------------------
  // clientIP was extracted above (before the blocked-domain check).

  if (!clientIP) {
    // Strict mode: if we can't determine the IP, refuse to authenticate.
    return NextResponse.json(
      { error: "Unable to verify network" },
      { status: 403 }
    );
  }

  if (!data.first_login_ip) {
    // First successful login for this user — bind the IP.
    await supabase
      .from("users")
      .update({
        first_login_ip: clientIP,
        ip_locked_at: new Date().toISOString(),
      })
      .eq("email", email);
  } else if (data.first_login_ip !== clientIP) {
    // IP mismatch — reject. Do NOT trigger lockdown (this is likely a
    // legitimate user on a new network, not an attack). Admin resets the
    // bound IP manually via the Supabase Table Editor.
    return NextResponse.json(
      { error: "Login restricted to the original device network" },
      { status: 403 }
    );
  }

  // Success — create token with email and set cookie
  const token = createAuthToken(email);
  const response = NextResponse.json({ success: true, name: data.name });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}