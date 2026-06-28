"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, X, BadgeCheck, Sparkles } from "lucide-react";

/**
 * YouTube-style "what's new" popup.
 *
 * - Slides up from the bottom-right corner, above the page content.
 * - Appears a few seconds after the page loads (with a small bell trigger
 *   pill so the user can re-open it after dismissing).
 * - Re-shows on every page load / navigation.
 * - Styled to match YouTube: white surface, 12px radius, subtle shadow,
 *   red Subscribe CTA, Roboto font, verified-badge channel row.
 */
export default function MakeYourOwnPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [triggerVisible, setTriggerVisible] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Don't render on the dedicated channel page or login/locked.
  const hide =
    pathname === "/channel" ||
    pathname?.startsWith("/channel/") ||
    pathname === "/login" ||
    pathname === "/locked";

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Re-trigger on every page navigation so the popup shows up on each
  // page load (or whenever the user navigates to a new route).
  useEffect(() => {
    if (!hydrated || hide) {
      setOpen(false);
      setTriggerVisible(false);
      return;
    }

    // Reset state on every navigation.
    setOpen(false);
    setTriggerVisible(false);

    // Open after a short delay so it feels like a real YouTube nudge.
    const openTimer = window.setTimeout(() => {
      setOpen(true);
      setTriggerVisible(false);
    }, 6000);

    return () => {
      window.clearTimeout(openTimer);
    };
  }, [hydrated, hide, pathname]);

  if (!hydrated || hide) return null;

  function dismiss() {
    setOpen(false);
    // Show the bell trigger so the user can re-open without waiting
    // for the auto-timer again on this page.
    setTriggerVisible(true);
  }

  function openManually() {
    setOpen(true);
    setTriggerVisible(false);
  }

  return (
    <>
      {/* Small trigger pill — shows after the popup is dismissed so the
       *  user can re-open it without waiting. Matches YouTube's small
       *  floating notification badges. */}
      {triggerVisible && !open && (
        <button
          type="button"
          onClick={openManually}
          aria-label="Show suggestion"
          className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--yt-surface)] shadow-[0_4px_12px_rgba(0,0,0,0.18)] ring-1 ring-[color:var(--yt-border)] hover:bg-[color:var(--yt-hover)] transition-colors"
        >
          <Bell className="h-6 w-6 text-[color:var(--yt-text)]" />
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--yt-brand)] text-[10px] font-semibold text-white ring-2 ring-white">
            1
          </span>
        </button>
      )}

      {/* Main popup — YouTube "new video" card style. */}
      {open && (
        <>
          {/* Subtle backdrop scrim — click anywhere to dismiss, like
              YouTube's modal toasts. Pointer events only on the scrim. */}
          <button
            type="button"
            aria-label="Dismiss popup"
            onClick={dismiss}
            className="fixed inset-0 z-40 bg-black/20 animate-[yt-fade-in_200ms_ease-out] cursor-default"
          />

          <div
            role="dialog"
            aria-label="Make Your Own"
            className="fixed bottom-20 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl bg-[color:var(--yt-surface)] shadow-[0_10px_32px_rgba(0,0,0,0.28)] ring-1 ring-[color:var(--yt-border)] animate-[yt-slide-up_260ms_cubic-bezier(0.22,1,0.36,1)]"
          >
            {/* 16:9 banner — like a YouTube channel hero */}
            <div className="relative aspect-video w-full overflow-hidden bg-black">
              {/* Gradient backdrop */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-500 to-sky-500" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,0,0,0.3),transparent_55%)]" />

              {/* Centered channel initial — like a YouTube channel hero */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 text-2xl font-semibold text-white backdrop-blur-sm">
                  V
                </div>
              </div>

              {/* "New" pill top-left */}
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                <Sparkles className="h-3 w-3" />
                New
              </span>

              {/* Close button top-right — YouTube's circular icon button */}
              <button
                type="button"
                onClick={dismiss}
                aria-label="Close"
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body — YouTube channel card metadata layout */}
            <div className="flex gap-3 p-3">
              {/* Channel avatar */}
              <div className="shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-sky-500 text-sm font-semibold text-white ring-1 ring-[color:var(--yt-border)]">
                  V
                </div>
              </div>

              {/* Metadata column */}
              <div className="min-w-0 flex-1">
                {/* Title — two-line clamp like YouTube */}
                <h3 className="text-[14px] font-medium leading-[1.25] text-[color:var(--yt-text)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
                  Create your own AI content on voyle
                </h3>

                {/* Channel row with verified check */}
                <div className="mt-1 flex items-center gap-1 text-[12px] text-[color:var(--yt-text-secondary)]">
                  <span className="truncate">voyle</span>
                  <BadgeCheck className="h-3.5 w-3.5 shrink-0 fill-[color:var(--yt-text-secondary)] text-white" />
                </div>

                {/* Subscribers · content count */}
                <p className="text-[12px] text-[color:var(--yt-text-secondary)]">
                  1.2K subscribers · 48 creations
                </p>

                {/* CTA row — red Subscribe pill + "Not now" text link */}
                <div className="mt-3 flex items-center gap-3">
                  <Link
                    href="/channel"
                    onClick={dismiss}
                    className="inline-flex h-9 items-center justify-center rounded-full bg-[color:var(--yt-brand)] px-4 text-[13px] font-medium text-white hover:bg-[color:var(--yt-brand-hover)] transition-colors"
                  >
                    Go to channel
                  </Link>
                  <button
                    type="button"
                    onClick={dismiss}
                    className="text-[13px] font-medium text-[color:var(--yt-blue)] hover:underline"
                  >
                    Not now
                  </button>
                </div>
              </div>
            </div>

            {/* Footer — "Promoted" label like YouTube's sponsored strip */}
            <div className="flex items-center justify-between border-t border-[color:var(--yt-border)] px-3 py-1.5">
              <span className="text-[11px] text-[color:var(--yt-text-secondary)]">
                Promoted
              </span>
              <span className="text-[11px] text-[color:var(--yt-text-secondary)]">
                ·
              </span>
            </div>
          </div>
        </>
      )}

      {/* Keyframes for the slide-up + fade animations. */}
      <style jsx global>{`
        @keyframes yt-slide-up {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes yt-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}