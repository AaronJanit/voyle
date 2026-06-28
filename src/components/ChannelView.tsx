"use client";

import { MediaItem } from "@/lib/media";
import { useState, useRef } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import { ChannelInfo } from "@/lib/channel";

interface ChannelViewProps {
  items: MediaItem[];
  channel: ChannelInfo;
  isOwnChannel: boolean;
}

type Tab = "videos" | "about";

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
  channel,
  isOwnChannel,
}: ChannelViewProps) {
  // New channels (no uploads yet) skip the empty Videos grid and go
  // straight to the About tab so the "how to get started" guidance is
  // the first thing the user sees.
  const [tab, setTab] = useState<Tab>(
    isOwnChannel && items.length === 0 ? "about" : "videos"
  );

  return (
    <div className="max-w-[1600px] mx-auto pb-12">
      <ChannelBanner channel={channel} />
      <ChannelHeader
        channel={channel}
        items={items}
        isOwnChannel={isOwnChannel}
      />
      <TabBar tab={tab} setTab={setTab} />

      {tab === "videos" ? (
        <VideosTab items={items} isOwnChannel={isOwnChannel} />
      ) : (
        <AboutTab
          isOwnChannel={isOwnChannel}
          isEmpty={items.length === 0}
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
  isOwnChannel,
}: {
  channel: ChannelInfo;
  items: MediaItem[];
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
        accept="image/*,video/*,.gif,.mp4,.webm,.mov,.avi,.mkv,.m4v"
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
function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string }[] = [
    { key: "videos", label: "Videos" },
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
}: {
  items: MediaItem[];
  isOwnChannel: boolean;
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
          <ChannelCard key={item.id} item={item} />
        ))}
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

  return (
    <div className="px-4 sm:px-6 pt-6">
      <div className="max-w-3xl">
        <p className="text-sm text-[color:var(--yt-text)] leading-relaxed">
          {isOwnChannel
            ? "This is your channel. Anything you upload here will be attributed to you and appear on the home grid for everyone to see."
            : "This channel publishes content to the site. Check the Videos tab to see what's been uploaded."}
        </p>

        {isOwnChannel && <HowToCreate />}

        {isOwnChannel && (
          <Link
            href="/generate"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--yt-blue)] hover:underline"
          >
            Or create something with AI
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
                d="M5 12h14M13 5l7 7-7 7"
              />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Getting-started landing — shown on the user's own channel before their
 * first upload. Big YouTube-style hero + the workflow cards at a larger
 * scale + a clear CTA. Designed to fill the page the way a real YouTube
 * "Welcome to your channel" prompt would.
 * ------------------------------------------------------------------------- */
function GettingStartedTab() {
  return (
    <div className="px-4 sm:px-6 pt-8 pb-4">
      {/* Hero */}
      <div className="max-w-3xl mx-auto text-center py-10 sm:py-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[color:var(--yt-chip)] text-xs font-medium text-[color:var(--yt-text-secondary)] mb-5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--yt-brand)] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--yt-brand)]" />
          </span>
          Your channel is ready
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold text-[color:var(--yt-text)] tracking-tight">
          Get started in 4 steps
        </h2>
        <p className="mt-3 text-base text-[color:var(--yt-text-secondary)] max-w-xl mx-auto leading-relaxed">
          Create your first AI video, photo, or GIF and upload it here.
          Everything you publish will be attributed to you and appear on the
          home grid.
        </p>
      </div>

      {/* Steps — large cards */}
      <ol className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        {GETTING_STARTED_STEPS.map((step, i) => (
          <li
            key={step.num}
            className="relative flex gap-4 p-5 sm:p-6 rounded-2xl bg-[color:var(--yt-surface)] border border-[color:var(--yt-border)]"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[color:var(--yt-chip)] flex items-center justify-center text-sm font-semibold text-[color:var(--yt-text)]">
              {step.num}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-[color:var(--yt-text)]">
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-[color:var(--yt-text-secondary)] leading-relaxed">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {/* Bottom CTA row */}
      <div className="max-w-3xl mx-auto mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            // Scroll up so the Upload button in the channel header is in view
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[color:var(--yt-brand)] text-white rounded-full text-sm font-medium hover:bg-[color:var(--yt-brand-hover)] transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2zm7-6H3v12h18V7zm0-2c1.1 0 2 .9 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h18z" />
          </svg>
          Upload your first file
        </button>
        <Link
          href="/generate"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[color:var(--yt-surface)] text-[color:var(--yt-text)] border border-[color:var(--yt-border)] rounded-full text-sm font-medium hover:bg-[color:var(--yt-hover)] transition-colors"
        >
          Or generate one with AI
        </Link>
      </div>
    </div>
  );
}

/* The 4 steps shown in the getting-started landing. Larger / more
 * detailed than the compact About view. */
const GETTING_STARTED_STEPS: { num: string; title: string; body: React.ReactNode }[] = [
  {
    num: "01",
    title: "Find a photo or write a prompt",
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
        , paste your picture, open the <span className="font-medium">+</span>{" "}
        menu, choose{" "}
        <span className="font-medium text-[color:var(--yt-text)]">video</span>,
        and describe what you want it to do.
      </>
    ),
  },
  {
    num: "04",
    title: "Upload it to your channel",
    body: (
      <>
        Click the <span className="font-medium">Upload</span> button at the top
        of this page, pick your finished clip or picture, and it&apos;ll show
        up on your channel — and the home grid — instantly.
      </>
    ),
  },
];

/* Compact "how to create content" workflow — shown in the About tab
 * once the channel already has content. */
function HowToCreate() {
  const steps: { num: string; title: string; body: React.ReactNode }[] = [
    {
      num: "01",
      title: "Find a photo or prompt",
      body: (
        <>
          Grab a teacher photo from{" "}
          <a
            href="https://mesivta.co.uk"
            target="_blank"
            rel="noreferrer"
            className="text-[color:var(--yt-blue)] hover:underline"
          >
            mesivta.co.uk
          </a>
          , or write your own prompt.
        </>
      ),
    },
    {
      num: "02",
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
      title: "Make it move (optional)",
      body: (
        <>
          On{" "}
          <a
            href="https://chat.qwen.ai"
            target="_blank"
            rel="noreferrer"
            className="text-[color:var(--yt-blue)] hover:underline"
          >
            chat.qwen.ai
          </a>
          , open the <span className="font-medium">+</span> menu, choose{" "}
          <span className="font-medium text-[color:var(--yt-text)]">video</span>,
          and describe what it should do.
        </>
      ),
    },
    {
      num: "04",
      title: "Upload it here",
      body: (
        <>
          Click the Upload button at the top of this page and your finished
          clip or picture will appear on your channel instantly.
        </>
      ),
    },
  ];

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-[color:var(--yt-text)] mb-4">
        How to create content
      </h2>
      <ol className="space-y-3">
        {steps.map((step) => (
          <li
            key={step.num}
            className="flex gap-3 p-4 rounded-xl bg-[color:var(--yt-surface)] border border-[color:var(--yt-border)]"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[color:var(--yt-chip)] flex items-center justify-center text-sm font-medium text-[color:var(--yt-text)]">
              {step.num}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-[color:var(--yt-text)]">
                {step.title}
              </h3>
              <p className="mt-0.5 text-sm text-[color:var(--yt-text-secondary)] leading-relaxed">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * A single video card in the channel grid — same style as YouTubeGrid.
 * ------------------------------------------------------------------------- */
function ChannelCard({ item }: { item: MediaItem }) {
  const shareUrl = `/p/${encodeURIComponent(item.path)}`;

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
