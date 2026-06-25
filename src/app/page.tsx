import { scanMediaDir, MediaItem } from "@/lib/media";
import MediaGrid from "@/components/MediaGrid";
import LogoutButton from "@/components/LogoutButton";
import { getCurrentUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function Home() {
  const items = scanMediaDir();
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav bar */}
      <header className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur border-b border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white tracking-tight lowercase">
            voyle
          </h1>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-neutral-400 text-sm hidden sm:inline">
                hi, {user.name}
              </span>
            )}
            <span className="text-neutral-600 text-sm hidden sm:inline">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Catalog */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        <MediaGrid items={items as MediaItem[]} />
      </main>
    </div>
  );
}
