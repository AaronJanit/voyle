"use client";

import { MediaItem } from "@/lib/media";
import { FileAttribution } from "@/lib/channel";
import { Play, Pause } from "lucide-react";

interface Track {
  item: MediaItem;
  attribution?: FileAttribution;
  url: string;
}

interface TrackListProps {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  onSelect: (index: number) => void;
}

/* YouTube Music-style track list. Each row shows cover art, title,
 * channel, and duration. Clicking a row selects it (the parent
 * component drives playback). Modern effects: subtle hover lift, the
 * currently playing track has a glowing gradient border + animated
 * equalizer bars when playing.
 */
export default function TrackList({
  tracks,
  currentIndex,
  isPlaying,
  onSelect,
}: TrackListProps) {
  return (
    <div className="space-y-1.5">
      {tracks.map((track, i) => {
        const active = i === currentIndex;
        return (
          <TrackRow
            key={track.item.id}
            track={track}
            index={i}
            active={active}
            playing={active && isPlaying}
            onSelect={() => onSelect(i)}
          />
        );
      })}
    </div>
  );
}

function TrackRow({
  track,
  index,
  active,
  playing,
  onSelect,
}: {
  track: Track;
  index: number;
  active: boolean;
  playing: boolean;
  onSelect: () => void;
}) {
  const channelColor = track.attribution?.channel.color ?? "#0f0f0f";
  const channelName = track.attribution?.channel.name;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group w-full flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-xl text-left transition-all duration-200 ${
        active
          ? "bg-[color:var(--yt-hover)] shadow-sm"
          : "hover:bg-[color:var(--yt-hover)] hover:translate-x-0.5"
      }`}
    >
      {/* Cover / index */}
      <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-lg overflow-hidden shadow-sm">
        <div
          className={`absolute inset-0 ${
            active && playing ? "animate-spin-slow" : ""
          }`}
          style={{
            background: `conic-gradient(from ${index * 47}deg, ${channelColor} 0%, color-mix(in srgb, ${channelColor} 50%, white) 50%, ${channelColor} 100%)`,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[color:var(--yt-bg)] shadow-inner" />
        </div>
        {/* Play overlay on hover */}
        <div
          className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
            active ? "opacity-0 hover:opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {active && playing ? (
            <Pause className="w-5 h-5 text-white" fill="currentColor" />
          ) : (
            <Play className="w-5 h-5 text-white" fill="currentColor" />
          )}
        </div>
        {/* Active glow border */}
        {active && (
          <div
            className="absolute inset-0 rounded-lg ring-2 ring-[color:var(--yt-brand)]"
            aria-hidden
          />
        )}
      </div>

      {/* Index (small, on the side of cover for desktop) */}
      <div className="hidden lg:flex w-6 flex-shrink-0 justify-center">
        {active && playing ? (
          <Equalizer color="var(--yt-brand)" />
        ) : (
          <span className="text-xs text-[color:var(--yt-text-secondary)] tabular-nums">
            {index + 1}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3
          className={`text-sm sm:text-base font-medium leading-tight truncate transition-colors ${
            active
              ? "text-[color:var(--yt-brand)]"
              : "text-[color:var(--yt-text)]"
          }`}
        >
          {prettyTitle(track.item.name)}
        </h3>
        {channelName && (
          <p className="text-xs sm:text-sm text-[color:var(--yt-text-secondary)] truncate mt-0.5">
            {channelName}
          </p>
        )}
      </div>

      {/* Mobile playing indicator */}
      {active && playing && (
        <div className="lg:hidden">
          <Equalizer color="var(--yt-brand)" small />
        </div>
      )}
    </button>
  );
}

/* Animated equalizer bars — shown next to the currently-playing track. */
function Equalizer({ color, small = false }: { color: string; small?: boolean }) {
  const h = small ? "h-3" : "h-4";
  return (
    <div className={`flex items-end gap-0.5 ${h}`}>
      <span
        className="w-0.5 bg-current animate-eq-bar-1"
        style={{ backgroundColor: color }}
      />
      <span
        className="w-0.5 bg-current animate-eq-bar-2"
        style={{ backgroundColor: color }}
      />
      <span
        className="w-0.5 bg-current animate-eq-bar-3"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

function prettyTitle(filename: string): string {
  const dot = filename.lastIndexOf(".");
  const stem = dot > 0 ? filename.slice(0, dot) : filename;
  return stem
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}