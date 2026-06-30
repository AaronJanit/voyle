// Voyle — embeddable iframe viewer (iOS-styled)
// Renders a single media item with the absolute minimum chrome.

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { scanMediaDir, mediaUrl } from "@/lib/media";
import { getCurrentUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "voyle embed",
    robots: { index: false, follow: false },
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

async function findItem(id: string) {
  const decoded = decodeURIComponent(id);
  const items = await scanMediaDir();
  return items.find((it) => it.path === decoded) ?? null;
}

export default async function EmbedPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const item = await findItem(id);
  if (!item) notFound();

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const origin = `${proto}://${host}`;
  const mediaUrlStr = mediaUrl(item.path);
  const pageUrl = `${origin}/p/${encodeURIComponent(item.path)}`;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Media */}
      <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
        {item.type === "video" ? (
          <video
            src={mediaUrlStr}
            controls
            autoPlay
            muted
            loop
            playsInline
            className="max-w-full max-h-full object-contain rounded-[14px]"
            style={{ maxHeight: "calc(100vh - 40px)" }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrlStr}
            alt={item.name}
            className="max-w-full max-h-full object-contain rounded-[14px]"
            style={{ maxHeight: "calc(100vh - 40px)" }}
            loading="eager"
            decoding="async"
          />
        )}
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between px-3 py-1.5 bg-black/70 backdrop-blur-xl border-t border-white/10 text-[11px] text-white/55 leading-none">
        <a
          href={pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white/90 transition-colors truncate max-w-[70%]"
        >
          {item.name}
        </a>
        <a
          href={origin}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white/90 transition-colors whitespace-nowrap flex items-center gap-1"
        >
          <span className="font-semibold">voyle</span>
          <span>↗</span>
        </a>
      </footer>
    </div>
  );
}