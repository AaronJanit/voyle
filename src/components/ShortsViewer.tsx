"use client";

import { MediaItem } from "@/lib/media";
import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MIN_DISPLAY_MS = 5000; // every item shows for at least 5 seconds

export default function ShortsViewer({ items }: { items: MediaItem[] }) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0..1
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const item = items[index];

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % items.length);
  }, [items.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + items.length) % items.length);
  }, [items.length]);

  // Drive the progress bar + auto-advance.
  // For videos: progress follows currentTime / duration; advance on ended (but not before MIN_DISPLAY_MS).
  // For images/gifs: a 5-second linear progress bar, then advance.
  useEffect(() => {
    clearTimers();
    setProgress(0);

    const startedAt = performance.now();

    if (item?.type === "video") {
      const video = videoRef.current;
      const tick = () => {
        const v = videoRef.current;
        if (v && v.duration && Number.isFinite(v.duration) && v.duration > 0) {
          setProgress(Math.min(1, v.currentTime / v.duration));
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      const onEnded = () => {
        const elapsed = performance.now() - startedAt;
        const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
        timerRef.current = window.setTimeout(goNext, wait);
      };
      if (video) {
        video.addEventListener("ended", onEnded);
        video.play().catch(() => {});
        return () => {
          video.removeEventListener("ended", onEnded);
          clearTimers();
        };
      }
      return clearTimers;
    }

    // Image / gif: linear 5s progress
    const start = performance.now();
    const tickImg = () => {
      const elapsed = performance.now() - start;
      setProgress(Math.min(1, elapsed / MIN_DISPLAY_MS));
      if (elapsed < MIN_DISPLAY_MS) {
        rafRef.current = requestAnimationFrame(tickImg);
      }
    };
    rafRef.current = requestAnimationFrame(tickImg);
    timerRef.current = window.setTimeout(goNext, MIN_DISPLAY_MS);

    return clearTimers;
  }, [index, item, goNext, clearTimers]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  if (items.length === 0) return null;

  return (
    <div className="relative h-full w-full bg-black flex items-center justify-center overflow-hidden select-none">
      {/* Progress bars (one per item, like stories) */}
      <div className="absolute top-2 left-0 right-0 z-20 flex gap-1 px-2">
        {items.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden"
          >
            <div
              className="h-full bg-white transition-[width] duration-100 ease-linear"
              style={{ width: i < index ? "100%" : i === index ? `${progress * 100}%` : "0%" }}
            />
          </div>
        ))}
      </div>

      {/* Tap zones for prev/next */}
      <button
        className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
        onClick={goPrev}
        aria-label="Previous"
      />
      <button
        className="absolute right-0 top-0 bottom-0 w-2/3 z-10 cursor-pointer"
        onClick={goNext}
        aria-label="Next"
      />

      {/* Media */}
      <div className="relative h-full w-full flex items-center justify-center">
        {item.type === "video" ? (
          <video
            ref={videoRef}
            key={item.id}
            src={`/api/media/file/${item.path}`}
            className="max-h-full max-w-full object-contain"
            playsInline
            muted
            preload="auto"
          />
        ) : (
          <img
            key={item.id}
            src={`/api/media/file/${item.path}`}
            alt={item.name}
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>

      {/* Bottom caption */}
      <div className="absolute bottom-4 left-0 right-0 z-20 px-4 pointer-events-none">
        <p className="text-white text-sm font-medium drop-shadow">{item.name}</p>
        <p className="text-white/60 text-xs mt-0.5">
          {index + 1} / {items.length}
        </p>
      </div>

      {/* Side nav arrows (desktop) */}
      <button
        onClick={goPrev}
        className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Previous"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={goNext}
        className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Next"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}