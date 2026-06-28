"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

/** YouTube-style icon-only logout button. Used in the topbar avatar
 *  menu. Posts to /api/auth/logout then redirects to /login. */
export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore — refresh will still redirect to /login
    }
    router.refresh();
    router.push("/login");
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[color:var(--yt-hover)] text-left"
      aria-label="Sign out"
      title="Sign out"
    >
      <LogOut className="w-5 h-5" />
      <span>Sign out</span>
    </button>
  );
}