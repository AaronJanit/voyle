"use client";

import Link from "next/link";
import { useState } from "react";
import { ChannelInfo, FileAttribution } from "@/lib/channel";
import { MediaItem } from "@/lib/media";
import type { CompactStats } from "@/lib/channel-stats";

/* ChannelsView — full YouTube-style channel details page rendered at
 * /channels/[name]. Lays out:
 *
 *   1. Banner — gradient derived from the channel avatar color.
 *   2. Header — avatar, name, handle, joined-date, aggregate stats
 *      (videos / tracks / views), and a back-to-directory link.
 *   3. Tab bar — Home (default), Videos, Muzic, About.
 *   4. Content — Home shows a compact welcome with a featured grid
 *      of the most recent uploads; Videos shows the full video grid;
 *      Muzic shows the audio grid; About shows a short description.
 *
 * Visually consistent with the existing /channel/[name] page (same
 * banner, same header pattern, same tab styling) but with the YouTube
 * identity components (Subscribers / Total views) re-purposed to
 * Channels-specific stats (Total uploads / Total views / Latest).
 */
export default function ChannelsView({
  channel,
  stats,
  items,
  audioItems,
  attribution,
}: ChannelsViewProps) {
  const hasAudio = audioItems.length > 0;
  const defaultTab: Tab =
    items.length === 0 && audioItems.length > 0
      ? "muzic"
      : items.length === 0 && audioItems.length === 0
        ? "about"
        : "home";
  const [tab, setTab] = useState<Tab>(defaultTab);

  return (
    <div className="max-w-[1600px] mx-auto pb-12">
      <ChannelBanner channel={channel} />
      <ChannelHeader
        channel={channel}
        stats={stats}
      />
      <TabBar tab={tab} setTab={setTab} hasAudio={hasAudio} />

      {tab === "home" && (
        <HomeTab
          channel={channel}
          stats={stats}
          items={items}
          audioItems={audioItems}
          attribution={attribution}
        />
      )}
      {tab === "videos" && (
        <VideosTab items={items} attribution={attribution} />
      )}
      {tab === "muzic" && (
        <MuzicTab items={audioItems} attribution={attribution} />
      )}
      {tab === "about" && <AboutTab channel={channel} stats={stats} />}
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Banner — wide gradient bar at the top.
 * ------------------------------------------------------------------------- */
function ChannelBanner({ channel }: { channel: ChannelInfo }) {
  return (
    <div
      className="w-full h-32 sm:h-48"
      style={{
        background: `linear-gradient(135deg, ${channel.color} 0%, ${channel.color}55 100%)`,
      }}
      aria-hidden
    />
  );
}

/* ----------------------------------------------------------------------------
 * ChannelHeader — avatar, name, handle, stats. Mirrors the YouTube layout
 * but uses Channels-specific stat labels (Total uploads / Total views).
 * ------------------------------------------------------------------------- */
function ChannelHeader({
  channel,
  stats,
}: {
  channel: ChannelInfo;
  stats: CompactStats;
}) {
  const totalUploads = stats.videos + stats.tracks;
  const joined = stats.firstUploadAt ? relativeDate(stats.firstUploadAt) : "—";

  return (
    <div className="px-4 sm:px-6 pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <div
          className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center text-white text-3xl font-medium ring-1 ring-[color:var(--yt-border)]"
          style={{ backgroundColor: channel.color }}
          aria-hidden
        >
          {channel.initial}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--yt-text)] leading-tight">
            {channel.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-[color:var(--yt-text-secondary)]">
            <span>@{slugify(channel.name)}</span>
            <span aria-hidden>·</span>
            <span>{compactNumber(totalUploads)} uploads</span>
            <span aria-hidden>·</span>
            <span>{compactNumber(stats.views)} views</span>
            <span aria-hidden>·</span>
            <span>Joined {joined}</span>
          </div>
          <p className="mt-1 text-sm text-[color:var(--yt-text-secondary)]">
            {stats.latestUploadAt
              ? `Last upload ${relativeTime(stats.latestUploadAt)}`
              : "No uploads yet"}
          </p>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end gap-2">
          <Link
            href="/channels"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[color:var(--yt-chip)] hover:bg-[color:var(--yt-hover)] rounded-full text-sm font-medium text-[color:var(--yt-text)] transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            All channels
          </Link>
        </div>
      </div>

      {/* Secondary stat strip — bigger numbers, visible on all sizes */}
      <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl">
        <HeaderStat label="Videos" value={compactNumber(stats.videos)} />
        <HeaderStat label="Tracks" value={compactNumber(stats.tracks)} />
        <HeaderStat label="Total views" value={compactNumber(stats.views)} />
      </div>
    </div>
  );
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-3 rounded-xl bg-[color:var(--yt-surface)] border border-[color:var(--yt-border)]">
      <div className="text-lg sm:text-2xl font-bold text-[color:var(--yt-text)] tabular-nums leading-tight">
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wider text-[color:var(--yt-text-secondary)] mt-0.5">
        {label}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Tab bar — same visual pattern as the existing ChannelView.
 * ------------------------------------------------------------------------- */
type Tab = "home" | "videos" | "muzic" | "about";

function TabBar({
  tab,
  setTab,
  hasAudio,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  hasAudio: boolean;
}) {
  const tabs: { key: Tab; label: string }[] = [
    { key: "home", label: "Home" },
    { key: "videos", label: "Videos" },
    ...(hasAudio ? [{ key: "muzic" as Tab, label: "Muzic" }] : []),
    { key: "about", label: "About" },
  ];

  return (
    <nav
      role="tablist"
      className="mt-6 border-b border-[color:var(--yt-border)]"
    >
      <div className="px-4 sm:px-6 flex gap-8 overflow-x-auto scrollbar-thin">
        {tabs.map((t) => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={`relative py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                active
                  ? "text-[color:var(--yt-text)]"
                  : "text-[color:var(--yt-text-secondary)] hover:text-[color:var(--yt-text)]"
              }`}
            >
              {t.label}
              {active && (
                <span
                  className="absolute left-0 right-0 -bottom-px h-0.5 bg-[color:var(--yt-text)]"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ----------------------------------------------------------------------------
 * Home tab — the default landing. A short welcome band on top and a
 * 2- or 4-up grid of the most recent uploads beneath. Empty state
 * guides the visitor to the Videos tab (if there's content) or a
 * wait-for-uploads message otherwise.
 * ------------------------------------------------------------------------- */
function HomeTab({
  channel,
  stats,
  items,
  audioItems,
  attribution,
}: {
  channel: ChannelInfo;
  stats: CompactStats;
  items: MediaItem[];
  audioItems: MediaItem[];
  attribution: Map<string, FileAttribution>;
}) {
  const total = items.length + audioItems.length;
  const featured: MediaItem[] = [...items, ...audioItems]
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, 8);

  return (
    <div className="px-4 sm:px-6 pt-6 space-y-8">
      {/* Featured banner */}
      <section
        className="rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5"
        style={{
          background: `linear-gradient(135deg, ${channel.color} 0%, ${channel.color}33 100%)`,
        }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white/80 uppercase tracking-wider">
            Featured channel
          </p>
          <h2 className="mt-1 text-xl sm:text-2xl font-bold text-white truncate">
            {channel.name}
          </h2>
          <p className="mt-2 text-sm text-white/90 max-w-xl">
            {total === 0
              ? "Nothing has been uploaded here yet. Check back soon."
              : `${compactNumber(total)} ${
                  total === 1 ? "upload" : "uploads"
                } · ${compactNumber(stats.views)} total views`}
          </p>
        </div>
        <div className="hidden sm:block flex-shrink-0">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-semibold ring-4 ring-white/30"
            style={{ backgroundColor: channel.color }}
          >
            {channel.initial}
          </div>
        </div>
      </section>

      {/* Recent uploads */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-lg font-semibold text-[color:var(--yt-text)]">
            Recent uploads
          </h3>
          {items.length > 0 && (
            <Link
              href="#videos"
              onClick={(e) => {
                e.preventDefault();
                const ev = new CustomEvent("channels:switch-tab", {
                  detail: "videos",
                });
                window.dispatchEvent(ev);
              }}
              className="text-sm font-medium text-[color:var(--yt-blue)] hover:underline"
            >
              View all
            </Link>
          )}
        </div>

        {featured.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[color:var(--yt-border)] py-12 px-6 text-center">
            <p className="text-sm text-[color:var(--yt-text-secondary)]">
              No uploads yet — when this channel publishes something, it
              will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
            {featured.map((item) => (
              <MediaCard
                key={item.path}
                item={item}
                attribution={attribution.get(item.path)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Videos tab — full grid of all attributed non-audio files.
 * ------------------------------------------------------------------------- */
function VideosTab({
  items,
  attribution,
}: {
  items: MediaItem[];
  attribution: Map<string, FileAttribution>;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 px-4">
        <div className="w-16 h-16 rounded-full bg-[color:var(--yt-chip)] flex items-center justify-center mb-4">
          <svg
            viewBox="0 0 24 24"
            className="w-8 h-8 text-[color:var(--yt-text-secondary)]"
            fill="currentColor"
          >
            <path d="M10 18v-6l5 3-5 3zm7-15H7v1h10V3zm3 3H4v1h16V6zm2 3H2v12h20V9zM3 10h18v10H3V10z" />
          </svg>
        </div>
        <p className="text-base font-medium text-[color:var(--yt-text)]">
          No videos yet
        </p>
        <p className="mt-1 text-sm text-[color:var(--yt-text-secondary)] max-w-sm">
          This channel hasn&apos;t published any videos or photos yet.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 pt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
        {items.map((item) => (
          <MediaCard
            key={item.path}
            item={item}
            attribution={attribution.get(item.path)}
          />
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Muzic tab — audio grid with inline players.
 * ------------------------------------------------------------------------- */
function MuzicTab({
  items,
  attribution,
}: {
  items: MediaItem[];
  attribution: Map<string, FileAttribution>;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 px-4">
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
          This channel hasn&apos;t uploaded any audio tracks yet.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 pt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4">
        {items.map((item) => (
          <AudioCard
            key={item.path}
            item={item}
            attribution={attribution.get(item.path)}
          />
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * About tab — short description + stat recap. Mirrors the YouTube "About"
 * panel but keeps things tight (this page is about discovering channels,
 * not editing them).
 * ------------------------------------------------------------------------- */
function AboutTab({
  channel,
  stats,
}: {
  channel: ChannelInfo;
  stats: CompactStats;
}) {
  const total = stats.videos + stats.tracks;
  return (
    <div className="px-4 sm:px-6 pt-6">
      <div className="max-w-3xl space-y-6">
        <p className="text-base text-[color:var(--yt-text)] leading-relaxed">
          {total === 0
            ? `${channel.name} hasn't published anything yet.`
            : `${channel.name} publishes on voyle. Take a look at the Videos and Muzic tabs to see what's been shared.`}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <AboutStat label="Joined" value={stats.firstUploadAt ? relativeDate(stats.firstUploadAt) : "—"} />
          <AboutStat label="Videos" value={compactNumber(stats.videos)} />
          <AboutStat label="Tracks" value={compactNumber(stats.tracks)} />
          <AboutStat label="Total views" value={compactNumber(stats.views)} />
        </div>

        {stats.latestUploadAt && (
          <p className="text-sm text-[color:var(--yt-text-secondary)]">
            Most recent upload {relativeTime(stats.latestUploadAt)}.
          </p>
        )}
      </div>
    </div>
  );
}

function AboutStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[color:var(--yt-surface)] border border-[color:var(--yt-border)] p-3">
      <div className="text-xs text-[color:var(--yt-text-secondary)] uppercase tracking-wider">
        {label}
      </div>
      <div className="mt-1 text-base font-semibold text-[color:var(--yt-text)] tabular-nums">
        {value}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * MediaCard — single item in the Videos/Home grid. Renders the thumbnail
 * as a link to /p/[id] (the existing share-page route).
 * ------------------------------------------------------------------------- */
function MediaCard({
  item,
  attribution,
}: {
  item: MediaItem;
  attribution?: FileAttribution;
}) {
  return (
    <Link
      href={`/p/${encodeURIComponent(item.path)}`}
      className="group block"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-[color:var(--yt-chip)]">
        {item.type === "video" ? (
          <video
            src={`/api/media/file/${item.path}`}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img
            src={`/api/media/file/${item.path}`}
            alt={prettyTitle(item.name)}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        )}
        {item.type === "video" && (
          <div className="absolute bottom-1.5 right-1.5 bg-black/70 rounded px-1.5 py-0.5 text-[11px] font-medium text-white">
            ▶
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="mt-3 flex gap-3">
        <div
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold"
          style={{
            backgroundColor:
              attribution?.channel.color ?? "var(--yt-chip)",
          }}
          aria-hidden
        >
          {attribution?.channel.initial ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 text-[color:var(--yt-text)] group-hover:text-[color:var(--yt-blue)] transition-colors">
            {prettyTitle(item.name)}
          </h3>
          <p className="mt-0.5 text-xs text-[color:var(--yt-text-secondary)] truncate">
            {attribution?.channel.name ?? "voyle"}
            {attribution && (
              <>
                <span aria-hidden> · </span>
                <span>{compactNumber(attribution.views)} views</span>
              </>
            )}
            {attribution?.uploadedAt && (
              <>
                <span aria-hidden> · </span>
                <span>{relativeTime(attribution.uploadedAt)}</span>
              </>
            )}
          </p>
        </div>
      </div>
    </Link>
  );
}

/* ----------------------------------------------------------------------------
 * AudioCard — title + inline audio player + attribution row.
 * ------------------------------------------------------------------------- */
function AudioCard({
  item,
  attribution,
}: {
  item: MediaItem;
  attribution?: FileAttribution;
}) {
  const color = attribution?.channel.color ?? "var(--yt-chip)";
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[color:var(--yt-surface)] border border-[color:var(--yt-border)]">
      <div
        className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6 text-white"
          fill="currentColor"
        >
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium leading-snug truncate text-[color:var(--yt-text)]">
          {prettyTitle(item.name)}
        </h3>
        {attribution && (
          <p className="text-xs text-[color:var(--yt-text-secondary)]">
            {compactNumber(attribution.views)} views
          </p>
        )}
        <audio
          controls
          controlsList="nodownload"
          preload="metadata"
          src={`/api/media/file/${item.path}`}
          className="mt-1 w-full h-8"
        />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
}

function prettyTitle(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactNumber(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return m >= 10 ? `${Math.round(m)}M` : `${m.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const k = n / 1_000;
    return k >= 10 ? `${Math.round(k)}K` : `${k.toFixed(1)}K`;
  }
  return `${n}`;
}

function relativeTime(t: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12)
    return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

function relativeDate(t: number): string {
  return new Date(t).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

/* ----------------------------------------------------------------------------
 * Props
 * ------------------------------------------------------------------------- */
export interface ChannelsViewProps {
  channel: ChannelInfo;
  stats: CompactStats;
  items: MediaItem[];
  audioItems: MediaItem[];
  attribution: Map<string, FileAttribution>;
}