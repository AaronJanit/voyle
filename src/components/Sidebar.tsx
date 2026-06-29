"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, MessageSquare, Clapperboard, MessageCircle, Play, Music, Users } from "lucide-react";
import { useSidebar } from "./SidebarContext";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  tag?: string;
}

const NAV: NavItem[] = [
  { href: "/", label: "Home", icon: <Home className="w-6 h-6 shrink-0" /> },
  { href: "/shorts", label: "Shorts", icon: <Play className="w-6 h-6 shrink-0" /> },
  { href: "/muzic", label: "Muzic", icon: <Music className="w-6 h-6 shrink-0" /> },
  { href: "/channels", label: "Channels", icon: <Users className="w-6 h-6 shrink-0" /> },
];

const CHAT_NAV: NavItem[] = [
  { href: "/chat", label: "Chat to Voyle", icon: <MessageSquare className="w-6 h-6 shrink-0" /> },
  { href: "/spencer", label: "Chat to Spencer", icon: <MessageCircle className="w-6 h-6 shrink-0" /> },
];

const CREATE_NAV: NavItem[] = [
  { href: "/generate", label: "Unlimited AI Image", icon: <Sparkles className="w-6 h-6 shrink-0" /> },
  { href: "/channel", label: "My Channel", icon: <Clapperboard className="w-6 h-6 shrink-0" />, tag: "Active" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  return (
    <aside
      className={`fixed top-14 left-0 bottom-0 bg-[color:var(--yt-surface)] overflow-y-auto overflow-x-hidden pt-2 z-20 scrollbar-thin transition-[width] duration-200 ease-in-out ${
        collapsed ? "w-[72px] px-1" : "w-60 px-3"
      }`}
    >
      <ul className="space-y-1">
        {NAV.map((item) => (
          <SidebarLink key={item.label} item={item} pathname={pathname} collapsed={collapsed} />
        ))}
      </ul>
      <div className="my-2 border-t border-[color:var(--yt-border)]" />
      <SectionLabel label="Chats" collapsed={collapsed} />
      <ul className="space-y-1">
        {CHAT_NAV.map((item) => (
          <SidebarLink key={item.label} item={item} pathname={pathname} collapsed={collapsed} />
        ))}
      </ul>
      <div className="my-2 border-t border-[color:var(--yt-border)]" />
      <SectionLabel label="Create" collapsed={collapsed} />
      <ul className="space-y-1">
        {CREATE_NAV.map((item) => (
          <SidebarLink key={item.label} item={item} pathname={pathname} collapsed={collapsed} />
        ))}
      </ul>
    </aside>
  );
}

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  return (
    <p
      className={`px-3 py-1 text-xs font-medium uppercase tracking-wider text-[color:var(--yt-text-secondary)] transition-opacity duration-200 ${
        collapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
      }`}
    >
      {label}
    </p>
  );
}

function SidebarLink({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const isActive =
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href || pathname.startsWith(item.href + "/");

  if (collapsed) {
    return (
      <li>
        <Link
          href={item.href}
          className={`flex flex-col items-center gap-1 py-3 px-1 rounded-lg hover:bg-[color:var(--yt-hover)] transition-colors ${
            isActive ? "bg-[color:var(--yt-hover)] font-medium" : ""
          }`}
          title={item.label}
        >
          {item.icon}
          <span className="text-[10px] leading-tight truncate w-full text-center">
            {item.label}
          </span>
          {item.tag && (
            <span className="text-[8px] leading-none font-semibold text-[color:var(--yt-brand)]">
              {item.tag}
            </span>
          )}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        className={`yt-sidebar-link transition-colors ${
          isActive ? "bg-[color:var(--yt-hover)] font-medium" : ""
        }`}
      >
        {item.icon}
        <span className="truncate">{item.label}</span>
        {item.tag && (
          <span className="ml-auto text-[10px] leading-none font-semibold px-1.5 py-0.5 rounded bg-[color:var(--yt-brand)]/10 text-[color:var(--yt-brand)]">
            {item.tag}
          </span>
        )}
      </Link>
    </li>
  );
}