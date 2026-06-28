"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ViewState = "form" | "loading" | "unplugged";

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

      setView("unplugged");
    } catch {
      setView("unplugged");
    }
  }

  // --- Loading ------------------------------------------------------
  if (view === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] px-4">
        <div className="w-10 h-10 border-[3px] border-[var(--border-strong)] border-t-[var(--tint)] rounded-full animate-spin" />
        <p className="mt-6 ios-callout">Signing you in…</p>
      </div>
    );
  }

  // --- Unplugged ---------------------------------------------------
  if (view === "unplugged") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4 text-center">
        <div className="mb-6 text-6xl">🔌</div>
        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
          Unplugged Site
        </h1>
        <p className="ios-callout text-[var(--fg-faint)] max-w-xs">
          This site has been disconnected. Please contact the administrator.
        </p>
      </div>
    );
  }

  // --- Login form --------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      {/* Top: brand + status bar spacer */}
      <div className="pt-12 px-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#0a84ff] via-[#5e5ce6] to-[#bf5af2] flex items-center justify-center shadow-sm">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 3l8 14h-3.2L15 14H9l-1.8 3H4z" />
            </svg>
          </div>
          <span className="ios-headline">voyle</span>
        </div>
        <span className="ios-footnote">v2.0 · iOS-style</span>
      </div>

      {/* Main — iOS-style settings list */}
      <div className="flex-1 flex flex-col px-5 pt-8">
        <div className="mb-8 ios-slide-up">
          <h1 className="ios-large-title mb-1">Sign in</h1>
          <p className="ios-callout">
            to continue to your library.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 ios-slide-up"
          style={{ animationDelay: "60ms" }}
        >
          {/* iOS Inset Grouped form fields */}
          <div className="ios-card overflow-hidden">
            <div className="px-4 py-3">
              <label className="ios-caption block mb-1 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                inputMode="email"
                className="w-full bg-transparent text-[17px] outline-none text-[var(--fg)] placeholder:text-[var(--fg-faint)]"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="ios-hairline" />
            <div className="px-4 py-3">
              <label className="ios-caption block mb-1 uppercase tracking-wider">
                Passcode
              </label>
              <input
                type="password"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-transparent text-[17px] outline-none text-[var(--fg)] placeholder:text-[var(--fg-faint)] tracking-widest"
                placeholder="••••"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-[var(--danger)] text-[15px] text-center ios-spring-in">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!code || !email}
            className="ios-btn-primary w-full mt-2"
          >
            Sign in
          </button>

          <button
            type="button"
            onClick={() => {
              setEmail("");
              setCode("");
              setError("");
            }}
            className="ios-btn-secondary w-full"
          >
            Reset
          </button>
        </form>

        <div className="mt-auto pt-10 pb-8 text-center">
          <p className="ios-footnote">
            By signing in you agree to our (fictional) Terms.
          </p>
        </div>
      </div>
    </div>
  );
}