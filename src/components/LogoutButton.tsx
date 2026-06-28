"use client";

import { useRouter } from "next/navigation";

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
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      </svg>
      <span>Sign out</span>
    </button>
  );
}