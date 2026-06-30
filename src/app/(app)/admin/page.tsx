// Voyle — admin page
// Only accessible to users with is_admin = true in the users table.
// Lets an admin submit a new email to be added to the users table. Submitted
// emails are inserted with allowed = false (pending). A real admin must flip
// allowed to true in the Supabase Table Editor before that user can sign in.

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import AdminAddUser from "./AdminAddUser";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/");

  return (
    <div className="px-4 sm:px-6 py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-[color:var(--yt-text)] mb-1">
        Admin
      </h1>
      <p className="text-sm text-[color:var(--yt-text-secondary)] mb-6">
        Add a new email to the user list. New users are created with{" "}
        <code className="px-1 py-0.5 rounded bg-[color:var(--yt-hover)] text-xs">
          allowed = false
        </code>{" "}
        and must be approved in the Supabase Table Editor before they can sign in.
      </p>
      <AdminAddUser />
    </div>
  );
}