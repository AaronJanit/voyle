"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChannelInfo, FileAttribution } from "@/lib/channel";
import { MediaItem, mediaUrl } from "@/lib/media";
import type { CompactStats } from "@/lib/channel-stats";

/* ChannelsBrowse — YouTube-style directory of every channel on the site.
 *
 * Each card surfaces:
 *   - Circular avatar (deterministic color + 2-letter initial)
 *   - Channel name + handle
 *   - Aggregated stats (videos, tracks, total views, latest activity)
 *   - A 2x2 preview grid of the channel's most recent uploads (when
 *     available), so a browsing visitor can see the channel's vibe
 *     without leaving the directory.
 *
 * Above the grid: a search input (filters by name/handle) and a sort
 * selector (Most popular / Most videos / Most recent). These are
 * purely client-side and re-compute on change — the server payload
 * is small (one row per channel + 4 media items each).
 *
 * When the visitor is logged in but doesn't yet have a channel of
 * their own, an "Upload to your channel!" CTA card is rendered as the
 * first item in the grid. The card follows the same visual shell as
 * the other cards so the directory feels like a single, cohesive list.
 */
export default function ChannelsBrowse({
  channels,
  currentUser,
}: {
  channels: ChannelCardData[];
  currentUser: CurrentUserContext | null;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("popular");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? channels.filter((c) => {
          const handle = slugify(c.channel.name);
          return (
            c.channel.name.toLowerCase().includes(q) ||
            handle.includes(q)
          );
        })
      : channels;

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sort) {
        case "popular":
          return b.stats.views - a.stats.views;
        case "videos":
          return (
            b.stats.videos - a.stats.videos ||
            b.stats.views - a.stats.views
          );
        case "recent":
          return (
            (b.stats.latestUploadAt ?? 0) - (a.stats.latestUploadAt ?? 0)
          );
      }
    });
    return sorted;
  }, [channels, query, sort]);

  return (
    <div className="px-4 sm:px-6 py-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--yt-text)] tracking-tight">
          Channels
        </h1>
        <p className="mt-1 text-sm text-[color:var(--yt-text-secondary)]">
          {channels.length === 0
            ? "No channels yet — be the first to upload."
            : `${channels.length} ${
                channels.length === 1 ? "channel" : "channels"
              } on voyle`}
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <SearchInput value={query} onChange={setQuery} />
        </div>
        <SortControl value={sort} onChange={setSort} />
      </div>

      {/* Empty state */}
      {channels.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-24 px-4">
          <div className="w-16 h-16 rounded-full bg-[color:var(--yt-chip)] flex items-center justify-center mb-4">
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8 text-[color:var(--yt-text-secondary)]"
              fill="currentColor"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <p className="text-base font-medium text-[color:var(--yt-text)]">
            No channels yet
          </p>
          <p className="mt-1 text-sm text-[color:var(--yt-text-secondary)] max-w-sm">
            Upload your first file from your channel page and it will appear
            here.
          </p>
          <Link
            href="/channel"
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[color:var(--yt-text)] text-[color:var(--yt-bg)] rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Go to my channel
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* The "Upload to your channel!" card is always rendered first
              (when applicable) and is intentionally not affected by
              search/sort filters — it's a system affordance, not a
              directory entry. */}
          {currentUser?.showUploadCta && (
            <UploadToYourChannelCard user={currentUser} />
          )}
          {visible.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center text-center py-16">
              <p className="text-sm text-[color:var(--yt-text-secondary)]">
                No channels match &ldquo;{query}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-2 text-sm font-medium text-[color:var(--yt-blue)] hover:underline"
              >
                Clear search
              </button>
            </div>
          ) : (
            visible.map((c) => (
              <ChannelDirectoryCard key={c.channel.name} data={c} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Channel directory card — large, YouTube-style. Avatar + name on top,
 * stats row in the middle, a 2x2 preview grid of recent uploads at the
 * bottom. Clicking anywhere on the card goes to the channel page.
 * ------------------------------------------------------------------------- */
function ChannelDirectoryCard({ data }: { data: ChannelCardData }) {
  const { channel, stats, recent, attribution } = data;

  return (
    <Link
      href={`/channels/${encodeURIComponent(channel.name)}`}
      className="group flex flex-col rounded-2xl bg-[color:var(--yt-surface)] border border-[color:var(--yt-border)] overflow-hidden hover:shadow-md hover:border-transparent transition-all"
    >
      {/* Header strip — colored banner gradient derived from the avatar */}
      <div
        className="h-20"
        style={{
          background: `linear-gradient(135deg, ${channel.color} 0%, ${channel.color}55 100%)`,
        }}
        aria-hidden
      />

      {/* Avatar + identity */}
      <div className="px-5 -mt-9">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold ring-4 ring-[color:var(--yt-surface)]"
          style={{ backgroundColor: channel.color }}
          aria-hidden
        >
          {channel.initial}
        </div>

        <div className="mt-3">
          <h3 className="text-base font-semibold text-[color:var(--yt-text)] leading-snug truncate group-hover:text-[color:var(--yt-blue)] transition-colors">
            {channel.name}
          </h3>
          <p className="text-xs text-[color:var(--yt-text-secondary)] mt-0.5">
            @{slugify(channel.name)}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-5 mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="Videos" value={compact(stats.videos)} />
        <Stat label="Tracks" value={compact(stats.tracks)} />
        <Stat label="Views" value={compact(stats.views)} />
      </div>

      {/* Latest activity */}
      <p className="px-5 mt-3 text-xs text-[color:var(--yt-text-secondary)]">
        {stats.latestUploadAt
          ? `Last active ${relativeTime(stats.latestUploadAt)}`
          : "No uploads yet"}
      </p>

      {/* 2x2 preview grid */}
      <div className="px-5 pb-5 mt-4">
        {recent.length > 0 ? (
          <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden bg-[color:var(--yt-chip)] aspect-[2/1]">
            {recent.slice(0, 4).map((item, i) => (
              <PreviewTile
                key={item.path}
                item={item}
                attribution={attribution?.get(item.path)}
                priority={i === 0}
              />
            ))}
            {/* Pad with empty cells so the grid keeps its 2x2 shape */}
            {recent.length < 4 &&
              Array.from({ length: 4 - recent.length }).map((_, i) => (
                <PreviewTilePlaceholder
                  key={`ph-${i}`}
                  color={channel.color}
                />
              ))}
          </div>
        ) : (
          <div
            className="rounded-xl flex items-center justify-center text-xs font-medium text-white/90 aspect-[2/1]"
            style={{ backgroundColor: `${channel.color}33` }}
          >
            No previews yet
          </div>
        )}
      </div>
    </Link>
  );
}

/* ----------------------------------------------------------------------------
 * Stat — a single labeled number in the channel card stats row.
 * ------------------------------------------------------------------------- */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-base font-semibold text-[color:var(--yt-text)] tabular-nums">
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wider text-[color:var(--yt-text-secondary)] mt-0.5">
        {label}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * PreviewTile — a single thumbnail inside the 2x2 preview grid.
 * Falls back to a placeholder when there's no image (e.g. audio only).
 * ------------------------------------------------------------------------- */
function PreviewTile({
  item,
  attribution,
  priority,
}: {
  item: MediaItem;
  attribution?: FileAttribution;
  priority: boolean;
}) {
  if (item.type === "audio") {
    return (
      <div className="relative w-full h-full bg-[color:var(--yt-hover)] flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 text-[color:var(--yt-text-secondary)]"
          fill="currentColor"
        >
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[color:var(--yt-hover)] overflow-hidden">
      {item.type === "video" ? (
        <video
          src={`mediaUrl(item.path)`}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload={priority ? "metadata" : "none"}
        />
      ) : (
        <img
          src={`mediaUrl(item.path)`}
          alt={item.name}
          loading={priority ? "eager" : "lazy"}
          className="w-full h-full object-cover"
        />
      )}
      {item.type === "video" && (
        <div className="absolute bottom-0.5 right-0.5 bg-black/70 rounded px-1 text-[10px] font-medium text-white tabular-nums">
          ▶
        </div>
      )}
      {/* Unused prop kept to avoid lint warnings if extended later */}
      <span hidden>{attribution?.channel.name}</span>
    </div>
  );
}

function PreviewTilePlaceholder({ color }: { color: string }) {
  return (
    <div
      className="w-full h-full"
      style={{ backgroundColor: `${color}22` }}
      aria-hidden
    />
  );
}

/* ----------------------------------------------------------------------------
 * SearchInput — minimal, YouTube-style search field. (No live submit; the
 * filter re-computes as the user types.)
 * ------------------------------------------------------------------------- */
function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <svg
        viewBox="0 0 24 24"
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--yt-text-secondary)]"
        fill="currentColor"
        aria-hidden
      >
        <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 5 1.49-1.49-5-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search channels"
        className="w-full pl-9 pr-3 py-2 rounded-full bg-[color:var(--yt-chip)] border border-transparent focus:bg-[color:var(--yt-surface)] focus:border-[color:var(--yt-border)] focus:outline-none focus:ring-1 focus:ring-[color:var(--yt-blue)] text-sm text-[color:var(--yt-text)] placeholder:text-[color:var(--yt-text-secondary)] transition-colors"
      />
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * SortControl — pill button group for sort order.
 * ------------------------------------------------------------------------- */
function SortControl({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  const opts: { key: SortKey; label: string }[] = [
    { key: "popular", label: "Popular" },
    { key: "videos", label: "Most videos" },
    { key: "recent", label: "Recent" },
  ];
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-thin">
      {opts.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`yt-chip ${value === o.key ? "yt-chip-active" : ""}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */
type SortKey = "popular" | "videos" | "recent";

/** Compact number formatting: 1234 → "1.2K", 1234567 → "1.2M". */
function compact(n: number): string {
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

/** Lower-case ASCII slug for `@handle` display. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
}

/** Short relative time: "3h ago", "2d ago", "5w ago", "3mo ago". */
function relativeTime(t: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

/* ----------------------------------------------------------------------------
 * Props bundle passed in by the server component.
 * `CompactStats` is a slimmed-down version of ChannelStats for serialization.
 * ------------------------------------------------------------------------- */
export interface ChannelCardData {
  channel: ChannelInfo;
  stats: CompactStats;
  recent: MediaItem[];
  attribution?: Map<string, FileAttribution>;
}

/* ----------------------------------------------------------------------------
 * CurrentUserContext — information about the visitor that's relevant to the
 * directory. `null` when the visitor isn't logged in. `showUploadCta` is the
 * signal to render the "Upload to your channel!" card (logged in + has no
 * channel of their own yet).
 * ------------------------------------------------------------------------- */
export interface CurrentUserContext {
  name: string;
  channel: ChannelInfo;
  showUploadCta: boolean;
}

/* ----------------------------------------------------------------------------
 * UploadToYourChannelCard — YouTube-style CTA card shown to logged-in
 * visitors who don't yet have a channel. Visually mirrors the regular
 * channel card shell (gradient banner, avatar, name, stats) so it feels
 * native to the directory, but its "stats" are a 3-step quick-start path
 * and the bottom CTA invites the visitor to upload their first file.
 *
 * The card is intentionally NOT a `<Link>` wrapping the whole tile
 * because clicking anywhere would feel ambiguous — instead each call-
 * to-action is a discrete link. The whole tile stays focusable via
 * keyboard tab order.
 * ------------------------------------------------------------------------- */
function UploadToYourChannelCard({
  user,
}: {
  user: CurrentUserContext;
}) {
  return (
    <article
      className="group relative flex flex-col rounded-2xl bg-[color:var(--yt-surface)] border border-dashed border-[color:var(--yt-blue)]/40 overflow-hidden hover:shadow-md hover:border-[color:var(--yt-blue)] transition-all"
      aria-label="Create your channel"
    >
      {/* Animated gradient banner — eye-catching without being noisy */}
      <div
        className="relative h-20 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${user.channel.color} 0%, ${user.channel.color}55 60%, #065fd4 100%)`,
        }}
        aria-hidden
      >
        {/* Subtle dotted overlay (YouTube uses this on placeholder cards) */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "10px 10px",
          }}
        />
        {/* "New" pill in the top-right corner */}
        <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-sm text-[10px] font-semibold uppercase tracking-wider text-white">
          <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--yt-brand)] animate-pulse" />
          Yours
        </span>
      </div>

      {/* Avatar + identity */}
      <div className="px-5 -mt-9">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold ring-4 ring-[color:var(--yt-surface)]"
          style={{ backgroundColor: user.channel.color }}
          aria-hidden
        >
          {user.channel.initial}
        </div>

        <div className="mt-3">
          <h3 className="text-base font-semibold text-[color:var(--yt-text)] leading-snug">
            Upload to your channel!
          </h3>
          <p className="text-xs text-[color:var(--yt-text-secondary)] mt-0.5">
            @{slugify(user.name)}
          </p>
        </div>
      </div>

      {/* 3-step quick-start path (replaces the stats row) */}
      <div className="px-5 mt-4 space-y-2">
        <QuickStep n={1} label="Create something" />
        <QuickStep n={2} label="Upload your first file" />
        <QuickStep n={3} label="Share with everyone" />
      </div>

      {/* Copy */}
      <p className="px-5 mt-4 text-xs text-[color:var(--yt-text-secondary)] leading-relaxed">
        Your channel is ready and waiting. Upload a photo, GIF, or video and
        it will appear here for everyone to discover.
      </p>

      {/* Spacer pushes the CTA to the bottom so all cards line up */}
      <div className="flex-1" />

      {/* CTA stack */}
      <div className="px-5 pb-5 mt-5 flex flex-col gap-2">
        <Link
          href="/channel"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[color:var(--yt-blue)] hover:bg-[color:var(--yt-blue)]/90 text-white rounded-full text-sm font-semibold transition-colors shadow-sm"
        >
          <UploadPlusIcon className="w-4 h-4" />
          Upload your first file
        </Link>
        <Link
          href="/generate"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[color:var(--yt-chip)] hover:bg-[color:var(--yt-hover)] text-[color:var(--yt-text)] rounded-full text-sm font-medium transition-colors"
        >
          <SparklesIcon className="w-4 h-4" />
          Or generate with AI
        </Link>
      </div>
    </article>
  );
}

/* ----------------------------------------------------------------------------
 * QuickStep — a single "1 · Create" line used inside the CTA card.
 * ------------------------------------------------------------------------- */
function QuickStep({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[color:var(--yt-chip)] text-[11px] font-semibold text-[color:var(--yt-text-secondary)] flex items-center justify-center tabular-nums">
        {n}
      </span>
      <span className="text-xs text-[color:var(--yt-text)]">{label}</span>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Inline icons — kept local so the card stays self-contained.
 * ------------------------------------------------------------------------- */
function UploadPlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2zm7-6H3v12h18V7zm0-2c1.1 0 2 .9 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h18z" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3l1.9 4.7L18.6 9.6l-4.7 1.9L12 16.2l-1.9-4.7L5.4 9.6l4.7-1.9L12 3z" />
      <path d="M19 14l.9 2.3 2.3.9-2.3.9L19 20.4l-.9-2.3-2.3-.9 2.3-.9L19 14z" />
    </svg>
  );
}