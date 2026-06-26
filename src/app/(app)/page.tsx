import { scanMediaDir, MediaItem } from "@/lib/media";
import MediaView from "@/components/MediaView";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const items = scanMediaDir();
  const regularItems = items.filter((i) => !i.isGenerated);
  const generatedItems = items.filter((i) => i.isGenerated);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top action bar */}
      <div className="px-4 sm:px-8 py-4 flex items-center justify-between border-b border-[#e0e0e0]">
        <h1 className="text-2xl font-normal text-[#202124]">
          {regularItems.length > 0 ? "Photos" : ""}
        </h1>
        <Link
          href="/generate"
          className="flex items-center gap-2 px-4 py-2 bg-[#1a73e8] hover:bg-[#1765cc] text-white text-sm font-medium rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          Create with AI
        </Link>
      </div>

      {/* Catalog */}
      <main className="flex-1 max-w-[1600px] w-full px-4 sm:px-8 py-6 space-y-10">
        {/* Regular media */}
        <section>
          <MediaView items={regularItems as MediaItem[]} />
        </section>

        {/* AI-generated media */}
        {generatedItems.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#202124] text-base font-medium">
                AI generated
                <span className="ml-2 text-[#80868b] font-normal text-sm">
                  {generatedItems.length} {generatedItems.length === 1 ? "image" : "images"}
                </span>
              </h2>
              <Link
                href="/generate"
                className="text-[#1a73e8] hover:text-[#1765cc] text-sm transition-colors"
              >
                Generate more
              </Link>
            </div>
            <MediaView items={generatedItems as MediaItem[]} />
          </section>
        )}
      </main>
    </div>
  );
}
