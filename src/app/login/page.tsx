"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ViewState = "form" | "loading" | "unplugged";

/* Login page — YouTube-style.
 *
 * A red play-button logo sits above a centered form with two floating-label
 * inputs. The Sign-in button matches YouTube's flat, blue (we keep the
 * blue for "Sign in" — it's a known signal — but use the YouTube blue
 * `#065fd4` and the YouTube red logo). On a failed login we show the
 * "unplugged" state which the proxy has already activated behind the
 * scenes. */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [view, setView] = useState<ViewState>("form");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setView("loading");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
        return;
      }

      // Any failed login → the site is taken down behind the scenes.
      setView("unplugged");
    } catch {
      setView("unplugged");
    }
  }

  // --- Full-page spinner (shown during every login attempt) ------------
  if (view === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[color:var(--yt-bg)] px-4">
        <div className="w-10 h-10 border-4 border-[color:var(--yt-border)] border-t-[color:var(--yt-blue)] rounded-full animate-spin" />
        <p className="mt-6 text-sm text-[color:var(--yt-text-secondary)]">
          Signing you in…
        </p>
      </div>
    );
  }

  // --- Unplugged Site screen (shown when login fails) -------------------
  if (view === "unplugged") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 px-4 text-center">
        <div className="mb-6 text-5xl">🔌</div>
        <h1 className="text-3xl font-semibold text-neutral-200 mb-2">
          Unplugged Site
        </h1>
        <p className="text-sm text-neutral-500 max-w-xs">
          This site has been disconnected. Please contact the administrator.
        </p>
      </div>
    );
  }

  // --- Login form -------------------------------------------------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--yt-bg)] px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          {/* Red play-button logo — same glyph as the NavBar / favicon */}
          <svg viewBox="0 0 24 24" className="w-14 h-14 mb-4" aria-hidden>
            <path
              d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8Z"
              fill="var(--yt-brand)"
            />
            <path d="M10 15l5-3-5-3z" fill="#fff" />
          </svg>
          <h1 className="text-2xl font-normal text-[color:var(--yt-text)] mb-1">
            Sign in
          </h1>
          <p className="text-sm text-[color:var(--yt-text-secondary)] text-center">
            to continue to voyle
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
              autoComplete="email"
              autoFocus
              className="peer w-full px-3.5 pt-4 pb-2 bg-transparent border border-[color:var(--yt-border)] rounded text-[color:var(--yt-text)] text-sm focus:outline-none focus:border-[color:var(--yt-blue)] focus:border-2 transition-colors placeholder:text-transparent"
              required
            />
            <label className="absolute left-3 top-3.5 text-[color:var(--yt-text-secondary)] text-sm transition-all peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[color:var(--yt-blue)] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-xs">
              Email
            </label>
          </div>

          <div className="relative">
            <input
              type="password"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder=" "
              className="peer w-full px-3.5 pt-4 pb-2 bg-transparent border border-[color:var(--yt-border)] rounded text-[color:var(--yt-text)] text-sm focus:outline-none focus:border-[color:var(--yt-blue)] focus:border-2 transition-colors placeholder:text-transparent"
              required
            />
            <label className="absolute left-3 top-3.5 text-[color:var(--yt-text-secondary)] text-sm transition-all peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[color:var(--yt-blue)] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-xs">
              Passcode
            </label>
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!code || !email}
              className="px-6 py-2 bg-[color:var(--yt-blue)] text-white rounded-full text-sm font-medium hover:opacity-90 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}