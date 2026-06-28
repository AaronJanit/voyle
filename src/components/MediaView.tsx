"use client";

import { MediaItem } from "@/lib/media";
import { useState } from "react";
import MediaGrid from "./MediaGrid";
import ShortsViewer from "./ShortsViewer";
import YouTubeGrid from "./YouTubeGrid";
import { CurrentUser } from "@/lib/user";

export type ViewMode = "grid" | "shorts";

interface MediaViewProps {
  items: MediaItem[];
  user: CurrentUser | null;
}

/* The MediaView owns three display modes:
 *  - "grid": a YouTube-style grid of video cards (default). Cards open a
 *    detail view in-place (the existing Lightbox keeps working).
 *  - "shorts": the existing vertical-swipe Shorts viewer.
 *
 *  Filter chips across the top narrow the visible items by type/category.
 *  Filters apply only in "grid" mode — Shorts has no chip nav. */
export default function MediaView({
  items,
  user,
}: MediaViewProps) {
  const [mode, setMode] = useState<ViewMode>("grid");

  if (mode === "shorts") {
    return (
      <div className="flex flex-col">
        <ViewToggle mode={mode} setMode={setMode} />
        <div className="mt-4 h-[calc(100vh-180px)] min-h-[480px] rounded-xl overflow-hidden bg-black">
          <ShortsViewer items={items} />
        </div>
      </div>
    );
  }

  // Empty state — reuse the existing MediaGrid which has the upload UX.
  if (items.length === 0) {
    return (
      <>
        <MediaGrid items={items} />
        <EmptyHint />
      </>
    );
  }

  return (
    <>
      <ViewToggle mode={mode} setMode={setMode} />
      <YouTubeGrid items={items} user={user} />
    </>
  );
}

function ViewToggle({
  mode,
  setMode,
}: {
  mode: ViewMode;
  setMode: (m: ViewMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 bg-[color:var(--yt-chip)] rounded-full w-fit">
      <ToggleButton
        active={mode === "grid"}
        onClick={() => setMode("grid")}
        label="Grid"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4"
          fill="currentColor"
          aria-hidden
        >
          <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z" />
        </svg>
      </ToggleButton>
      <ToggleButton
        active={mode === "shorts"}
        onClick={() => setMode("shorts")}
        label="Shorts"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4"
          fill="currentColor"
          aria-hidden
        >
          <path d="M17.77 10.32l-1.2-.5.6-1.43-1.43.6-.5-1.2L13.6 9.1l-2.84-.7L13.6 7.7l-1.66-1.3-1.43.6.6-1.43-1.2-.5-.5 1.2L7.7 5.6 7.4 7.04 5.96 7.4l.36 1.43 1.43-.6 1.43 1.93-1.2.5 1.2.5-.6 1.43 1.43-.6.5 1.2 1.62-1.3 2.84.7-2.84 1.4 1.66 1.3 1.43-.6-.6 1.43 1.2.5.5-1.2 1.7.7.3-1.43 1.43-.36-.36-1.43-1.43.6-1.43-1.93 1.2-.5zM10 14.65v-5.3L15 12l-5 2.65z" />
        </svg>
      </ToggleButton>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? "bg-white text-[color:var(--yt-text)] shadow-sm"
          : "text-[color:var(--yt-text-secondary)] hover:text-[color:var(--yt-text)]"
      }`}
    >
      {children}
      {label}
    </button>
  );
}

function EmptyHint() {
  return (
    <p className="text-sm text-[color:var(--yt-text-secondary)] mt-4 max-w-2xl">
      Drop photos, gifs, and videos into the{" "}
      <code className="bg-[color:var(--yt-chip)] px-1.5 py-0.5 rounded">
        /media
      </code>{" "}
      folder, or use the upload button above.
    </p>
  );
}