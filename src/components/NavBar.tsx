"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search, Mic, Video, LogIn } from "lucide-react";
import LogoutButton from "./LogoutButton";
import { useSidebar } from "./SidebarContext";

/* YouTube's top bar has three regions:
 *  - left: hamburger + logo
 *  - centre: search box + mic icon
 *  - right: create / apps / notifications / avatar
 */
export default function NavBar() {
  const { toggle } = useSidebar();
  const [query, setQuery] = useState("");
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load the current user client-side so the avatar circle has an initial.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.user?.name) setUser({ name: data.user.name });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Close avatar menu when clicking outside.
  useEffect(() => {
    if (!showAvatarMenu) return;
    function onDown(e: MouseEvent) {
      if (
        avatarRef.current &&
        !avatarRef.current.contains(e.target as Node)
      ) {
        setShowAvatarMenu(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showAvatarMenu]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/?search=${encodeURIComponent(q)}`);
  }

  const initial = user?.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <header className="fixed top-0 inset-x-0 z-30 h-14 bg-[color:var(--yt-surface)] flex items-center px-4 gap-4">
      {/* Left cluster */}
      <div className="flex items-center gap-1 w-60">
        <button
          type="button"
          onClick={toggle}
          className="yt-btn-icon"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Link
          href="/"
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[color:var(--yt-hover)]"
          aria-label="voyle home"
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7" aria-hidden>
            <path
              d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8Z"
              fill="var(--yt-brand)"
            />
            <path d="M10 15l5-3-5-3z" fill="#fff" />
          </svg>
          <span className="text-lg font-semibold tracking-tight">voyle</span>
          <span className="text-[10px] text-[color:var(--yt-text-secondary)] self-start mt-1">
            TV
          </span>
        </Link>
      </div>

      {/* Centre search */}
      <form
        onSubmit={onSearch}
        className="flex-1 max-w-2xl mx-auto flex items-center gap-2"
      >
        <div className="flex flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="Search"
            aria-label="Search"
            className="flex-1 h-10 px-4 border border-[color:var(--yt-border)] border-r-0 rounded-l-full bg-[color:var(--yt-surface)] text-sm focus:outline-none focus:border-[color:var(--yt-blue)] placeholder:text-[color:var(--yt-text-secondary)]"
          />
          <button
            type="submit"
            className="h-10 w-16 flex items-center justify-center border border-l-0 border-[color:var(--yt-border)] rounded-r-full bg-[color:var(--yt-hover)] hover:bg-[color:var(--yt-chip-active)]/10"
            aria-label="Submit search"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
        <button
          type="button"
          className="yt-btn-icon"
          aria-label="Search with voice"
          title="Search with voice — coming soon"
          disabled
        >
          <Mic className="w-5 h-5" />
        </button>
      </form>

      {/* Right cluster */}
      <div className="flex items-center gap-1">
        <Link
          href="/generate"
          className="yt-btn-icon gap-2 px-3 w-auto rounded-full"
          aria-label="Create"
          title="Create"
        >
          <Video className="w-6 h-6" />
          <span className="hidden lg:inline text-sm font-medium">Create</span>
        </Link>

        {user ? (
          <div className="relative" ref={avatarRef}>
            <button
              type="button"
              onClick={() => setShowAvatarMenu((v) => !v)}
              className="w-8 h-8 rounded-full bg-[color:var(--yt-brand)] text-white text-sm font-medium flex items-center justify-center ml-2 hover:opacity-90"
              aria-label="Account menu"
              title={user.name}
            >
              {initial}
            </button>
            {showAvatarMenu && (
              <div className="absolute right-0 top-10 w-64 bg-[color:var(--yt-surface)] border border-[color:var(--yt-border)] rounded-xl shadow-lg p-3 text-sm">
                <div className="flex items-center gap-3 px-2 py-2">
                  <div className="w-10 h-10 rounded-full bg-[color:var(--yt-brand)] text-white flex items-center justify-center text-base font-medium">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{user.name}</div>
                    <div className="text-[color:var(--yt-text-secondary)] text-xs truncate">
                      @
                      {user.name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "")
                        .slice(0, 20)}
                    </div>
                  </div>
                </div>
                <div className="border-t border-[color:var(--yt-border)] my-2" />
                <div className="px-2 pb-1">
                  <LogoutButton />
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="ml-2 flex items-center gap-2 px-3 py-1.5 border border-[color:var(--yt-border)] rounded-full text-[color:var(--yt-blue)] text-sm font-medium hover:bg-[#def1ff]"
          >
            <LogIn className="w-5 h-5" />
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}