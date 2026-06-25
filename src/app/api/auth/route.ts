// Voyle — auth API route
// POST with { email, code } → checks email exists in Supabase users table
// AND passcode matches → sets signed HttpOnly cookie with email, returns success.

import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, createAuthToken } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  let body: { email?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const submittedCode = body.code?.trim();
  const expectedCode = process.env.AUTH_CODE;

  if (!expectedCode) {
    return NextResponse.json({ error: "Server auth not configured" }, { status: 500 });
  }

  // Check passcode
  if (!submittedCode || submittedCode !== expectedCode) {
    return NextResponse.json({ error: "Wrong passcode" }, { status: 401 });
  }

  // Check email is provided
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Check email exists in the Supabase users table
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from("users")
    .select("email, name")
    .eq("email", email)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "This email is not on the list" },
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