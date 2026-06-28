// Voyle — current-user API route
// GET → returns the current authenticated user (or 401) by reading the
// auth cookie and looking up the matching row in Supabase. Used by the
// client-side NavBar so it can render the avatar initial.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}