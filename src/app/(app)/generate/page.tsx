"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface GeneratedImage {
  path: string;
  filename: string;
  prompt: string;
  mode: string;
}

/* /generate — YouTube-style "Create with AI" page.
 *
 * Header is a YouTube chip row instead of a hero panel. The prompt bar
 * matches the topbar search input but is wider. The gallery renders
 * 16:9 thumbnails identical to the home grid. */
export default function GenerateContent() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setError("Image too large (max 4MB)");
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
      setUploadedFileName(file.name);
    };
    reader.readAsDataURL(file);
  }

  function clearUploadedImage() {
    setUploadedImage(null);
    setUploadedFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setError("");
    setLoading(true);

    try {
      let res: Response;

      if (uploadedImage) {
        const response = await fetch(uploadedImage);
        const blob = await response.blob();
        const file = new File([blob], uploadedFileName || "upload.jpg", {
          type: blob.type,
        });

        const formData = new FormData();
        formData.append("prompt", prompt);
        formData.append("image", file);

        res = await fetch("/api/generate", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
      }

      const data = await res.json();

      if (res.ok) {
        setGallery((prev) => [
          {
            path: data.path,
            filename: data.filename,
            prompt,
            mode: data.mode || "text2img",
          },
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
    <div className="px-4 sm:px-6 py-4 max-w-[1600px] mx-auto">
      {/* Compact title row */}
      <div className="flex items-end justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Create with AI</h1>
          <p className="text-sm text-[color:var(--yt-text-secondary)]">
            Type anything. Get a picture. No limits.
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-[color:var(--yt-blue)] hover:underline"
        >
          ← Back to home
        </Link>
      </div>

      {/* Composer */}
      <div className="space-y-3">
        <div>
          {uploadedImage ? (
            <div className="relative inline-block">
              <img
                src={uploadedImage}
                alt="Upload preview"
                className="max-h-28 rounded-lg border border-[color:var(--yt-border)]"
              />
              <button
                type="button"
                onClick={clearUploadedImage}
                className="absolute -top-2 -right-2 bg-white border border-[color:var(--yt-border)] rounded-full w-6 h-6 flex items-center justify-center text-[color:var(--yt-text-secondary)] hover:text-[color:var(--yt-text)] transition-colors shadow-sm"
                aria-label="Remove uploaded image"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="text-sm text-[color:var(--yt-blue)] hover:underline disabled:opacity-50"
            >
              + add a reference image
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <form onSubmit={handleGenerate} className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              uploadedImage
                ? "Describe how to transform the image…"
                : "Describe anything…"
            }
            autoFocus
            disabled={loading}
            className="flex-1 h-10 px-4 border border-[color:var(--yt-border)] rounded-full bg-[color:var(--yt-surface)] text-sm focus:outline-none focus:border-[color:var(--yt-blue)] placeholder:text-[color:var(--yt-text-secondary)]"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="h-10 px-5 bg-[color:var(--yt-blue)] text-white rounded-full text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Generating…" : "Generate"}
          </button>
        </form>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Suggestion chips */}
        {!loading && gallery.length === 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
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
                className="yt-chip"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="mt-8 bg-[color:var(--yt-surface)] border border-[color:var(--yt-border)] rounded-2xl p-12 flex flex-col items-center gap-4">
          <div className="flex gap-1.5">
            <span
              className="w-2.5 h-2.5 bg-[color:var(--yt-blue)] rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-2.5 h-2.5 bg-[color:var(--yt-blue)] rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-2.5 h-2.5 bg-[color:var(--yt-blue)] rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
          <p className="text-sm text-[color:var(--yt-text-secondary)]">
            {uploadedImage ? "Transforming your image…" : "Painting your image…"}
          </p>
        </div>
      )}

      {/* Gallery of generated images (YouTube card grid) */}
      {gallery.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm text-[color:var(--yt-text-secondary)] mb-4">
            {gallery.length}{" "}
            {gallery.length === 1 ? "image" : "images"} generated this session
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {gallery.map((img) => (
              <article key={img.filename} className="group">
                <Link
                  href={`/p/${encodeURIComponent(img.filename)}`}
                  className="block aspect-video rounded-xl overflow-hidden bg-[color:var(--yt-chip)]"
                >
                  <img
                    src={img.path}
                    alt={img.prompt}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                  />
                </Link>
                <h3 className="text-sm font-medium mt-3 line-clamp-2">
                  {img.prompt}
                </h3>
                <p className="text-xs text-[color:var(--yt-text-secondary)] mt-1">
                  {img.mode === "img2img" ? "img → img" : "text → img"}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}