"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading || !code || !email}
              className="px-6 py-2.5 bg-[#1a73e8] text-white rounded text-sm font-medium hover:bg-[#1765cc] hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}