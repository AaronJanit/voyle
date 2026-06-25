// Voyle — embeddable iframe viewer
// Public route that renders a single media item with the absolute minimum
// chrome. Designed to be embedded in other sites via <iframe>. No auth, no
// chat widget, no nav, no analytics. Just the image/video + a tiny credit.
//
// Security headers set to allow framing from any origin.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { scanMediaDir } from "@/lib/media";

export const dynamic = "force-dynamic";

// Allow this page to be framed from anywhere (X-Frame-Options: DENY would
// block iframes — we want the opposite). Same-origin policy still protects
// the parent from anything we send.
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "voyle embed",
    robots: { index: false, follow: false }, // don't index embed URLs
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function findItem(id: string) {
  const decoded = decodeURIComponent(id);
  return scanMediaDir().find((it) => it.path === decoded) ?? null;
}

export default async function EmbedPage({ params }: PageProps) {
  const { id } = await params;
  const item = findItem(id);
  if (!item) notFound();

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const origin = `${proto}://${host}`;
  const mediaUrl = `${origin}/api/media/file/${item.path}`;
  const pageUrl = `${origin}/p/${encodeURIComponent(item.path)}`;

  return (
    <main className="min-h-screen bg-black flex flex-col">
      {/* Media — fills the iframe */}
      <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
        {item.type === "video" ? (
          <video
            src={mediaUrl}
            controls
            autoPlay
            muted
            loop
            playsInline
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: "calc(100vh - 32px)" }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl}
            alt={item.name}
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: "calc(100vh - 32px)" }}
            loading="eager"
            decoding="async"
          />
        )}
      </div>

      {/* Tiny footer credit — opens the share page in a new tab */}
      <footer className="flex items-center justify-between px-3 py-1.5 bg-black/80 backdrop-blur border-t border-white/10 text-[10px] text-white/50 leading-none">
        <a
          href={pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white/80 transition-colors truncate max-w-[70%]"
        >
          {item.name}
        </a>
        <a
          href={origin}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white/80 transition-colors whitespace-nowrap"
        >
          voyle ↗
        </a>
      </footer>
    </main>
  );
}