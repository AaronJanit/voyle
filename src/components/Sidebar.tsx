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
      label: "Photos",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: "/generate",
      label: "Generate",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      href: "/chat",
      label: "Chat to Voyle",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-56 bg-[#f8f9fa] border-r border-[#e0e0e0] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5">
        <Link href="/" className="flex items-center gap-2">
          <svg className="w-7 h-7" viewBox="0 0 24 24">
            <path d="M12 3.5l2.5 4.5L12 12 9.5 8z" fill="#4285F4" />
            <path d="M12 3.5l4.5 2.5L12 12z" fill="#34A853" />
            <path d="M16.5 6L21 8.5 12 12z" fill="#FBBC04" />
            <path d="M21 8.5v5L12 12z" fill="#EA4335" />
            <path d="M21 13.5L16.5 18 12 12z" fill="#4285F4" />
            <path d="M16.5 18L12 20.5 12 12z" fill="#34A853" />
            <path d="M12 20.5L7.5 18 12 12z" fill="#FBBC04" />
            <path d="M7.5 18L3 13.5 12 12z" fill="#EA4335" />
            <path d="M3 13.5v-5L12 12z" fill="#4285F4" />
            <path d="M3 8.5L7.5 6 12 12z" fill="#34A853" />
            <path d="M7.5 6L12 3.5 12 12z" fill="#FBBC04" />
          </svg>
          <span className="text-[#5f6368] text-lg font-medium tracking-tight">Photos</span>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-sm transition-colors ${
                isActive
                  ? "bg-[#d2e3fc] text-[#001d35] font-medium"
                  : "text-[#5f6368] hover:bg-[#e8eaed]"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user + sign out */}
      <div className="p-3 border-t border-[#e0e0e0] flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {user && (
            <>
              <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-[#5f6368] text-sm truncate">{user.name}</span>
            </>
          )}
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}