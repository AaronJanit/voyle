"use client";

import { MediaItem } from "@/lib/media";
import { useState } from "react";
import { LayoutGrid, Clapperboard } from "lucide-react";
import MediaGrid from "./MediaGrid";
import ShortsViewer from "./ShortsViewer";
import YouTubeGrid from "./YouTubeGrid";
import { CurrentUser } from "@/lib/user";
import { ChannelInfo } from "@/lib/channel";

export type ViewMode = "grid" | "shorts";

interface MediaViewProps {
  items: MediaItem[];
  user: CurrentUser | null;
  attribution?: Map<string, ChannelInfo>;
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
  attribution,
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
      <YouTubeGrid items={items} user={user} attribution={attribution} />
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
        <LayoutGrid className="w-4 h-4" aria-hidden />
      </ToggleButton>
      <ToggleButton
        active={mode === "shorts"}
        onClick={() => setMode("shorts")}
        label="Shorts"
      >
        <Clapperboard className="w-4 h-4" aria-hidden />
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