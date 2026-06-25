import { scanMediaDir, MediaItem } from "@/lib/media";
import MediaGrid from "@/components/MediaGrid";
import { NavBar } from "@/components/NavBar";
import { getCurrentUser } from "@/lib/user";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const items = scanMediaDir();
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      {/* Promo banner */}
      <Link
        href="/generate"
        className="block bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 border-b border-neutral-800 hover:from-indigo-600/30 hover:via-purple-600/30 hover:to-pink-600/30 transition-colors"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-center gap-2 text-center">
          <span className="text-2xl">✨</span>
          <span className="text-white font-semibold text-sm sm:text-base">
            Unlimited AI Image!
          </span>
          <span className="text-neutral-400 text-sm hidden sm:inline">
            — generate anything you can imagine →
          </span>
        </div>
      </Link>

      {/* Catalog */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        <MediaGrid items={items as MediaItem[]} />
      </main>
    </div>
  );
}
