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
        className="block bg-[#1a73e8] hover:bg-[#1765cc] transition-colors"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-2 text-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <span className="text-white font-medium text-sm">
            Create with AI
          </span>
          <span className="text-white/80 text-sm hidden sm:inline">
            — generate anything you can imagine →
          </span>
        </div>
      </Link>

      {/* Catalog */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-6">
        <MediaGrid items={items as MediaItem[]} />
      </main>
    </div>
  );
}
