"use client";

import { MediaItem } from "@/lib/media";
import { useState } from "react";
import MediaGrid from "./MediaGrid";
import ShortsViewer from "./ShortsViewer";

export type ViewMode = "grid" | "shorts";

export default function MediaView({ items }: { items: MediaItem[] }) {
  const [mode, setMode] = useState<ViewMode>("shorts");

  if (items.length === 0) {
    return <MediaGrid items={items} />;
  }

  if (mode === "shorts") {
    return (
      <div className="flex flex-col h-[calc(100vh-180px)] min-h-[400px]">
        <ViewToggle mode={mode} setMode={setMode} />
        <div className="flex-1 min-h-0 mt-3 rounded-xl overflow-hidden bg-black">
          <ShortsViewer items={items} />
        </div>
      </div>
    );
  }

  return (
    <>
      <ViewToggle mode={mode} setMode={setMode} />
      <MediaGrid items={items} />
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
    <div className="flex items-center gap-1 p-1 bg-[#f1f3f4] rounded-full w-fit">
      <ToggleButton
        active={mode === "grid"}
        onClick={() => setMode("grid")}
        label="Grid"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </ToggleButton>
      <ToggleButton
        active={mode === "shorts"}
        onClick={() => setMode("shorts")}
        label="Shorts"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v14l11-7z" />
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
          ? "bg-white text-[#1a73e8] shadow-sm"
          : "text-[#5f6368] hover:text-[#202124]"
      }`}
    >
      {children}
      {label}
    </button>
  );
}