"use client";

import { MediaItem } from "@/lib/media";
import { useState, useEffect, useCallback } from "react";

interface Props {
  item: MediaItem;
  origin: string;
}

export default function ShareClient({ item, origin }: Props) {
  const mediaUrl = `${origin}/api/media/file/${item.path}`;
  const pageUrl = `${origin}/p/${encodeURIComponent(item.path)}`;
  const embedUrl = `${origin}/embed/${encodeURIComponent(item.path)}`;
  const oembedUrl = `${origin}/api/oembed?url=${encodeURIComponent(pageUrl)}`;

  const [copied, setCopied] = useState<"link" | "embed" | null>(null);

  const copy = useCallback(async (text: string, which: "link" | "embed") => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(which);
    setTimeout(() => setCopied(null), 1800);
  }, []);

  // Keyboard shortcuts: Esc to go home, arrows for prev/next
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") window.location.href = `${origin}/`;
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [origin]);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10">
        <a
          href={`${origin}/`}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          voyle
        </a>
        <a
          href={`${origin}/`}
          className="text-white/60 hover:text-white text-sm transition-colors"
        >
          open full gallery →
        </a>
      </header>

      {/* Media */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 min-h-0">
        <div className="max-w-5xl w-full flex flex-col items-center">
          {item.type === "video" ? (
            <video
              src={mediaUrl}
              controls
              autoPlay
              playsInline
              className="max-w-full max-h-[70vh] rounded-lg shadow-2xl"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl}
              alt={item.name}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
            />
          )}

          <div className="mt-6 text-center max-w-2xl">
            <h1 className="text-lg sm:text-xl font-medium text-white/90 break-words">
              {item.name}
            </h1>
            <p className="text-white/50 text-xs mt-1">
              {item.isGenerated ? "AI generated" : item.type} ·{" "}
              {(item.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
      </div>

      {/* Share bar */}
      <footer className="border-t border-white/10 bg-black/40 backdrop-blur px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <svg
                className="w-4 h-4 text-white/40 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 015.656 0l1.415 1.415a4 4 0 010 5.656l-3 3a4 4 0 01-5.656 0M10.172 13.828a4 4 0 01-5.656 0l-1.415-1.415a4 4 0 010-5.656l3-3a4 4 0 015.656 0"
                />
              </svg>
              <code className="text-xs text-white/70 truncate flex-1 font-mono">
                {pageUrl}
              </code>
            </div>
            <button
              onClick={() => copy(pageUrl, "link")}
              className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors whitespace-nowrap"
            >
              {copied === "link" ? "copied ✓" : "copy link"}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <code className="text-xs text-white/70 truncate flex-1 font-mono">
                {`<iframe src="${embedUrl}" width="640" height="480" allowfullscreen></iframe>`}
              </code>
            </div>
            <button
              onClick={() =>
                copy(
                  `<iframe src="${embedUrl}" width="640" height="480" allowfullscreen frameborder="0"></iframe>`,
                  "embed"
                )
              }
              className="px-4 py-2 bg-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors whitespace-nowrap border border-white/10"
            >
              {copied === "embed" ? "copied ✓" : "copy embed"}
            </button>
          </div>

          {/* Social share targets */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-white/40">share:</span>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(item.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/70 hover:text-white underline underline-offset-2"
            >
              twitter
            </a>
            <span className="text-white/20">·</span>
            <a
              href={`https://www.reddit.com/submit?url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(item.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/70 hover:text-white underline underline-offset-2"
            >
              reddit
            </a>
            <span className="text-white/20">·</span>
            <a
              href={`mailto:?subject=${encodeURIComponent(item.name)}&body=${encodeURIComponent(pageUrl)}`}
              className="text-xs text-white/70 hover:text-white underline underline-offset-2"
            >
              email
            </a>
            <span className="text-white/20">·</span>
            <span className="text-xs text-white/40">
              oembed: <code className="text-white/50">{oembedUrl}</code>
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}