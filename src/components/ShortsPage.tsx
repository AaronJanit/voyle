"use client";

import { MediaItem, mediaUrl } from "@/lib/media";
import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Heart, ThumbsDown, Volume2, VolumeX, Shuffle } from "lucide-react";

const MIN_DISPLAY_MS = 5000; // images/gifs show for at least 5 s

/* ── Fisher–Yates shuffle ────────────────────────────────────────── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  items: MediaItem[];
}

export default function ShortsPage({ items }: Props) {
  const [order, setOrder] = useState<MediaItem[]>([]);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [dislikes, setDislikes] = useState<Record<string, boolean>>({});

  // Shuffle once on mount
  useEffect(() => {
    setOrder(shuffle(items));
  }, [items]);

  const reshuffle = useCallback(() => {
    setOrder((prev) => shuffle(prev));
    setIndex(0);
  }, []);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % order.length);
  }, [order.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + order.length) % order.length);
  }, [order.length]);

  const toggleLike = useCallback((id: string) => {
    setLikes((p) => ({ ...p, [id]: !p[id] }));
    setDislikes((p) => ({ ...p, [id]: false }));
  }, []);
  const toggleDislike = useCallback((id: string) => {
    setDislikes((p) => ({ ...p, [id]: !p[id] }));
    setLikes((p) => ({ ...p, [id]: false }));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "m" || e.key === "M") {
        setMuted((m) => !m);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  if (order.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] text-[color:var(--yt-text-secondary)]">
        <p className="text-lg">No media to show</p>
        <p className="text-sm mt-1">Upload some videos to get started.</p>
      </div>
    );
  }

  const item = order[index];

  return (
    <div className="flex justify-center bg-black h-[calc(100vh-56px)] overflow-hidden">
      <div className="relative h-full w-full max-w-[480px] flex items-center justify-center">
        <ShortSlide
          key={item.id}
          item={item}
          index={index}
          total={order.length}
          muted={muted}
          setMuted={setMuted}
          liked={!!likes[item.id]}
          disliked={!!dislikes[item.id]}
          onLike={() => toggleLike(item.id)}
          onDislike={() => toggleDislike(item.id)}
          onReshuffle={reshuffle}
          onAdvance={goNext}
        />
      </div>

      {/* Left arrow (desktop) */}
      <button
        onClick={goPrev}
        className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Previous"
      >
        <ChevronLeft className="w-7 h-7" />
      </button>

      {/* Right arrow (desktop) */}
      <button
        onClick={goNext}
        className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Next"
      >
        <ChevronRight className="w-7 h-7" />
      </button>
    </div>
  );
}

/* ── Single slide ────────────────────────────────────────────────── */
interface SlideProps {
  item: MediaItem;
  index: number;
  total: number;
  muted: boolean;
  setMuted: (m: boolean) => void;
  liked: boolean;
  disliked: boolean;
  onLike: () => void;
  onDislike: () => void;
  onReshuffle: () => void;
  onAdvance: () => void;
}

