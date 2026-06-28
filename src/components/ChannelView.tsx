"use client";

import { MediaItem } from "@/lib/media";
import { useState, useRef } from "react";
import Link from "next/link";
import { PlusSquare, ArrowRight } from "lucide-react";
import { ChannelInfo } from "@/lib/channel";

interface ChannelViewProps {
  items: MediaItem[];
  channel: ChannelInfo;
  isOwnChannel: boolean;
}

/* YouTube-style channel page. Shows a channel banner/header with avatar,
 * name, and content count. If this is the user's own channel, an upload
 * button is shown. Below the header is the content grid, followed by a
 * "How to create content" guide (only on the user's own channel). */
export default function ChannelView({
  items,
  channel,
  isOwnChannel,
}: ChannelViewProps) {
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
    <div className="px-4 sm:px-6 py-4 max-w-[1600px] mx-auto">
      {/* Channel header — YouTube-style banner with avatar + name */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="flex-shrink-0 w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-medium"
          style={{ backgroundColor: channel.color }}
          aria-hidden
        >
          {channel.initial}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-[color:var(--yt-text)]">
            {channel.name}
          </h1>
          <p className="text-sm text-[color:var(--yt-text-secondary)] mt-1">
            {items.length} {items.length === 1 ? "video" : "videos"}
          </p>
        </div>

        {/* Upload button — only on the user's own channel */}
        {isOwnChannel && (
          <div className="ml-auto">
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
              className="flex items-center gap-2 px-5 py-2.5 bg-[color:var(--yt-brand)] text-white rounded-full text-sm font-medium hover:bg-[color:var(--yt-brand-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <PlusSquare className="w-5 h-5" />
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
        )}
      </div>

      {uploadMsg && (
        <p className="text-sm text-[color:var(--yt-text-secondary)] mb-4">
          {uploadMsg}
        </p>
      )}

      {/* Content grid */}
      {items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[color:var(--yt-text-secondary)] text-sm mb-2">
            {isOwnChannel
              ? "No content yet. Upload your first video or photo using the button above."
              : "This channel has no content yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {items.map((item) => (
            <ChannelCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* How to create content guide — only on the user's own channel */}
      {isOwnChannel && <ContentGuide />}

      {/* Make Your Own workflow — only on the user's own channel */}
      {isOwnChannel && <MakeYourOwnSection />}
    </div>
  );
}

/* A single video card in the channel grid — same style as YouTubeGrid. */
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

/* "How to create content" guide section. */
function ContentGuide() {
  return (
    <div className="mt-12 border-t border-[color:var(--yt-border)] pt-8">
      <h2 className="text-lg font-semibold text-[color:var(--yt-text)] mb-4">
        How to create content
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GuideStep
          number={1}
          title="Upload a file"
          description="Click the Upload button above and select a photo, video, or GIF from your device. Files up to 100 MB are supported."
        />
        <GuideStep
          number={2}
          title="It publishes instantly"
          description="Your content appears on your channel and the home grid immediately. There's no review queue — what you upload is what the world sees."
        />
        <GuideStep
          number={3}
          title="Create with AI"
          description={
            <>
              Want to generate images from a text prompt? Visit the{" "}
              <Link
                href="/generate"
                className="text-[color:var(--yt-blue)] hover:underline"
              >
                Create page
              </Link>{" "}
              to describe anything and get a picture back.
            </>
          }
        />
        <GuideStep
          number={4}
          title="Share your content"
          description="Click any thumbnail to open the share page, where you can copy a link or embed code to post your content anywhere."
        />
      </div>
    </div>
  );
}

function GuideStep({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-[color:var(--yt-surface)] border border-[color:var(--yt-border)]">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[color:var(--yt-chip)] flex items-center justify-center text-sm font-medium text-[color:var(--yt-text)]">
        {number}
      </div>
      <div>
        <h3 className="text-sm font-medium text-[color:var(--yt-text)] mb-1">
          {title}
        </h3>
        <p className="text-sm text-[color:var(--yt-text-secondary)]">
          {description}
        </p>
      </div>
    </div>
  );
}

/* "Make Your Own" workflow section — moved from the old /make-your-own page.
 * A 4-step guide for creating AI content externally and uploading it here. */
function MakeYourOwnSection() {
  return (
    <div className="mt-12 border-t border-[color:var(--yt-border)] pt-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-[color:var(--yt-border)]" />
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--yt-text-secondary)]">
          How To Create
        </span>
        <span className="h-px flex-1 bg-[color:var(--yt-border)]" />
      </div>

      <h2 className="text-2xl font-light tracking-tight text-[color:var(--yt-text)] mb-2">
        Make your{" "}
        <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-sky-500 bg-clip-text text-transparent font-normal">
          own
        </span>
      </h2>
      <p className="text-sm text-[color:var(--yt-text-secondary)] mb-6 max-w-2xl">
        Create your own AI vids + pics + gifs in four short steps. No install,
        no setup — just a browser and a good idea.
      </p>

      <ol className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {MAKE_YOUR_OWN_STEPS.map((step) => (
          <li
            key={step.num}
            className="group relative overflow-hidden rounded-2xl bg-[color:var(--yt-surface)] p-6 ring-1 ring-[color:var(--yt-border)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition"
          >
            <div
              className={`pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-gradient-to-br ${step.accent} opacity-10 blur-2xl group-hover:opacity-20 transition`}
            />
            <div className="flex items-start gap-4">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${step.accent} text-sm font-semibold text-white shadow-sm`}
              >
                {step.num}
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-[color:var(--yt-text)]">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--yt-text-secondary)]">
                  {step.body}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      {/* Final CTA */}
      <div className="mt-8 overflow-hidden rounded-3xl bg-[color:var(--yt-text)] p-8 text-white sm:p-10">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-medium tracking-tight sm:text-2xl">
              Got something good? Bring it back.
            </h3>
            <p className="mt-1.5 text-sm text-white/70">
              Upload to voyle and it&apos;ll show up in your channel next to
              everything else.
            </p>
          </div>
          <Link
            href="/channel"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[color:var(--yt-text)] hover:bg-white/90 transition"
          >
            Back to my channel
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

type MakeYourOwnStep = {
  num: string;
  title: string;
  body: React.ReactNode;
  accent: string;
};

const MAKE_YOUR_OWN_STEPS: MakeYourOwnStep[] = [
  {
    num: "01",
    accent: "from-violet-500 to-fuchsia-500",
    title: "Grab a teacher photo",
    body: (
      <>
        Head over to{" "}
        <a
          href="https://mesivta.co.uk"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[color:var(--yt-text)] underline decoration-[color:var(--yt-border)] underline-offset-4 hover:decoration-[color:var(--yt-blue)]"
        >
          mesivta.co.uk
        </a>{" "}
        and copy your desired teacher photo to your clipboard.
      </>
    ),
  },
  {
    num: "02",
    accent: "from-sky-500 to-indigo-500",
    title: "Edit it with AI",
    body: (
      <>
        Upload it to{" "}
        <span className="font-medium text-[color:var(--yt-text)]">ChatGPT</span>{" "}
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200/70 align-middle">
          recommended
        </span>
        ,{" "}
        <span className="font-medium text-[color:var(--yt-text)]">
          Microsoft Copilot
        </span>
        , or{" "}
        <span className="font-medium text-[color:var(--yt-text)]">Gemini</span>{" "}
        and describe the edits you want.
      </>
    ),
  },
  {
    num: "03",
    accent: "from-amber-500 to-rose-500",
    title: "Make it move",
    body: (
      <>
        Create an account on{" "}
        <a
          href="https://chat.qwen.ai"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[color:var(--yt-text)] underline decoration-[color:var(--yt-border)] underline-offset-4 hover:decoration-[color:var(--yt-blue)]"
        >
          chat.qwen.ai
        </a>
        , paste your generated picture, then use the{" "}
        <span className="inline-flex items-center gap-1 rounded-md bg-[color:var(--yt-chip)] px-1.5 py-0.5 text-[11px] font-medium text-[color:var(--yt-text-secondary)] ring-1 ring-[color:var(--yt-border)]">
          +
        </span>{" "}
        menu to choose{" "}
        <span className="font-medium text-[color:var(--yt-text)]">video</span>{" "}
        and describe what you want it to do.
      </>
    ),
  },
  {
    num: "04",
    accent: "from-emerald-500 to-teal-500",
    title: "Share it here",
    body: (
      <>
        Upload your finished clip or picture back to this site using the Upload
        button above and it&apos;ll live alongside everything else in your
        channel.
      </>
    ),
  },
];

function prettyTitle(filename: string): string {
  const dot = filename.lastIndexOf(".");
  const stem = dot > 0 ? filename.slice(0, dot) : filename;
  return stem
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}