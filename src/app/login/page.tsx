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
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-bold text-center text-white mb-2 tracking-tight">
          voyle
        </h1>
        <p className="text-center text-neutral-500 mb-8 text-sm">
          sign in to enter
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
            autoComplete="email"
            autoFocus
            className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white text-sm focus:outline-none focus:border-neutral-600 transition-colors"
            disabled={loading}
            required
          />

          <input
            type="password"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="passcode"
            className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white text-center text-lg tracking-widest focus:outline-none focus:border-neutral-600 transition-colors"
            disabled={loading}
            required
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !code || !email}
            className="w-full py-3 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "entering..." : "enter"}
          </button>
        </form>
      </div>
    </div>
  );
}