// Voyle — auth API route
// POST with { code: "613" } → sets signed HttpOnly cookie, returns success.

import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, createAuthToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const submittedCode = body.code?.trim();
  const expectedCode = process.env.AUTH_CODE;

  if (!expectedCode) {
    return NextResponse.json({ error: "Server auth not configured" }, { status: 500 });
  }

  if (!submittedCode || submittedCode !== expectedCode) {
    return NextResponse.json({ error: "Wrong passcode" }, { status: 401 });
  }

  const token = createAuthToken();
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}