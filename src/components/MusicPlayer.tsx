"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  Shuffle,
  Repeat,
  MoreHorizontal,
} from "lucide-react";
import { MediaItem } from "@/lib/media";
import { FileAttribution } from "@/lib/channel";

interface Track {
  item: MediaItem;
  attribution?: FileAttribution;
  url: string;
}

interface MusicPlayerProps {
  tracks: Track[];
  currentIndex: number;
  onIndexChange: (i: number) => void;
}

/* YouTube Music-style "now playing" bar.
 *
 * Appears at the bottom of the tracks section when a track is selected
 * (or always — the app keeps the bar visible so the user can scrub
 * through any track even if none is playing yet).
 *
 * Layout (left → right):
 *   1. Cover art (animated, gradient placeholder because we don't have
 *      real album art — color comes from channel attribution).
 *   2. Track info: title + channel link + like button.
 *   3. Transport: prev / play-pause / next + scrubber + current/total.
 *   4. Right cluster: shuffle / repeat / volume / mute / more.
 *
 * The audio element is hidden; controls are all custom React state, kept
 * in sync with the audio element via event listeners.
 */
export default function MusicPlayer({
  tracks,
  currentIndex,
  onIndexChange,
}: MusicPlayerProps) {
  const track = tracks[currentIndex];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<"off" | "all" | "one">("off");
  const [showVolume, setShowVolume] = useState(false);

  // ----- Effects: wire up the audio element when the track changes -----
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    audio.src = track.url;
    audio.load();
    audio.volume = muted ? 0 : volume;
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.url]);

  // ----- Audio event listeners -----
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onEnded = () => {
      if (repeat === "one") {
        audio.currentTime = 0;
        audio.play();
        return;
      }
      goNext();
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.url, repeat]);

  // Keep volume in sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // ----- Controls -----
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    } else {
      audio.pause();
      setPlaying(false);
    }
  }, []);

  const goNext = useCallback(() => {
    if (tracks.length === 0) return;
    if (shuffle) {
      let next = currentIndex;
      while (next === currentIndex && tracks.length > 1) {
        next = Math.floor(Math.random() * tracks.length);
      }
      onIndexChange(next);
    } else if (currentIndex < tracks.length - 1) {
      onIndexChange(currentIndex + 1);
    } else if (repeat === "all") {
      onIndexChange(0);
    }
  }, [currentIndex, tracks.length, shuffle, repeat, onIndexChange]);

  const goPrev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (currentIndex > 0) onIndexChange(currentIndex - 1);
    else if (tracks.length > 0) onIndexChange(tracks.length - 1);
  }, [currentIndex, tracks.length, onIndexChange]);

  const seek = (t: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = t;
    setCurrentTime(t);
  };

  const toggleMute = () => {
    setMuted((m) => !m);
  };

  const cycleRepeat = () => {
    setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"));
  };

  if (!track) return null;

  const channelName = track.attribution?.channel.name;
  const channelColor = track.attribution?.channel.color ?? "#0f0f0f";
  const progress =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      className="sticky bottom-0 left-0 right-0 z-10 mt-6 rounded-2xl overflow-hidden border border-[color:var(--yt-border)] shadow-lg backdrop-blur-md"
      style={{
        background:
          "linear-gradient(180deg, color-mix(in srgb, " +
          channelColor +
          " 14%, var(--yt-surface)) 0%, var(--yt-surface) 100%)",
      }}
    >
      {/* Hidden audio element — drives all the custom UI */}
      <audio
        ref={audioRef}
        controlsList="nodownload"
        preload="metadata"
      />

      <div className="flex items-center gap-4 px-4 py-3">
        {/* Cover */}
        <Cover track={track} playing={playing} />

        {/* Info */}
        <div className="hidden sm:flex flex-col min-w-0 w-64">
          <h3 className="text-sm font-semibold leading-tight truncate text-[color:var(--yt-text)]">
            {prettyTitle(track.item.name)}
          </h3>
          {channelName && (
            <Link
              href={`/channel/${encodeURIComponent(channelName)}`}
              className="text-xs text-[color:var(--yt-text-secondary)] hover:text-[color:var(--yt-blue)] truncate"
            >
              {channelName}
            </Link>
          )}
          <button
            type="button"
            onClick={() => setLiked((l) => !l)}
            className={`mt-1 self-start transition-colors ${
              liked
                ? "text-[color:var(--yt-brand)]"
                : "text-[color:var(--yt-text-secondary)] hover:text-[color:var(--yt-text)]"
            }`}
            title={liked ? "Unlike" : "Like"}
          >
            <Heart className="w-4 h-4" fill={liked ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Transport + scrubber */}
        <div className="flex-1 min-w-0 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShuffle((s) => !s)}
              className={`hidden sm:inline-flex p-1.5 rounded-full transition-colors ${
                shuffle
                  ? "text-[color:var(--yt-text)] bg-[color:var(--yt-hover)]"
                  : "text-[color:var(--yt-text-secondary)] hover:text-[color:var(--yt-text)]"
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goPrev}
              className="p-1.5 rounded-full text-[color:var(--yt-text)] hover:bg-[color:var(--yt-hover)] transition-colors"
              title="Previous"
            >
              <SkipBack className="w-5 h-5" fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="p-2 rounded-full bg-[color:var(--yt-text)] text-[color:var(--yt-bg)] hover:opacity-90 transition-all hover:scale-105 active:scale-95"
              title={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <Pause className="w-6 h-6" fill="currentColor" />
              ) : (
                <Play className="w-6 h-6" fill="currentColor" />
              )}
            </button>
            <button
              type="button"
              onClick={goNext}
              className="p-1.5 rounded-full text-[color:var(--yt-text)] hover:bg-[color:var(--yt-hover)] transition-colors"
              title="Next"
            >
              <SkipForward className="w-5 h-5" fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={cycleRepeat}
              className={`hidden sm:inline-flex p-1.5 rounded-full relative transition-colors ${
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
          </div>

          {/* Scrubber */}
          <div className="w-full max-w-2xl flex items-center gap-2 text-xs text-[color:var(--yt-text-secondary)] tabular-nums">
            <span className="w-10 text-right">{formatTime(currentTime)}</span>
            <div
              className="flex-1 group h-1.5 hover:h-2 transition-all bg-[color:var(--yt-chip)] rounded-full cursor-pointer relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                seek(pct * duration);
              }}
            >
              <div
                className="absolute top-0 left-0 h-full bg-[color:var(--yt-brand)] rounded-full transition-[width] duration-100"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[color:var(--yt-brand)] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${progress}%` }}
              />
            </div>
            <span className="w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right cluster */}
        <div className="hidden md:flex items-center gap-1">
          <div
            className="relative"
            onMouseEnter={() => setShowVolume(true)}
            onMouseLeave={() => setShowVolume(false)}
          >
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-full text-[color:var(--yt-text-secondary)] hover:text-[color:var(--yt-text)] transition-colors"
              title={muted ? "Unmute" : "Mute"}
            >
              {muted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <div
              className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-3 rounded-lg bg-[color:var(--yt-text)] shadow-lg transition-all ${
                showVolume
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-1 pointer-events-none"
              }`}
            >
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  setMuted(false);
                  setVolume(Number(e.target.value));
                }}
                className="w-20 h-1 appearance-none bg-[color:var(--yt-chip)] rounded-full outline-none
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                  [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white"
                style={{
                  background: `linear-gradient(to right, white ${(muted ? 0 : volume) * 100}%, var(--yt-chip) 0%)`,
                }}
              />
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-full text-[color:var(--yt-text-secondary)] hover:text-[color:var(--yt-text)] transition-colors"
            title="More"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Cover — a gradient-driven placeholder cover art since uploaded audio
 * files don't come with embedded album art. Animates a subtle rotation
 * when playing. Uses the uploader's channel color as the dominant hue so
 * each track has its own identity.
 * ----------------------------------------------------------------------- */
function Cover({
  track,
  playing,
}: {
  track: Track;
  playing: boolean;
}) {
  const channelColor = track.attribution?.channel.color ?? "#0f0f0f";
  return (
    <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden shadow-md">
      <div
        className={`absolute inset-0 transition-transform ${
          playing ? "animate-spin-slow" : ""
        }`}
        style={{
          background: `conic-gradient(from 0deg, ${channelColor} 0%, color-mix(in srgb, ${channelColor} 50%, white) 50%, ${channelColor} 100%)`,
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-[color:var(--yt-bg)] shadow-inner" />
      </div>
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

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}