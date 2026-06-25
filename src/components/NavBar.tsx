// Voyle — shared nav bar used on all authenticated pages
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { getCurrentUser } from "@/lib/user";

export async function NavBar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#e0e0e0]">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: logo + nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-medium text-[#5f6368] tracking-tight">
            {/* Google Photos-style pinwheel */}
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="2" fill="#5f6368" />
              <path d="M12 2C9.243 2 7 4.243 7 7c0 .85.22 1.648.6 2.343C6.34 8.846 4.8 8 3 8c-1.657 0-3 1.343-3 3s1.343 3 3 3c1.8 0 3.34-.846 4.6-1.343C7.22 13.352 7 14.15 7 15c0 2.757 2.243 5 5 5s5-2.243 5-5c0-.85-.22-1.648-.6-2.343C18.66 13.154 20.2 14 22 14c1.657 0 3-1.343 3-3s-1.343-3-3-3c-1.8 0-3.34.846-4.6 1.343C17.78 8.648 18 7.85 18 7c0-2.757-2.243-5-5-5z" fill="#ea4335" opacity="0" />
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
            <span className="text-[#5f6368]">Photos</span>
          </Link>
          <Link
            href="/generate"
            className="text-[#5f6368] hover:text-[#202124] text-sm transition-colors"
          >
            Generate
          </Link>
        </div>

        {/* Right: user + logout */}
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-[#5f6368] text-sm hidden sm:inline">
              {user.name}
            </span>
          )}
          {user && (
            <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-sm font-medium">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}