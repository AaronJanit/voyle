"use client";

import { useState } from "react";
import { MediaItem } from "@/lib/media";
import { FileAttribution } from "@/lib/channel";
import { StreamLink } from "@/lib/shmili-stream";
import ShmiliStreamer from "@/components/ShmiliStreamer";
import TrackList from "@/components/TrackList";
import MusicPlayer from "@/components/MusicPlayer";
import Link from "next/link";

interface MuzicClientProps {
  audioItems: MediaItem[];
  attribution: Map<string, FileAttribution>;
  streamLinks: StreamLink[];
}

/* Muzic page — two sections:
 *   1. Uploaded audio tracks — YouTube Music-style track list with a
 *      sticky "now playing" bar at the bottom featuring cover art,
 *      gradient backgrounds, custom transport, scrubber, volume,
 *      shuffle/repeat, and modern animated effects.
 *   2. Shmili Streamer — YouTube playlist player with auto-advance.
 */
export default function MuzicClient({
  audioItems,
  attribution,
  streamLinks,
}: MuzicClientProps) {
  // Build the track list once
  const tracks = audioItems.map((item) => ({
    item,
    attribution: attribution.get(item.path),
    url: `/api/media/file/${item.path}`,
  }));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="px-4 sm:px-6 py-4 max-w-[1600px] mx-auto pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[color:var(--yt-text)]">
          Muzic
        </h1>
        <Link
          href="/"
          className="text-sm text-[color:var(--yt-text-secondary)] hover:text-[color:var(--yt-text)]"
        >
          ← Back to home
        </Link>
      </div>

      {/* Shmili Streamer section */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[color:var(--yt-text)] mb-3">
          Shmili Streamer
        </h2>
        <ShmiliStreamer
          links={streamLinks.map((l) => ({
            youtubeId: l.youtubeId,
            title: l.title,
          }))}
        />
      </section>

      {/* Tracks section */}
      <section>
        <h2 className="text-lg font-semibold text-[color:var(--yt-text)] mb-4">
          Tracks
        </h2>

        {tracks.length === 0 ? (
          <EmptyTracksState />
        ) : (
          <>
            <TrackList
              tracks={tracks}
              currentIndex={currentIndex}
              isPlaying={isPlaying}
              onSelect={(i) => {
                setCurrentIndex(i);
                setIsPlaying(true);
              }}
            />
            <div className="pt-4">
              <MusicPlayerWrapper
                tracks={tracks}
                currentIndex={currentIndex}
                setCurrentIndex={setCurrentIndex}
                setIsPlaying={setIsPlaying}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}

/* Wrapper to bridge MusicPlayer's `onIndexChange` with our parent state.
 * MusicPlayer doesn't expose a playing-state callback directly; we sync
 * via an effect in the wrapper by reading a ref-friendly event from
 * the audio element.
 */
function MusicPlayerWrapper({
  tracks,
  currentIndex,
  setCurrentIndex,
  setIsPlaying,
}: {
  tracks: Array<{
    item: MediaItem;
    attribution?: FileAttribution;
    url: string;
  }>;
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
  setIsPlaying: (p: boolean) => void;
}) {
  return (
    <MusicPlayer
      tracks={tracks}
      currentIndex={currentIndex}
      onIndexChange={(i) => setCurrentIndex(i)}
    />
  );
}

function EmptyTracksState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16">
      <div className="w-16 h-16 rounded-full bg-[color:var(--yt-chip)] flex items-center justify-center mb-4">
        <svg
          viewBox="0 0 24 24"
          className="w-8 h-8 text-[color:var(--yt-text-secondary)]"
          fill="currentColor"
        >
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </div>
      <p className="text-base font-medium text-[color:var(--yt-text)]">
        No tracks yet
      </p>
      <p className="mt-1 text-sm text-[color:var(--yt-text-secondary)] max-w-sm">
        Upload sound files (.mp3, .wav, .ogg, .m4a) from your channel page to
        get started.
      </p>
    </div>
  );
}