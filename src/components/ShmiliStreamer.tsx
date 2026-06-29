"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Search,
  Maximize,
  ListMusic,
} from "lucide-react";

interface ShmiliStreamerProps {
  links: { youtubeId: string; title?: string | null }[];
}

type RepeatMode = "off" | "all" | "one";

/* Shmili Streamer — an enhanced YouTube playlist player.
 *
 * Features:
 *   - Auto-advance via YouTube IFrame API onStateChange (ENDED)
 *   - Autoplay toggle (when off, pauses at the end of each video)
 *   - Repeat modes: off / repeat all / repeat one (with "1" indicator)
 *   - Shuffle (keeps current video at the top, Fisher–Yates for the rest)
 *   - Thumbnail previews (loaded from img.youtube.com — no API key needed)
 *   - Search/filter the playlist
 *   - Fullscreen toggle for the player area
 *   - Keyboard shortcuts: Space = play/pause, ← / → = prev/next, M = mute, F = fullscreen
 *   - Smooth active-state styling, hover transitions, brand-red accents
 *   - 5-second countdown overlay when transitioning to the next video
 *     (cancellable, so the user can keep watching the current one)
 */
export default function ShmiliStreamer({ links }: ShmiliStreamerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffled, setShuffled] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [repeat, setRepeat] = useState<RepeatMode>("all");
  const [order, setOrder] = useState<number[]>([]);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [search, setSearch] = useState("");
  const [nextInCountdown, setNextInCountdown] = useState<number | null>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerAreaRef = useRef<HTMLDivElement | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build the initial playback order whenever the source links change
  useEffect(() => {
    setOrder(links.map((_, i) => i));
    setCurrentIndex(0);
  }, [links]);

  // Load the YouTube IFrame API script once
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).YT?.Player) return;

    const existing = document.getElementById("youtube-iframe-api");
    if (!existing) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  }, []);

  // Create / update the player when the current video changes
  const currentVideoId =
    links[order[currentIndex] ?? 0]?.youtubeId ?? links[0]?.youtubeId;

  useEffect(() => {
    if (!currentVideoId || !containerRef.current) return;

    const tryCreate = () => {
      if (!(window as any).YT?.Player) {
        setTimeout(tryCreate, 200);
        return;
      }

      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      playerRef.current = new (window as any).YT.Player(containerRef.current, {
        videoId: currentVideoId,
        playerVars: {
          autoplay: playing ? 1 : 0,
          enablejsapi: 1,
          rel: 0,
          modestbranding: 1,
          mute: muted ? 1 : 0,
          playsinline: 1,
        },
        events: {
          onStateChange: (e: { data: number }) => {
            // YT.PlayerState values:
            //   -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
            if (e.data === 1) {
              setPlaying(true);
              clearCountdown();
            } else if (e.data === 2) {
              setPlaying(false);
              clearCountdown();
            } else if (e.data === 0) {
              // ENDED
              handleEnded();
            }
          },
        },
      });
    };

    tryCreate();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      clearCountdown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVideoId]);

  // ----- Countdown helpers (show "Next in 5..." between videos) -----
  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setNextInCountdown(null);
  }, []);

  const startCountdown = useCallback((onDone: () => void) => {
    let n = 5;
    setNextInCountdown(n);
    countdownRef.current = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearCountdown();
        onDone();
      } else {
        setNextInCountdown(n);
      }
    }, 1000);
  }, []);

  // ----- Controls -----
  const goNext = useCallback(() => {
    clearCountdown();
    setCurrentIndex((prev) => {
      const next = prev + 1;
      return next >= order.length ? 0 : next;
    });
  }, [order.length, clearCountdown]);

  const goPrev = useCallback(() => {
    clearCountdown();
    setCurrentIndex((prev) => {
      const prevIdx = prev - 1;
      return prevIdx < 0 ? order.length - 1 : prevIdx;
    });
  }, [order.length, clearCountdown]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (playing) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  }, [playing]);

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    if (muted) {
      playerRef.current.unMute();
      setMuted(false);
    } else {
      playerRef.current.mute();
      setMuted(true);
    }
  }, [muted]);

  const shuffle = useCallback(() => {
    setShuffled((s) => {
      const newShuffled = !s;
      if (newShuffled) {
        const indices = links.map((_, i) => i);
        const current = order[currentIndex] ?? 0;
        const rest = indices.filter((i) => i !== current);
        for (let i = rest.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [rest[i], rest[j]] = [rest[j], rest[i]];
        }
        setOrder([current, ...rest]);
        setCurrentIndex(0);
      } else {
        setOrder(links.map((_, i) => i));
        setCurrentIndex(0);
      }
      return newShuffled;
    });
  }, [links, order, currentIndex]);

  const cycleRepeat = useCallback(() => {
    setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"));
  }, []);

  const handleEnded = useCallback(() => {
    if (repeat === "one") {
      playerRef.current?.seekTo(0, true);
      playerRef.current?.playVideo();
      return;
    }
    if (!autoplay && repeat === "off") {
      setPlaying(false);
      return;
    }
    const isLast = currentIndex >= order.length - 1;
    if (isLast && repeat === "off") {
      setPlaying(false);
      return;
    }
    // Show countdown, then advance
    startCountdown(() => goNext());
  }, [autoplay, repeat, currentIndex, order.length, goNext, startCountdown]);

  const cancelCountdown = useCallback(() => {
    clearCountdown();
    setPlaying(false);
    playerRef.current?.pauseVideo();
  }, [clearCountdown]);

  const toggleFullscreen = useCallback(() => {
    const el = playerAreaRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // ----- Keyboard shortcuts -----
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't intercept keys when the user is typing in a search field
      const target = e.target as HTMLElement;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMute();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, goNext, goPrev, toggleMute, toggleFullscreen]);

  // ----- Filtered playlist (for search) -----
  const filteredOrder = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return order.map((linkIdx, displayIdx) => ({ linkIdx, displayIdx }));
    return order
      .map((linkIdx, displayIdx) => ({ linkIdx, displayIdx }))
      .filter(({ linkIdx }) => {
        const link = links[linkIdx];
        const title = link?.title || `Track ${linkIdx + 1}`;
        return title.toLowerCase().includes(q);
      });
  }, [order, search, links]);

  if (!links || links.length === 0) {
    return (
      <div className="rounded-2xl bg-[color:var(--yt-surface)] border border-[color:var(--yt-border)] p-8 text-center">
        <ListMusic className="w-10 h-10 mx-auto mb-3 text-[color:var(--yt-text-secondary)]" />
        <p className="text-base font-medium text-[color:var(--yt-text)]">
          No stream links configured yet
        </p>
        <p className="mt-1 text-sm text-[color:var(--yt-text-secondary)] max-w-sm mx-auto">
          Add YouTube video links to the <code>shmili_stream</code> Supabase
          table to populate this player.
        </p>
      </div>
    );
  }

  const currentLink = links[order[currentIndex] ?? 0];

  return (
    <div className="rounded-2xl bg-[color:var(--yt-surface)] border border-[color:var(--yt-border)] overflow-hidden shadow-sm">
      <div className="flex flex-col lg:flex-row">
        {/* Player area */}
        <div ref={playerAreaRef} className="flex-1 min-w-0 bg-black">
          {/* Player surface */}
          <div className="relative w-full aspect-video">
            <div ref={containerRef} className="w-full h-full" />

            {/* Countdown overlay when transitioning between videos */}
            {nextInCountdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
                <div className="text-center text-white pointer-events-auto">
                  <p className="text-xs uppercase tracking-wider opacity-80 mb-2">
                    Up next in
                  </p>
                  <p className="text-7xl font-bold tabular-nums animate-pulse">
                    {nextInCountdown}
                  </p>
                  <button
                    type="button"
                    onClick={cancelCountdown}
                    className="mt-4 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Now playing + transport */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[color:var(--yt-surface)] border-t border-[color:var(--yt-border)]">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[color:var(--yt-text)] truncate">
                {currentLink?.title || `Track ${currentIndex + 1}`}
              </p>
              <p className="text-xs text-[color:var(--yt-text-secondary)]">
                Track {currentIndex + 1} of {order.length}
                {shuffled && " · Shuffled"}
                {autoplay && " · Autoplay"}
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={goPrev}
                className="p-2 rounded-full hover:bg-[color:var(--yt-hover)] text-[color:var(--yt-text)] transition-colors"
                title="Previous (←)"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                className="p-2 rounded-full bg-[color:var(--yt-text)] text-[color:var(--yt-bg)] hover:opacity-90 hover:scale-105 active:scale-95 transition-all"
                title={playing ? "Pause (Space)" : "Play (Space)"}
              >
                {playing ? (
                  <Pause className="w-5 h-5" fill="currentColor" />
                ) : (
                  <Play className="w-5 h-5" fill="currentColor" />
                )}
              </button>
              <button
                type="button"
                onClick={goNext}
                className="p-2 rounded-full hover:bg-[color:var(--yt-hover)] text-[color:var(--yt-text)] transition-colors"
                title="Next (→)"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mode toolbar */}
          <div className="flex items-center gap-1 px-3 py-2 bg-[color:var(--yt-surface)] border-t border-[color:var(--yt-border)]">
            <button
              type="button"
              onClick={shuffle}
              className={`p-1.5 rounded-full transition-colors ${
                shuffled
                  ? "text-[color:var(--yt-text)] bg-[color:var(--yt-hover)]"
                  : "text-[color:var(--yt-text-secondary)] hover:text-[color:var(--yt-text)]"
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={cycleRepeat}
              className={`p-1.5 rounded-full relative transition-colors ${
                repeat !== "off"
                  ? "text-[color:var(--yt-text)] bg-[color:var(--yt-hover)]"
                  : "text-[color:var(--yt-text-secondary)] hover:text-[color:var(--yt-text)]"
              }`}
              title={`Repeat: ${repeat}`}
            >
              <Repeat className="w-4 h-4" />
              {repeat === "one" && (
                <span className="absolute -top-0.5 -right-0.5 text-[10px] font-bold text-[color:var(--yt-brand)]">
                  1
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setAutoplay((a) => !a)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                autoplay
                  ? "bg-[color:var(--yt-chip-active)] text-white"
                  : "bg-[color:var(--yt-chip)] text-[color:var(--yt-text-secondary)] hover:text-[color:var(--yt-text)]"
              }`}
              title="Autoplay next video"
            >
              Autoplay
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-full text-[color:var(--yt-text-secondary)] hover:text-[color:var(--yt-text)] transition-colors"
              title="Fullscreen (F)"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Playlist sidebar */}
        <div className="lg:w-80 lg:flex-shrink-0 border-t lg:border-t-0 lg:border-l border-[color:var(--yt-border)] max-h-96 lg:max-h-[640px] flex flex-col bg-[color:var(--yt-surface)]">
          <div className="px-4 pt-3 pb-2 border-b border-[color:var(--yt-border)]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--yt-text-secondary)]">
                Playlist
              </p>
              <span className="text-xs text-[color:var(--yt-text-secondary)] tabular-nums">
                {filteredOrder.length}/{order.length}
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[color:var(--yt-text-secondary)] pointer-events-none" />
              <input
                type="text"
                placeholder="Filter playlist…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-full bg-[color:var(--yt-chip)] text-[color:var(--yt-text)] placeholder:text-[color:var(--yt-text-secondary)] outline-none focus:ring-2 focus:ring-[color:var(--yt-blue)] transition-all"
              />
            </div>
          </div>

          <ul className="flex-1 overflow-y-auto">
            {filteredOrder.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-[color:var(--yt-text-secondary)]">
                No matches.
              </li>
            ) : (
              filteredOrder.map(({ linkIdx, displayIdx }) => {
                const link = links[linkIdx];
                const active = displayIdx === currentIndex;
                return (
                  <li key={linkIdx}>
                    <button
                      type="button"
                      onClick={() => setCurrentIndex(displayIdx)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-all ${
                        active
                          ? "bg-[color:var(--yt-hover)]"
                          : "hover:bg-[color:var(--yt-hover)]"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="relative flex-shrink-0 w-20 aspect-video rounded-md overflow-hidden bg-black">
                        <img
                          src={`https://img.youtube.com/vi/${link?.youtubeId}/mqdefault.jpg`}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        {/* Active play overlay */}
                        {active && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            {playing ? (
                              <div className="flex items-end gap-0.5 h-3">
                                <span className="w-0.5 bg-[color:var(--yt-brand)] animate-eq-bar-1" />
                                <span className="w-0.5 bg-[color:var(--yt-brand)] animate-eq-bar-2" />
                                <span className="w-0.5 bg-[color:var(--yt-brand)] animate-eq-bar-3" />
                              </div>
                            ) : (
                              <Play
                                className="w-4 h-4 text-white"
                                fill="currentColor"
                              />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm leading-tight truncate ${
                            active
                              ? "text-[color:var(--yt-text)] font-semibold"
                              : "text-[color:var(--yt-text)]"
                          }`}
                        >
                          {link?.title || `Track ${linkIdx + 1}`}
                        </p>
                        <p className="text-xs text-[color:var(--yt-text-secondary)] mt-0.5">
                          {active
                            ? playing
                              ? "Now playing"
                              : "Paused"
                            : `Track ${displayIdx + 1}`}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}