function ShortSlide({
  item,
  index,
  total,
  muted,
  setMuted,
  liked,
  disliked,
  onLike,
  onDislike,
  onReshuffle,
  onAdvance,
}: SlideProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

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

  // Playback + progress logic
  useEffect(() => {
    clearTimers();
    setProgress(0);
    setPaused(false);

    const startedAt = performance.now();

    if (item.type === "video") {
      const v = videoRef.current;
      if (!v) return;
      v.muted = muted;
      v.currentTime = 0;
      v.play().catch(() => {});

      const tick = () => {
        if (v.duration && Number.isFinite(v.duration) && v.duration > 0) {
          setProgress(Math.min(1, v.currentTime / v.duration));
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      const onEnded = () => {
        const elapsed = performance.now() - startedAt;
        const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
        timerRef.current = window.setTimeout(onAdvance, wait);
      };
      v.addEventListener("ended", onEnded);
      return () => {
        v.removeEventListener("ended", onEnded);
        clearTimers();
      };
    }

    // Image / gif: linear 5 s progress
    const start = performance.now();
    const tickImg = () => {
      const elapsed = performance.now() - start;
      setProgress(Math.min(1, elapsed / MIN_DISPLAY_MS));
      if (elapsed < MIN_DISPLAY_MS) {
        rafRef.current = requestAnimationFrame(tickImg);
      }
    };
    rafRef.current = requestAnimationFrame(tickImg);
    timerRef.current = window.setTimeout(onAdvance, MIN_DISPLAY_MS);

    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const togglePause = useCallback(() => {
    if (item.type !== "video") return;
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  }, [item.type]);

  return (
    <div className="relative h-full w-full flex items-center justify-center bg-black overflow-hidden">
      {/* Tap zones: left third = prev (handled by parent arrow), right = next */}
      <button
        className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
        onClick={onAdvance}
        aria-label="Next"
      />
      <button
        className="absolute right-0 top-0 bottom-0 w-2/3 z-10 cursor-pointer"
        onClick={onAdvance}
        aria-label="Next"
      />

      {/* Media */}
      <div
        className="relative h-full w-full flex items-center justify-center cursor-pointer"
        onClick={togglePause}
      >
        {item.type === "video" ? (
          <video
            ref={videoRef}
            src={`mediaUrl(item.path)`}
            className="max-h-full max-w-full object-contain"
            playsInline
            loop={false}
            preload="auto"
          />
        ) : (
          <img
            src={`mediaUrl(item.path)`}
            alt={item.name}
            className="max-h-full max-w-full object-contain"
            draggable={false}
          />
        )}

        {/* Pause overlay */}
        {item.type === "video" && paused && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Top gradient + index */}
      <div className="absolute top-0 left-0 right-0 z-20 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
      <div className="absolute top-3 left-4 z-20 text-white/80 text-xs font-medium">
        {index + 1} / {total}
      </div>

      {/* Right action rail (YouTube-style) */}
      <div className="absolute right-2 sm:right-4 bottom-28 z-30 flex flex-col items-center gap-4">
        <ActionButton
          onClick={onLike}
          active={liked}
          activeColor="text-[#ff4444]"
          label={liked ? "1" : "Like"}
        >
          <Heart className="w-7 h-7" fill={liked ? "currentColor" : "none"} />
        </ActionButton>

        <ActionButton
          onClick={onDislike}
          active={disliked}
          activeColor="text-white"
          label={disliked ? "1" : "Dislike"}
        >
          <ThumbsDown className="w-7 h-7" fill={disliked ? "currentColor" : "none"} />
        </ActionButton>

        <ActionButton onClick={() => setMuted(!muted)} active={false} activeColor="" label="Mute">
          {muted ? <VolumeX className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
        </ActionButton>

        <ActionButton onClick={onReshuffle} active={false} activeColor="" label="Shuffle">
          <Shuffle className="w-6 h-6" />
        </ActionButton>
      </div>

      {/* Bottom info + progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="h-1 w-full bg-white/20">
          <div
            className="h-full bg-white transition-[width] duration-100 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="bg-gradient-to-t from-black/70 to-transparent px-4 pt-3 pb-4 pr-20">
          <p className="text-white text-sm font-medium drop-shadow truncate">{item.name}</p>
          <p className="text-white/50 text-xs mt-0.5 capitalize">{item.type}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Action button helper ─────────────────────────────────────────── */
function ActionButton({
  onClick,
  active,
  activeColor,
  label,
  children,
}: {
  onClick: () => void;
  active: boolean;
  activeColor: string;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-colors ${
        active ? activeColor : "text-white/90 hover:text-white"
      }`}
    >
      <div className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
        {children}
      </div>
      {label !== undefined && label !== "" && (
        <span className="text-white text-xs font-medium">{label}</span>
      )}
    </button>
  );
}