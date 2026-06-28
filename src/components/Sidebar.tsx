"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

interface SidebarUser {
  name: string;
}

export default function Sidebar({ user }: { user?: SidebarUser }) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      label: "Library",
      icon: "photos",
    },
    {
      href: "/generate",
      label: "Create",
      icon: "sparkles",
    },
    {
      href: "/chat",
      label: "Chat to Voyle",
      icon: "bubble",
    },
    {
      href: "/make-your-own",
      label: "Make Your Own",
      icon: "wand",
    },
    {
      href: "/spencer",
      label: "Spencer",
      icon: "bolt",
    },
  ] as const;

  return (
    <>
      {/* Desktop sidebar — iOS sidebar list pattern */}
      <aside className="hidden md:flex w-72 shrink-0 flex-col h-screen sticky top-0 bg-[var(--bg-elev)] border-r border-[var(--border)]">
        {/* Brand header */}
        <div className="px-5 pt-6 pb-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#0a84ff] via-[#5e5ce6] to-[#bf5af2] flex items-center justify-center shadow-sm">
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 3l8 14h-3.2L15 14H9l-1.8 3H4z" />
              </svg>
            </div>
            <div>
              <div className="ios-headline leading-tight">voyle</div>
              <div className="ios-caption leading-tight mt-0.5">
                a little corner
              </div>
            </div>
          </Link>
        </div>

        {/* Search box (visual only for now) */}
        <div className="px-4 mb-3">
          <div className="flex items-center gap-2 bg-[var(--bg)] rounded-[10px] px-3 py-2">
            <svg
              className="w-4 h-4 text-[var(--fg-faint)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search"
              className="bg-transparent flex-1 text-[15px] outline-none placeholder:text-[var(--fg-faint)] text-[var(--fg)]"
            />
          </div>
        </div>

        {/* Nav list — iOS Inset Grouped list style */}
        <nav className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="ios-card overflow-hidden">
            <ul>
              {navItems.map((item, i) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    {i > 0 && <div className="ios-hairline" />}
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                        isActive
                          ? "bg-[var(--tint-soft)]"
                          : "hover:bg-[var(--bg)]"
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-[8px] flex items-center justify-center ${
                          isActive
                            ? "bg-[var(--tint)] text-white"
                            : "bg-[var(--bg)] text-[var(--tint)]"
                        }`}
                      >
                        {renderIcon(item.icon)}
                      </span>
                      <span
                        className={`flex-1 text-[15px] ${
                          isActive
                            ? "font-semibold text-[var(--tint)]"
                            : "text-[var(--fg)]"
                        }`}
                      >
                        {item.label}
                      </span>
                      {isActive && (
                        <svg
                          className="w-4 h-4 text-[var(--tint)]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Account card at bottom */}
        <div className="p-3 border-t border-[var(--border)]">
          <div className="ios-card flex items-center gap-3 px-3.5 py-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0a84ff] to-[#5e5ce6] text-white flex items-center justify-center text-base font-semibold shrink-0">
              {user ? user.name.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="ios-headline truncate leading-tight">
                {user?.name ?? "Not signed in"}
              </div>
              <div className="ios-caption leading-tight mt-0.5">
                Apple ID · iCloud
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Mobile bottom tab bar — iOS UITabBar style */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 ios-glass border-t border-[var(--border)]">
        <div className="grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 pt-2 pb-2 transition-opacity active:opacity-60"
              >
                <span
                  className={`transition-all ${
                    isActive ? "text-[var(--tint)]" : "text-[var(--fg-faint)]"
                  }`}
                >
                  {renderIcon(item.icon, 24)}
                </span>
                <span
                  className={`text-[10px] tracking-tight ${
                    isActive
                      ? "text-[var(--tint)] font-semibold"
                      : "text-[var(--fg-faint)]"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

type IconName =
  | "photos"
  | "sparkles"
  | "bubble"
  | "wand"
  | "bolt";

function renderIcon(name: IconName, size: number = 18) {
  const common = {
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
  } as const;
  switch (name) {
    case "photos":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M4 7a2 2 0 012-2h2l2-2h4l2 2h2a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V7z"
          />
          <circle cx="12" cy="13" r="3.5" strokeWidth={1.8} />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 3v4m0 10v4m9-9h-4M7 12H3m13.95 6.95l-2.83-2.83M9.88 9.88L7.05 7.05m12.9 0l-2.83 2.83M9.88 14.12l-2.83 2.83"
          />
        </svg>
      );
    case "bubble":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M21 12a8 8 0 01-11.5 7.2L4 21l1.8-5.5A8 8 0 1121 12z"
          />
        </svg>
      );
    case "wand":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M5 19l11-11m0 0l-3-3m3 3l3 3M9 7l-1.5-1.5M11 5l-1-1"
          />
        </svg>
      );
    case "bolt":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
          />
        </svg>
      );
  }
}