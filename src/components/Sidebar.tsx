"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const HOME_ICON = (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M12 4.33l7 6.12V20h-4v-6H9v6H5v-9.55l7-6.12M12 3 4 10v10a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-5h4v5a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V10l-8-7z" />
  </svg>
);
const GENERATE_ICON = (
  <svg
    viewBox="0 0 24 24"
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.08A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.08A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.08A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.08A1.7 1.7 0 0 0 19.4 15z" />
  </svg>
);
const CHAT_ICON = (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M11 7l6 3.5-6 3.5V7zm7 13H4V6H3v15h15v-1zm3-2H6V3h15v15zM7 4v13h13V4H7z" />
  </svg>
);

/* Only routes that actually exist are listed. Each one has a working
 * page behind it:
 *  - /            → YouTube-style media grid
 *  - /generate    → Create with AI
 *  - /chat        → Live chat panel
 *
 * Decorative links (Shorts, Subscriptions, History, Playlists, a fake
 * Subscriptions list, the Explore block, and the footer About/Press/etc
 * links) were removed because none of them had a destination. */
const NAV: NavItem[] = [
  { href: "/", label: "Home", icon: HOME_ICON },
  { href: "/generate", label: "Generate", icon: GENERATE_ICON },
  { href: "/chat", label: "Chat", icon: CHAT_ICON },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  // ----- Mini rail (collapsed) ------------------------------------------
  if (collapsed) {
    return (
      <aside className="fixed top-14 left-0 bottom-0 w-[72px] bg-[color:var(--yt-surface)] overflow-y-auto pt-2 px-1 z-20 scrollbar-thin">
        <ul className="space-y-1">
          {NAV.map((item) => (
            <SidebarLink key={item.label} item={item} pathname={pathname} mini />
          ))}
        </ul>
      </aside>
    );
  }

  // ----- Full sidebar ---------------------------------------------------
  return (
    <aside className="fixed top-14 left-0 bottom-0 w-60 bg-[color:var(--yt-surface)] overflow-y-auto pt-2 px-3 z-20 scrollbar-thin">
      <ul className="space-y-1">
        {NAV.map((item) => (
          <SidebarLink key={item.label} item={item} pathname={pathname} />
        ))}
      </ul>
    </aside>
  );
}

function SidebarLink({
  item,
  pathname,
  mini = false,
}: {
  item: NavItem;
  pathname: string;
  mini?: boolean;
}) {
  const isActive =
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href || pathname.startsWith(item.href + "/");
  const base = mini
    ? "flex flex-col items-center gap-1 py-3 px-1 rounded-lg hover:bg-[color:var(--yt-hover)]"
    : "yt-sidebar-link";
  const active = isActive ? "bg-[color:var(--yt-hover)] font-medium" : "";
  return (
    <li>
      <Link href={item.href} className={`${base} ${active}`}>
        {item.icon}
        {mini ? (
          <span className="text-[10px] leading-tight">{item.label}</span>
        ) : (
          <span className="truncate">{item.label}</span>
        )}
      </Link>
    </li>
  );
}