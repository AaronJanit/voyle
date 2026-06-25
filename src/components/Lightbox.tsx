"use client";

import { MediaItem } from "@/lib/media";

interface LightboxProps {
  items: MediaItem[];
  index: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Lightbox({
  items,
  index,
  onClose,
  onNext,
  onPrev,
}: LightboxProps) {
  const item = items[index];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white/70 hover:text-white p-2 transition-colors"
        aria-label="Close"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Prev button */}
      {items.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white/70 hover:text-white p-2 transition-colors"
          aria-label="Previous"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {/* Next button */}
      {items.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white/70 hover:text-white p-2 transition-colors"
          aria-label="Next"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      {/* Media content */}
      <div
        className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === "video" ? (
          <video
            src={`/api/media/file/${item.path}`}
            className="max-w-full max-h-[90vh] rounded-lg"
            controls
            autoPlay
            playsInline
          />
        ) : (
          <img
            src={`/api/media/file/${item.path}`}
            alt={item.name}
            className="max-w-full max-h-[90vh] rounded-lg object-contain"
          />
        )}
      </div>

      {/* Caption */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
        {item.name}{" "}
        <span className="text-white/30">
          ({index + 1} / {items.length})
        </span>
      </div>
    </div>
  );
}