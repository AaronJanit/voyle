"use client";

import { MediaItem } from "@/lib/media";
import { useState, useRef } from "react";
import Link from "next/link";
import {
  Upload,
  ArrowRight,
  Sparkles,
  ImagePlus,
  Wand2,
  Video,
  Send,
  MousePointerClick,
  Search,
  MessageSquare,
  ShieldCheck,
  Film,
  CircleUser,
} from "lucide-react";
import { ChannelInfo, FileAttribution } from "@/lib/channel";

interface ChannelViewProps {
  items: MediaItem[];
  audioItems?: MediaItem[];
  channel: ChannelInfo;
  isOwnChannel: boolean;
  attribution?: Map<string, FileAttribution>;
}

type Tab = "videos" | "muzic" | "about";

/* YouTube-style channel page.
 *
 * Layout (top to bottom):
 *   1. Banner — a colored gradient derived from the channel avatar color.
 *   2. Channel identity row — avatar, name, handle, content count, action
 *      button (Upload for own channel).
 *   3. Tab bar — Videos | About. Videos is the default and shows the grid.
 *      About shows the "how to create content" workflow collapsed into one
 *      clean section so it never competes with the main content.
 *   4. Content area — grid (Videos tab) or about section (About tab).
 */
export default function ChannelView({
  items,
  audioItems = [],
  channel,
  isOwnChannel,
  attribution,
}: ChannelViewProps) {
  // New channels (no uploads yet) skip the empty Videos grid and go
  // straight to the About tab so the "how to get started" guidance is
  // the first thing the user sees.
  const [tab, setTab] = useState<Tab>(
    isOwnChannel && items.length === 0 && audioItems.length === 0
      ? "about"
      : items.length === 0 && audioItems.length > 0
        ? "muzic"
        : "videos"
  );

  const hasAudio = audioItems.length > 0;

  return (
    <div className="max-w-[1600px] mx-auto pb-12">
      <ChannelBanner channel={channel} />
      <ChannelHeader
        channel={channel}
        items={items}
        audioCount={audioItems.length}
        isOwnChannel={isOwnChannel}
      />
      <TabBar tab={tab} setTab={setTab} hasAudio={hasAudio} />

      {tab === "videos" ? (
        <VideosTab items={items} isOwnChannel={isOwnChannel} attribution={attribution} />
      ) : tab === "muzic" ? (
        <MuzicTab items={audioItems} isOwnChannel={isOwnChannel} attribution={attribution} />
      ) : (
        <AboutTab
          isOwnChannel={isOwnChannel}
          isEmpty={items.length === 0 && audioItems.length === 0}
        />
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Banner — a wide gradient bar at the top of the channel page.
 * Uses the channel avatar color so each channel has its own identity.
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
 * Channel identity row — avatar + name/handle/count + action button.
 * Matches YouTube's layout: avatar on the left, identity in the middle,
 * action button on the right.
 * ------------------------------------------------------------------------- */
function ChannelHeader({
  channel,
  items,
  audioCount,
  isOwnChannel,
}: {
  channel: ChannelInfo;
  items: MediaItem[];
  audioCount: number;
  isOwnChannel: boolean;
}) {
  return (
    <div className="px-4 sm:px-6 pt-4">
      <div className="flex items-center gap-5">
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
            <span>
              {items.length} {items.length === 1 ? "video" : "videos"}
            </span>
            {audioCount > 0 && (
              <>
                <span aria-hidden>·</span>
                <span>
                  {audioCount} {audioCount === 1 ? "track" : "tracks"}
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-sm text-[color:var(--yt-text-secondary)]">
            Welcome to {channel.name}&apos;s channel.
          </p>
        </div>

        {isOwnChannel && <UploadButton />}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Upload button — owned by the channel header so it sits in the action slot.
 * On YouTube this is where "Manage videos" would live for the channel owner;
 * we expose the upload directly because that's the primary action.
 * ------------------------------------------------------------------------- */
function UploadButton() {
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadMsg(null);
    const fd = new FormData();
    for (let i = 0; i < files.length; i++) fd.append("files", files[i]);
    fetch("/api/media", { method: "POST", body: fd })
      .then((r) => r.json())
      .then((d) => {
        if (d.errors?.length) {
          setUploadMsg(d.errors.map((er: { error: string }) => er.error).join(", "));
        } else {
          setUploadMsg(`Uploaded ${d.saved?.length ?? 0} file(s)`);
          window.location.reload();
        }
      })
      .catch((err) => setUploadMsg(`Upload failed: ${err.message}`))
      .finally(() => {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.gif,.mp4,.webm,.mov,.avi,.mkv,.m4v,.mp3,.wav,.ogg,.m4a"
        onChange={handleUpload}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-4 py-2 bg-[color:var(--yt-text)] text-[color:var(--yt-bg)] rounded-full text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <Upload className="w-4 h-4" />
        {uploading ? "Uploading…" : "Upload"}
      </button>
      {uploadMsg && (
        <p className="text-xs text-[color:var(--yt-text-secondary)] max-w-[12rem] text-right">
          {uploadMsg}
        </p>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Tab bar — sits below the channel header, above the content.
 * YouTube-style underline indicator on the active tab.
 * ------------------------------------------------------------------------- */
function TabBar({ tab, setTab, hasAudio }: { tab: Tab; setTab: (t: Tab) => void; hasAudio: boolean }) {
  const tabs: { key: Tab; label: string }[] = [
    { key: "videos", label: "Videos" },
    ...(hasAudio ? [{ key: "muzic" as Tab, label: "Muzic" }] : []),
    { key: "about", label: "About" },
  ];

  return (
    <nav
      role="tablist"
      className="mt-6 border-b border-[color:var(--yt-border)]"
    >
      <div className="px-4 sm:px-6 flex gap-8">
        {tabs.map((t) => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={`relative py-3 text-sm font-medium transition-colors ${
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
 * Videos tab — the content grid. Empty state is YouTube-style:
 * centered icon + "No content yet" message + (for own channel) a CTA.
 * ------------------------------------------------------------------------- */
function VideosTab({
  items,
  isOwnChannel,
  attribution,
}: {
  items: MediaItem[];
  isOwnChannel: boolean;
  attribution?: Map<string, FileAttribution>;
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
          {isOwnChannel ? "No videos yet" : "This channel has no videos yet"}
        </p>
        <p className="mt-1 text-sm text-[color:var(--yt-text-secondary)] max-w-sm">
          {isOwnChannel
            ? "Upload your first video or photo using the button above to get started."
            : "Check back later for new content."}
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 pt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
        {items.map((item) => (
          <ChannelCard key={item.id} item={item} attribution={attribution} />
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
  isOwnChannel,
  attribution,
}: {
  items: MediaItem[];
  isOwnChannel: boolean;
  attribution?: Map<string, FileAttribution>;
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
          {isOwnChannel ? "No tracks yet" : "This channel has no tracks yet"}
        </p>
        <p className="mt-1 text-sm text-[color:var(--yt-text-secondary)] max-w-sm">
          {isOwnChannel
            ? "Upload sound files (.mp3, .wav, .ogg, .m4a) using the button above to get started."
            : "Check back later for new tracks."}
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 pt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4">
        {items.map((item) => (
          <AudioCard key={item.id} item={item} attribution={attribution} />
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Audio card — title + inline audio player + attribution.
 * ------------------------------------------------------------------------- */
function AudioCard({
  item,
  attribution,
}: {
  item: MediaItem;
  attribution?: Map<string, FileAttribution>;
}) {
  const realAttribution = attribution?.get(item.path);
  const channelName = realAttribution?.channel.name;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[color:var(--yt-surface)] border border-[color:var(--yt-border)]">
      <div
        className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
        style={{
          backgroundColor: realAttribution?.channel.color ?? "var(--yt-chip)",
        }}
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
        {channelName && (
          <Link
            href={`/channel/${encodeURIComponent(channelName)}`}
            className="text-xs text-[color:var(--yt-text-secondary)] hover:text-[color:var(--yt-blue)]"
          >
            {channelName}
          </Link>
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
 * About tab — channel description + "how to create content" workflow.
 * On a new channel (no uploads yet), this is the landing view, so it gets
 * a hero welcome, larger step cards, and breathing room. On a populated
 * channel, it stays compact.
 * ------------------------------------------------------------------------- */
function AboutTab({
  isOwnChannel,
  isEmpty,
}: {
  isOwnChannel: boolean;
  isEmpty: boolean;
}) {
  if (isEmpty && isOwnChannel) {
    return <GettingStartedTab />;
  }

  return <RegularAbout isOwnChannel={isOwnChannel} />;
}

/* ----------------------------------------------------------------------------
 * Regular channel About view — shown on any populated channel.
 * A two-column layout: left = channel stats card + description, right =
 * a vertical "How to create content" timeline with Lucide icons.
 * ------------------------------------------------------------------------- */
function RegularAbout({ isOwnChannel }: { isOwnChannel: boolean }) {
  return (
    <div className="px-4 sm:px-6 pt-8 pb-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 lg:gap-8">
        {/* Left column — channel info card */}
        <aside className="space-y-4">
          <div className="p-6 rounded-2xl bg-[color:var(--yt-surface)] border border-[color:var(--yt-border)]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--yt-text-secondary)]">
              <CircleUser className="w-4 h-4" />
              About this channel
            </div>
            <p className="mt-4 text-sm text-[color:var(--yt-text)] leading-relaxed">
              {isOwnChannel
                ? "This is your channel. Anything you upload here will be attributed to you and appear on the home grid for everyone to see."
                : "This channel publishes content to the site. Check the Videos tab to see what's been uploaded."}
            </p>
          </div>

          {isOwnChannel && (
            <div className="p-6 rounded-2xl bg-[color:var(--yt-surface)] border border-[color:var(--yt-border)]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--yt-text-secondary)]">
                <Sparkles className="w-4 h-4" />
                Quick actions
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/generate"
                  className="inline-flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-[color:var(--yt-chip)] hover:bg-[color:var(--yt-hover)] transition-colors group"
                >
                  <span className="flex items-center gap-3 text-sm font-medium text-[color:var(--yt-text)]">
                    <Wand2 className="w-4 h-4 text-[color:var(--yt-blue)]" />
                    Create with AI
                  </span>
                  <ArrowRight className="w-4 h-4 text-[color:var(--yt-text-secondary)] group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          )}
        </aside>

        {/* Right column — workflow */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[color:var(--yt-text)]">
              How to create content
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[color:var(--yt-chip)] text-[10px] font-medium uppercase tracking-wider text-[color:var(--yt-text-secondary)]">
              <ShieldCheck className="w-3 h-3" />
              4 steps
            </span>
          </div>

          <ol className="relative space-y-3">
            <span
              aria-hidden
              className="absolute left-[19px] top-4 bottom-4 w-px bg-[color:var(--yt-border)]"
            />
            {ABOUT_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.num}
                  className="relative flex gap-4 p-5 rounded-2xl bg-[color:var(--yt-surface)] border border-[color:var(--yt-border)] hover:shadow-sm transition-shadow"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[color:var(--yt-text)] text-[color:var(--yt-bg)] flex items-center justify-center relative z-10">
                    <Icon className="w-5 h-5" strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-semibold text-[color:var(--yt-text)]">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm text-[color:var(--yt-text-secondary)] leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Getting-started landing — shown on the user's own channel before their
 * first upload. Large YouTube-style hero + horizontal step strip + clear
 * CTA cards. Designed to fill the page the way a real YouTube "Welcome to
 * your channel" prompt would.
 * ------------------------------------------------------------------------- */
function GettingStartedTab() {
  return (
    <div className="px-4 sm:px-6 pt-6 pb-12">
      {/* ── Hero ── */}
      <div className="relative max-w-5xl mx-auto overflow-hidden rounded-3xl bg-[color:var(--yt-surface)] border border-[color:var(--yt-border)]">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "24px 24px",
            color: "var(--yt-text)",
          }}
        />
        <div className="relative px-6 sm:px-10 py-12 sm:py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[color:var(--yt-chip)] text-xs font-medium text-[color:var(--yt-text-secondary)] mb-6">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--yt-brand)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--yt-brand)]" />
            </span>
            Your channel is ready
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold text-[color:var(--yt-text)] tracking-tight">
            Make your{" "}
            <span className="bg-gradient-to-r from-[color:var(--yt-blue)] to-[color:var(--yt-brand)] bg-clip-text text-transparent">
              first
            </span>{" "}
            upload
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[color:var(--yt-text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Create an AI video, photo, or GIF and bring it back here. Everything
            you publish will be attributed to you and appear on the home grid.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[color:var(--yt-brand)] text-white rounded-full text-sm font-semibold hover:bg-[color:var(--yt-brand-hover)] shadow-sm transition-all hover:shadow"
            >
              <Upload className="w-4 h-4" strokeWidth={2.5} />
              Upload your first file
            </button>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[color:var(--yt-chip)] text-[color:var(--yt-text)] rounded-full text-sm font-semibold hover:bg-[color:var(--yt-hover)] transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Or generate with AI
            </Link>
          </div>
        </div>
      </div>

      {/* ── 4-step strip ── */}
      <div className="max-w-5xl mx-auto mt-8">
        <div className="flex items-center gap-3 mb-5">
          <h3 className="text-lg sm:text-xl font-bold text-[color:var(--yt-text)]">
            How to create content
          </h3>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[color:var(--yt-chip)] text-[10px] font-medium uppercase tracking-wider text-[color:var(--yt-text-secondary)]">
            <ShieldCheck className="w-3 h-3" />
            4 steps
          </span>
        </div>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {GETTING_STARTED_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <li
                key={step.num}
                className="group relative flex flex-col p-5 rounded-2xl bg-[color:var(--yt-surface)] border border-[color:var(--yt-border)] hover:border-[color:var(--yt-text)] transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[color:var(--yt-text)] text-[color:var(--yt-bg)] flex items-center justify-center">
                    <Icon className="w-5 h-5" strokeWidth={2.25} />
                  </div>
                  <span className="text-xs font-mono font-medium text-[color:var(--yt-text-secondary)]">
                    {step.num}
                  </span>
                </div>
                <h4 className="text-base font-semibold text-[color:var(--yt-text)]">
                  {step.title}
                </h4>
                <p className="mt-2 text-sm text-[color:var(--yt-text-secondary)] leading-relaxed">
                  {step.body}
                </p>
              </li>
            );
          })}
        </ol>
      </div>

      {/* ── Two CTA cards ── */}
      <div className="max-w-5xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/generate"
          className="group flex items-center gap-4 p-5 rounded-2xl bg-[color:var(--yt-surface)] border border-[color:var(--yt-border)] hover:border-[color:var(--yt-blue)] transition-colors"
        >
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[color:var(--yt-blue)]/10 text-[color:var(--yt-blue)] flex items-center justify-center">
            <Sparkles className="w-6 h-6" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-[color:var(--yt-text)]">
              Generate with AI
            </h4>
            <p className="mt-0.5 text-xs text-[color:var(--yt-text-secondary)]">
              Type a prompt, get a picture. Skip the download dance entirely.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-[color:var(--yt-text-secondary)] group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/chat"
          className="group flex items-center gap-4 p-5 rounded-2xl bg-[color:var(--yt-surface)] border border-[color:var(--yt-border)] hover:border-[color:var(--yt-blue)] transition-colors"
        >
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[color:var(--yt-blue)]/10 text-[color:var(--yt-blue)] flex items-center justify-center">
            <MessageSquare className="w-6 h-6" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-[color:var(--yt-text)]">
              Ask Voyle for ideas
            </h4>
            <p className="mt-0.5 text-xs text-[color:var(--yt-text-secondary)]">
              Not sure what to make? Chat with the in-house AI for inspiration.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-[color:var(--yt-text-secondary)] group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

/* The 4 large steps shown in the getting-started landing. Each has its
 * own Lucide icon that matches the action — ImagePlus for grabbing,
 * Wand2 for editing, Video for animating, Send for uploading. */
const GETTING_STARTED_STEPS: {
  num: string;
  title: string;
  body: React.ReactNode;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  {
    num: "01",
    icon: ImagePlus,
    title: "Find a photo or prompt",
    body: (
      <>
        Grab a teacher photo from{" "}
        <a
          href="https://mesivta.co.uk"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[color:var(--yt-blue)] hover:underline"
        >
          mesivta.co.uk
        </a>
        , or come up with your own idea.
      </>
    ),
  },
  {
    num: "02",
    icon: Wand2,
    title: "Edit it with AI",
    body: (
      <>
        Upload it to{" "}
        <span className="font-medium text-[color:var(--yt-text)]">ChatGPT</span>
        ,{" "}
        <span className="font-medium text-[color:var(--yt-text)]">
          Microsoft Copilot
        </span>
        , or{" "}
        <span className="font-medium text-[color:var(--yt-text)]">Gemini</span>{" "}
        and describe the edits you want. Or open the{" "}
        <Link
          href="/generate"
          className="font-medium text-[color:var(--yt-blue)] hover:underline"
        >
          Create
        </Link>{" "}
        page to make one right here.
      </>
    ),
  },
  {
    num: "03",
    icon: Video,
    title: "Make it move (optional)",
    body: (
      <>
        On{" "}
        <a
          href="https://chat.qwen.ai"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[color:var(--yt-blue)] hover:underline"
        >
          chat.qwen.ai
        </a>
        , paste your picture, choose{" "}
        <span className="font-medium text-[color:var(--yt-text)]">video</span>,
        and describe what you want it to do.
      </>
    ),
  },
  {
    num: "04",
    icon: Send,
    title: "Upload to your channel",
    body: (
      <>
        Click the <span className="font-medium">Upload</span> button at the top
        of this page, pick your finished clip or picture, and it&apos;ll show
        up on your channel instantly.
      </>
    ),
  },
];

/* The 4 compact steps shown in the regular About tab. Same content,
 * different icon emphasis. */
const ABOUT_STEPS: {
  num: string;
  title: string;
  body: React.ReactNode;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  {
    num: "01",
    icon: Search,
    title: "Find a photo or prompt",
    body: (
      <>
        Grab a teacher photo from{" "}
        <a
          href="https://mesivta.co.uk"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[color:var(--yt-blue)] hover:underline"
        >
          mesivta.co.uk
        </a>
        , or write your own prompt.
      </>
    ),
  },
  {
    num: "02",
    icon: Sparkles,
    title: "Edit it with AI",
    body: (
      <>
        Paste it into{" "}
        <span className="font-medium text-[color:var(--yt-text)]">ChatGPT</span>
        ,{" "}
        <span className="font-medium text-[color:var(--yt-text)]">
          Microsoft Copilot
        </span>
        , or{" "}
        <span className="font-medium text-[color:var(--yt-text)]">Gemini</span>{" "}
        and describe what you want.
      </>
    ),
  },
  {
    num: "03",
    icon: Film,
    title: "Make it move (optional)",
    body: (
      <>
        On{" "}
        <a
          href="https://chat.qwen.ai"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[color:var(--yt-blue)] hover:underline"
        >
          chat.qwen.ai
        </a>
        , choose{" "}
        <span className="font-medium text-[color:var(--yt-text)]">video</span>{" "}
        and describe what it should do.
      </>
    ),
  },
  {
    num: "04",
    icon: MousePointerClick,
    title: "Upload it here",
    body: (
      <>
        Click the <span className="font-medium">Upload</span> button at the top
        of this page and your finished clip or picture will appear on your
        channel instantly.
      </>
    ),
  },
];

/* ----------------------------------------------------------------------------
 * A single video card in the channel grid — same style as YouTubeGrid.
 * ------------------------------------------------------------------------- */
function ChannelCard({
  item,
  attribution,
}: {
  item: MediaItem;
  attribution?: Map<string, FileAttribution>;
}) {
  const shareUrl = `/p/${encodeURIComponent(item.path)}`;
  const realAttribution = attribution?.get(item.path);
  const date = realAttribution?.uploadedAt ?? item.mtime;

  return (
    <article className="group">
      <Link
        href={shareUrl}
        className="block relative aspect-video rounded-xl overflow-hidden bg-[color:var(--yt-chip)]"
      >
        {item.type === "video" ? (
          <video
            src={`/api/media/file/${item.path}`}
            muted
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={`/api/media/file/${item.path}`}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        )}
        {item.type === "video" && (
          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-xs font-medium rounded">
            VIDEO
          </span>
        )}
        {item.type === "gif" && (
          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-xs font-medium rounded">
            GIF
          </span>
        )}
        {item.type === "photo" && item.isGenerated && (
          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-xs font-medium rounded">
            AI
          </span>
        )}
      </Link>
      <div className="mt-3">
        <h3 className="text-sm font-medium leading-snug line-clamp-2 text-[color:var(--yt-text)]">
          <Link href={shareUrl} className="hover:text-[color:var(--yt-text)]">
            {prettyTitle(item.name)}
          </Link>
        </h3>
        <p className="mt-1 text-xs text-[color:var(--yt-text-secondary)]">
          {formatViews(item, attribution)} · {timeAgo(date)}
        </p>
      </div>
    </article>
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
  const dot = filename.lastIndexOf(".");
  const stem = dot > 0 ? filename.slice(0, dot) : filename;
  return stem
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── View count + date helpers (shared logic with YouTubeGrid) ─────── */

/* Compact number formatting: 1234 → "1.2K", 1234567 → "1.2M". */
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

/* Format the real view count from the database (via attribution).
 * Falls back to 0 for unattributed files. */
function formatViews(
  item: MediaItem,
  attribution?: Map<string, FileAttribution>
): string {
  const views = attribution?.get(item.path)?.views ?? 0;
  return `${compactNumber(views)} views`;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
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
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}
