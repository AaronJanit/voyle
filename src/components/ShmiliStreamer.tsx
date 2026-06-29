"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, SkipBack, SkipForward, Shuffle } from "lucide-react";

interface ShmiliStreamerProps {
  links: { youtubeId: string; title?: string | null }[];
}

/* Shmili Streamer — a YouTube playlist player.
 *
 * Plays through a prewritten list of YouTube links, auto-advancing to the
 * next video when the current one ends. Uses the YouTube IFrame API
 * (onStateChange) to detect ENDED state and advance.
 *
 * Controls: Previous / Next / Shuffle. A playlist sidebar shows all links
 * with the current one highlighted; clicking a link jumps to it.
 */
export default function ShmiliStreamer({ links }: ShmiliStreamerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffled, setShuffled] = useState(false);
  const [order, setOrder] = useState<number[]>([]);
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiReadyRef = useRef(false);

  // Build the initial playback order (sequential indices)
  useEffect(() => {
    setOrder(links.map((_, i) => i));
    setCurrentIndex(0);
  }, [links]);

  // Load the YouTube IFrame API script once
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).YT?.Player) {
      apiReadyRef.current = true;
      return;
    }

    // Inject the IFrame API script
    const existing = document.getElementById("youtube-iframe-api");
    if (!existing) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }

    // Set up the callback the API calls when ready
    (window as any).onYouTubeIframeAPIReady = () => {
      apiReadyRef.current = true;
    };
  }, []);

  // Create / update the player when the current video changes
  const currentVideoId =
    links[order[currentIndex] ?? 0]?.youtubeId ?? links[0]?.youtubeId;

  useEffect(() => {
    if (!currentVideoId || !containerRef.current) return;

    // Wait for the API to be ready, then create the player
    const tryCreate = () => {
      if (!(window as any).YT?.Player) {
        setTimeout(tryCreate, 200);
        return;
      }

      // Destroy previous player if it exists
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      playerRef.current = new (window as any).YT.Player(containerRef.current, {
        videoId: currentVideoId,
        playerVars: {
          autoplay: 1,
          enablejsapi: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onStateChange: (e: { data: number }) => {
            // YT.PlayerState.ENDED === 0
            if (e.data === 0) {
              goNext();
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVideoId]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev + 1;
      return next >= order.length ? 0 : next;
    });
  }, [order.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => {
      const prevIdx = prev - 1;
      return prevIdx < 0 ? order.length - 1 : prevIdx;
    });
  }, [order.length]);

  const shuffle = useCallback(() => {
    setShuffled((s) => {
      const newShuffled = !s;
      if (newShuffled) {
        // Shuffle the order, keeping the current video first
        const indices = links.map((_, i) => i);
        const current = order[currentIndex] ?? 0;
        const rest = indices.filter((i) => i !== current);
        // Fisher-Yates shuffle on the rest
        for (let i = rest.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [rest[i], rest[j]] = [rest[j], rest[i]];
        }
        setOrder([current, ...rest]);
        setCurrentIndex(0);
      } else {
        // Restore sequential order
        const indices = links.map((_, i) => i);
        setOrder(indices);
        setCurrentIndex(0);
      }
      return newShuffled;
    });
  }, [links, order, currentIndex]);

  if (!links || links.length === 0) {
    return (
      <div className="rounded-2xl bg-[color:var(--yt-surface)] border border-[color:var(--yt-border)] p-8 text-center">
        <p className="text-sm text-[color:var(--yt-text-secondary)]">
          No stream links configured yet.
        </p>
      </div>
    );
  }

  const currentLink = links[order[currentIndex] ?? 0];

  return (
    <div className="rounded-2xl bg-[color:var(--yt-surface)] border border-[color:var(--yt-border)] overflow-hidden">
      {/* Player + playlist layout */}
      <div className="flex flex-col lg:flex-row">
        {/* Player area */}
        <div className="flex-1 min-w-0">
          <div className="relative w-full aspect-video bg-black">
            <div ref={containerRef} className="w-full h-full" />
          </div>
          {/* Now playing + controls */}
          <div className="flex items-center gap-3 px-4 py-3 border-t border-[color:var(--yt-border)]">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[color:var(--yt-text)] truncate">
                {currentLink?.title || `Track ${currentIndex + 1}`}
              </p>
              <p className="text-xs text-[color:var(--yt-text-secondary)]">
                {currentIndex + 1} of {order.length}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goPrev}
                className="p-2 rounded-full hover:bg-[color:var(--yt-hover)] text-[color:var(--yt-text)] transition-colors"
                title="Previous"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="p-2 rounded-full hover:bg-[color:var(--yt-hover)] text-[color:var(--yt-text)] transition-colors"
                title="Next"
              >
                <SkipForward className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={shuffle}
                className={`p-2 rounded-full hover:bg-[color:var(--yt-hover)] transition-colors ${
                  shuffled
                    ? "text-[color:var(--yt-brand)]"
                    : "text-[color:var(--yt-text)]"
                }`}
                title="Shuffle"
              >
                <Shuffle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Playlist sidebar */}
        <div className="lg:w-72 lg:flex-shrink-0 border-t lg:border-t-0 lg:border-l border-[color:var(--yt-border)] max-h-64 lg:max-h-none overflow-y-auto">
          <div className="px-4 py-2 sticky top-0 bg-[color:var(--yt-surface)] border-b border-[color:var(--yt-border)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--yt-text-secondary)]">
              Playlist
            </p>
          </div>
          <ul>
            {order.map((linkIdx, displayIdx) => {
              const link = links[linkIdx];
              const active = displayIdx === currentIndex;
              return (
                <li key={linkIdx}>
                  <button
                    type="button"
                    onClick={() => setCurrentIndex(displayIdx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      active
                        ? "bg-[color:var(--yt-hover)]"
                        : "hover:bg-[color:var(--yt-hover)]"
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 w-6 text-xs font-medium text-center ${
                        active
                          ? "text-[color:var(--yt-brand)]"
                          : "text-[color:var(--yt-text-secondary)]"
                      }`}
                    >
                      {active ? (
                        <Play className="w-3 h-3 mx-auto" fill="currentColor" />
                      ) : (
                        displayIdx + 1
                      )}
                    </span>
                    <span
                      className={`min-w-0 text-sm truncate ${
                        active
                          ? "text-[color:var(--yt-text)] font-medium"
                          : "text-[color:var(--yt-text-secondary)]"
                      }`}
                    >
                      {link?.title || `Track ${linkIdx + 1}`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}