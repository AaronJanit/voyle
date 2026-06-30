// Voyle — admin user management API
// POST /api/admin/users → inserts a new email into the users table with
// allowed = false (pending approval). Only accessible to admin users.
//
// The new row sits in Supabase with allowed = false until a real admin flips
// it to true in the Table Editor. The submitted user cannot sign in until then.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // --- Auth + role check ------------------------------------------------
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!currentUser.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // --- Parse body -------------------------------------------------------
  let body: { email?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const name = body.name?.trim();

  if (!email || !name) {
    return NextResponse.json(
      { error: "Email and name are required" },
      { status: 400 }
    );
  }

  // --- Insert into Supabase (service-role key for writes) ---------------
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Server not configured for writes" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Insert with allowed = false (pending). If the email already exists,
  // upsert so we don't duplicate — but don't change allowed status of
  // an existing approved user.
  const { error } = await supabase
    .from("users")
    .insert({
      email,
      name,
      is_admin: false,
      allowed: false,
    });

  if (error) {
    // 23505 = unique_violation (email already exists)
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "This email is already in the list." },
        { status: 409 }
      );
    }
    console.error("[admin] insert error:", error.message);
    return NextResponse.json(
      { error: "Failed to add email" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Added ${email} — pending approval.`,
  });
}