// Voyle — get current user from auth cookie + Supabase
// Used in Server Components to get the logged-in user's name.
//
// On every request we re-validate three things:
//   1. The auth cookie is a valid HMAC-signed token (getAuthEmail).
//   2. The email still exists in the Supabase users table.
//   3. The request originates from the same IP that was bound at first login.
// If any check fails, the caller treats the request as unauthenticated.

import { cookies } from "next/headers";
import { COOKIE_NAME, getAuthEmail } from "@/lib/auth";
import { getServerIP } from "@/lib/ip";
import { createClient } from "@supabase/supabase-js";

export interface CurrentUser {
  email: string;
  name: string;
}

/** Get the current logged-in user from the auth cookie + Supabase users table. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const email = getAuthEmail(token);
  if (!email) return null;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (!data) return null;

  // IP pinning: if an IP is bound, the current request must originate from it.
  // This defeats cookie theft from a different network. If the first_login_ip
  // column doesn't exist yet (migration not run) or has no value, allow through.
  const boundIP: string | null = data.first_login_ip ?? null;
  if (boundIP) {
    const currentIP = await getServerIP();
    if (!currentIP || currentIP !== boundIP) {
      return null;
    }
  }

  return { email: data.email, name: data.name };
}