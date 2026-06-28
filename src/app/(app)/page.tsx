// Voyle — home page (YouTube-style video grid)
// Server Component that scans the /media directory and renders a grid of
// YouTube-style video cards. Filter chips at the top let the user narrow
// by category — purely client-side, computed from the search param.

import MediaView from "@/components/MediaView";
import { scanMediaDir } from "@/lib/media";
import { getCurrentUser } from "@/lib/user";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const items = scanMediaDir();
  const user = await getCurrentUser();
  const sp = await searchParams;
  const search = typeof sp.search === "string" ? sp.search : "";

  // Simple search-by-filename. Real search would index metadata.
  const filtered = search
    ? items.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  return (
    <div className="px-4 sm:px-6 py-4">
      {search && (
        <p className="text-sm text-[color:var(--yt-text-secondary)] mb-3">
          Results for <span className="text-[color:var(--yt-text)]">&ldquo;{search}&rdquo;</span>
          {filtered.length > 0 && (
            <>
              {" "}— {filtered.length} {filtered.length === 1 ? "item" : "items"}
            </>
          )}
        </p>
      )}
      <MediaView items={filtered} user={user} />
    </div>
  );
}