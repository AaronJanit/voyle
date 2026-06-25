// Voyle — get current user from auth cookie + Supabase
// Used in Server Components to get the logged-in user's name.

import { cookies } from "next/headers";
import { COOKIE_NAME, getAuthEmail } from "@/lib/auth";
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
    .select("email, name")
    .eq("email", email)
    .single();

  if (!data) return null;
  return { email: data.email, name: data.name };
}