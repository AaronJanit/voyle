// Voyle — shared nav bar used on all authenticated pages
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { getCurrentUser } from "@/lib/user";

export async function NavBar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur border-b border-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-2xl font-bold text-white tracking-tight lowercase">
            voyle
          </Link>
          <Link
            href="/generate"
            className="text-neutral-400 hover:text-white text-sm transition-colors"
          >
            generate
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-neutral-400 text-sm hidden sm:inline">
              hi, {user.name}
            </span>
          )}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}