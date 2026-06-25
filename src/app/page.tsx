import { scanMediaDir, MediaItem } from "@/lib/media";
import MediaGrid from "@/components/MediaGrid";
import { NavBar } from "@/components/NavBar";
import { getCurrentUser } from "@/lib/user";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const items = scanMediaDir();
  const user = await getCurrentUser();
  const regularItems = items.filter((i) => !i.isGenerated);
  const generatedItems = items.filter((i) => i.isGenerated);

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
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-6 space-y-10">
        {/* Regular media */}
        <section>
          <h2 className="text-neutral-500 text-sm font-medium mb-4">
            {regularItems.length} {regularItems.length === 1 ? "item" : "items"}
          </h2>
          <MediaGrid items={regularItems as MediaItem[]} />
        </section>

        {/* AI-generated media */}
        {generatedItems.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-neutral-500 text-sm font-medium flex items-center gap-2">
                <span className="text-neutral-400">✨ AI generated</span>
                <span className="text-neutral-700">
                  {generatedItems.length} {generatedItems.length === 1 ? "image" : "images"}
                </span>
              </h2>
              <Link
                href="/generate"
                className="text-neutral-400 hover:text-white text-sm transition-colors"
              >
                generate more →
              </Link>
            </div>
            <MediaGrid items={generatedItems as MediaItem[]} />
          </section>
        )}
      </main>
    </div>
  );
}
