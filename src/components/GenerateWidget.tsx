"use client";

import { useState } from "react";

export default function GenerateWidget() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ path: string; filename: string } | null>(null);
  const [error, setError] = useState("");

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ path: data.path, filename: data.filename });
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
    <>
      {/* Generate button in nav */}
      <button
        onClick={() => setOpen(true)}
        className="text-neutral-400 hover:text-white text-sm transition-colors flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        generate
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">generate an image</h2>
              <button
                onClick={() => !loading && setOpen(false)}
                className="text-neutral-500 hover:text-white transition-colors"
                disabled={loading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <p className="text-neutral-500 text-sm">
              describe an image and AI will generate it. it&apos;ll be saved to the catalog.
            </p>

            <form onSubmit={handleGenerate} className="space-y-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="a cute cat wearing a tiny hat..."
                rows={3}
                autoFocus
                disabled={loading}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-neutral-500 transition-colors resize-none placeholder:text-neutral-600"
              />

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="w-full py-2.5 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {loading ? "generating..." : "generate"}
              </button>
            </form>

            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-3">
                <div className="rounded-lg overflow-hidden border border-neutral-800">
                  <img
                    src={result.path}
                    alt="Generated image"
                    className="w-full h-auto"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 text-xs truncate">{result.filename}</span>
                  <button
                    onClick={() => {
                      setResult(null);
                      setOpen(false);
                      // Reload the page to show the new image in the catalog
                      window.location.reload();
                    }}
                    className="text-neutral-400 hover:text-white text-sm transition-colors"
                  >
                    view in catalog →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}