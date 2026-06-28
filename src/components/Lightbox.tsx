"use client";

import { MediaItem } from "@/lib/media";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

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
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="text-white/90 hover:bg-white/10 rounded-full p-2 transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-white/80 text-sm font-medium">
          {index + 1} / {items.length}
        </div>
        <div className="w-10" />
      </div>

      {/* Prev button */}
      {items.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white/90 hover:bg-white/10 rounded-full p-2 transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      )}

      {/* Next button */}
      {items.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white/90 hover:bg-white/10 rounded-full p-2 transition-colors"
          aria-label="Next"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      )}

      {/* Media content */}
      <div
        className="max-w-[92vw] max-h-[88vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === "video" ? (
          <video
            src={`/api/media/file/${item.path}`}
            className="max-w-full max-h-[88vh] rounded-lg"
            controls
            autoPlay
            playsInline
          />
        ) : (
          <img
            src={`/api/media/file/${item.path}`}
            alt={item.name}
            className="max-w-full max-h-[88vh] object-contain"
          />
        )}
      </div>

      {/* Bottom info bar */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 px-4 py-3 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white/70 text-sm">{item.name}</span>
      </div>
    </div>
  );
}