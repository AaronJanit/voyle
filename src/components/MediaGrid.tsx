"use client";

import { MediaItem } from "@/lib/media";
import { useState, useEffect, useCallback } from "react";
import Lightbox from "./Lightbox";

export default function MediaGrid({ items }: { items: MediaItem[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const next = useCallback(
    () => setLightboxIndex((i) => (i === null ? i : (i + 1) % items.length)),
    [items.length]
  );
  const prev = useCallback(
    () =>
      setLightboxIndex((i) =>
        i === null ? i : (i - 1 + items.length) % items.length
      ),
    [items.length]
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, closeLightbox, next, prev]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-neutral-600">
        <p className="text-lg mb-2">no media yet</p>
        <p className="text-sm">
          drop photos, gifs, and videos into the{" "}
          <code className="text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded">
            /media
          </code>{" "}
          folder
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 space-y-3">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => setLightboxIndex(i)}
            className="block w-full break-inside-avoid rounded-lg overflow-hidden bg-neutral-900 hover:opacity-80 transition-opacity group relative"
          >
            {item.type === "video" ? (
              <video
                src={`/api/media/file/${item.path}`}
                className="w-full h-auto object-cover"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={`/api/media/file/${item.path}`}
                alt={item.name}
                loading="lazy"
                className="w-full h-auto object-cover"
              />
            )}
            {item.type === "video" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/50 rounded-full w-10 h-10 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          items={items}
          index={lightboxIndex}
          onClose={closeLightbox}
          onNext={next}
          onPrev={prev}
        />
      )}
    </>
  );
}