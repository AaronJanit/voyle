"use client";

import { useState } from "react";
import Link from "next/link";

interface GeneratedImage {
  path: string;
  filename: string;
  prompt: string;
}

export default function GenerateContent() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (res.ok) {
        setGallery((prev) => [
          { path: data.path, filename: data.filename, prompt },
          ...prev,
        ]);
        setPrompt("");
      } else {
        setError(data.error || "Generation failed");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero section */}
      <section className="border-b border-neutral-900 bg-gradient-to-b from-neutral-900/50 to-neutral-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight mb-4">
            Unlimited AI Image!
          </h1>
          <p className="text-neutral-400 text-lg mb-2">
            Type anything. Get a picture. No limits.
          </p>
          <p className="text-neutral-600 text-sm">
            powered by Stable Diffusion XL · 100,000 generations per day
          </p>
        </div>
      </section>

      {/* Generator */}
      <section className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-8">
        <form onSubmit={handleGenerate} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="describe anything..."
              autoFocus
              disabled={loading}
              className="flex-1 px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white text-sm focus:outline-none focus:border-neutral-600 transition-colors placeholder:text-neutral-600"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm whitespace-nowrap"
            >
              {loading ? "generating..." : "generate"}
            </button>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </form>

        {/* Suggestion chips */}
        {!loading && gallery.length === 0 && (
          <div className="mt-6">
            <p className="text-neutral-600 text-xs mb-3">try one of these:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "a neon city at night in the rain",
                "a cozy cabin in a snowy forest",
                "an astronaut riding a whale through space",
                "a vintage film photo of a parisian café",
                "a dragon made of flowers",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-full text-neutral-400 text-xs hover:border-neutral-600 hover:text-white transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Loading state */}
      {loading && (
        <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 pb-8">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 flex flex-col items-center gap-4">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2.5 h-2.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2.5 h-2.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <p className="text-neutral-500 text-sm">painting your image...</p>
          </div>
        </div>
      )}

      {/* Gallery of generated images */}
      {gallery.length > 0 && (
        <section className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 pb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-neutral-400 text-sm">
              {gallery.length} {gallery.length === 1 ? "image" : "images"} generated this session
            </h2>
            <Link
              href="/"
              className="text-neutral-400 hover:text-white text-sm transition-colors"
            >
              view full catalog →
            </Link>
          </div>

          <div className="columns-2 sm:columns-3 md:columns-4 gap-3 space-y-3">
            {gallery.map((img) => (
              <div
                key={img.filename}
                className="break-inside-avoid rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 group relative"
              >
                <img
                  src={img.path}
                  alt={img.prompt}
                  className="w-full h-auto"
                />
                <div className="p-3">
                  <p className="text-neutral-400 text-xs line-clamp-2">{img.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}