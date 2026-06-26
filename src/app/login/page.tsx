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

      // Any failed login → the site is taken down behind the scenes.
      // Show the "Unplugged Site" screen.
      setView("unplugged");
    } catch {
      setView("unplugged");
    }
  }

  // --- Full-page spinner (shown during every login attempt) --------------
  if (view === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <div className="w-10 h-10 border-4 border-[#dadce0] border-t-[#1a73e8] rounded-full animate-spin" />
        <p className="mt-6 text-[#5f6368] text-sm">Signing you in…</p>
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
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <svg className="w-12 h-12 mb-4" viewBox="0 0 24 24" fill="none">
            <path d="M12 3.5l2.5 4.5L12 12 9.5 8z" fill="#4285F4" />
            <path d="M12 3.5l4.5 2.5L12 12z" fill="#34A853" />
            <path d="M16.5 6L21 8.5 12 12z" fill="#FBBC04" />
            <path d="M21 8.5v5L12 12z" fill="#EA4335" />
            <path d="M21 13.5L16.5 18 12 12z" fill="#4285F4" />
            <path d="M16.5 18L12 20.5 12 12z" fill="#34A853" />
            <path d="M12 20.5L7.5 18 12 12z" fill="#FBBC04" />
            <path d="M7.5 18L3 13.5 12 12z" fill="#EA4335" />
            <path d="M3 13.5v-5L12 12z" fill="#4285F4" />
            <path d="M3 8.5L7.5 6 12 12z" fill="#34A853" />
            <path d="M7.5 6L12 3.5 12 12z" fill="#FBBC04" />
          </svg>
          <h1 className="text-2xl font-normal text-[#202124] mb-1">
            Sign in
          </h1>
          <p className="text-[#5f6368] text-sm text-center">
            to continue to Photos
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
              className="peer w-full px-3.5 pt-4 pb-2 bg-transparent border border-[#dadce0] rounded text-[#202124] text-sm focus:outline-none focus:border-[#1a73e8] focus:border-2 transition-colors placeholder:text-transparent"
              required
            />
            <label className="absolute left-3 top-3.5 text-[#5f6368] text-sm transition-all peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#1a73e8] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-xs">
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
              className="peer w-full px-3.5 pt-4 pb-2 bg-transparent border border-[#dadce0] rounded text-[#202124] text-sm focus:outline-none focus:border-[#1a73e8] focus:border-2 transition-colors placeholder:text-transparent"
              required
            />
            <label className="absolute left-3 top-3.5 text-[#5f6368] text-sm transition-all peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#1a73e8] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-xs">
              Passcode
            </label>
          </div>

          {error && (
            <p className="text-[#d93025] text-sm text-center">{error}</p>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!code || !email}
              className="px-6 py-2.5 bg-[#1a73e8] text-white rounded text-sm font-medium hover:bg-[#1765cc] hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}