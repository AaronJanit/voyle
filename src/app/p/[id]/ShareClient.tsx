"use client";

import { MediaItem, mediaUrl } from "@/lib/media";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, Link as LinkIcon } from "lucide-react";

interface Props {
  item: MediaItem;
  origin: string;
}

export default function ShareClient({ item, origin }: Props) {
  const mediaUrlStr = mediaUrl(item.path);
  const pageUrl = `${origin}/p/${encodeURIComponent(item.path)}`;
  const embedUrl = `${origin}/embed/${encodeURIComponent(item.path)}`;

  const [copied, setCopied] = useState<"link" | "embed" | null>(null);

  const copy = useCallback(async (text: string, which: "link" | "embed") => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") window.location.href = `${origin}/`;
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [origin]);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* iOS-style sticky nav */}
      <header className="sticky top-0 z-30 bg-black/60 backdrop-blur-xl border-b border-white/10">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          <a
            href={`${origin}/`}
            className="flex items-center gap-2 ios-callout text-white/80 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
            Library
          </a>
          <a
            href={`${origin}/`}
            className="ios-callout text-white/60 hover:text-white"
          >
            Open gallery →
          </a>
        </div>
      </header>

      {/* Media */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 min-h-0">
        <div className="max-w-5xl w-full flex flex-col items-center">
          {item.type === "video" ? (
            <video
              src={mediaUrlStr}
              controls
              autoPlay
              playsInline
              className="max-w-full max-h-[70vh] rounded-[18px] shadow-2xl"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrlStr}
              alt={item.name}
              className="max-w-full max-h-[70vh] object-contain rounded-[18px] shadow-2xl"
            />
          )}

          <div className="mt-6 text-center max-w-2xl">
            <h1 className="ios-title text-white/90 break-words">{item.name}</h1>
            <p className="ios-footnote text-white/50 mt-1">
              {item.isGenerated ? "AI generated" : item.type} ·{" "}
              {(item.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
      </div>

      {/* Share sheet — iOS style */}
      <footer className="border-t border-white/10 bg-black/40 backdrop-blur-xl px-4 sm:px-6 py-5">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Link row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white/10 rounded-[14px] px-3.5 py-3 border border-white/10">
              <LinkIcon className="w-4 h-4 text-white/50 flex-shrink-0" />
              <code className="text-[13px] text-white/70 truncate flex-1 font-mono">
                {pageUrl}
              </code>
            </div>
            <button
              onClick={() => copy(pageUrl, "link")}
              className="ios-btn-primary !py-2.5 !px-5 !text-[15px] whitespace-nowrap"
            >
              {copied === "link" ? "Copied ✓" : "Copy link"}
            </button>
          </div>

          {/* Embed row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-[14px] px-3.5 py-3 border border-white/10">
              <code className="text-[12px] text-white/60 truncate flex-1 font-mono">
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
              className="ios-btn-secondary !py-2.5 !px-5 !text-[15px] !bg-white/15 !text-white whitespace-nowrap"
            >
              {copied === "embed" ? "Copied ✓" : "Copy embed"}
            </button>
          </div>

          {/* Social row — iOS app icon style */}
          <div className="flex items-center gap-3 pt-2">
            <span className="ios-footnote text-white/40">Share:</span>
            <div className="flex gap-2">
              <SocialChip
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(item.name)}`}
                label="Twitter"
                color="bg-[#1d9bf0]"
              />
              <SocialChip
                href={`https://www.reddit.com/submit?url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(item.name)}`}
                label="Reddit"
                color="bg-[#ff4500]"
              />
              <SocialChip
                href={`mailto:?subject=${encodeURIComponent(item.name)}&body=${encodeURIComponent(pageUrl)}`}
                label="Mail"
                color="bg-[#0a84ff]"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SocialChip({
  href,
  label,
  color,
}: {
  href: string;
  label: string;
  color: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-[12px] font-semibold active:scale-95 transition`}
    >
      {label[0]}
    </a>
  );
}