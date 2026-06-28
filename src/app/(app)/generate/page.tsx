"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface GeneratedImage {
  path: string;
  filename: string;
  prompt: string;
  mode: string;
}

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

  const suggestions = [
    "a neon city at night in the rain",
    "a cozy cabin in a snowy forest",
    "an astronaut riding a whale through space",
    "a vintage film photo of a parisian café",
    "a dragon made of flowers",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      {/* iOS-style sticky large-title nav */}
      <header className="sticky top-0 z-30 ios-glass">
        <div className="px-5 pt-3 pb-3 flex items-end justify-between">
          <div>
            <h1 className="ios-large-title leading-none">Create</h1>
            <p className="ios-subhead mt-1">Generate images with AI</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0a84ff] to-[#5e5ce6] flex items-center justify-center shadow-sm">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 pt-6 pb-24 md:pb-12">
        {/* Hero card */}
        <div className="ios-card p-6 mb-6 text-center">
          <div className="text-[15px] text-[var(--fg-muted)] mb-1">
            Stable Diffusion XL
          </div>
          <h2 className="ios-title">
            {uploadedImage ? "Transform your image" : "What should we make?"}
          </h2>
          <p className="ios-callout mt-1">
            {uploadedImage
              ? "Describe how you want to change it."
              : "Describe anything. No limits."}
          </p>
        </div>

        {/* Reference image picker — iOS list */}
        <div className="ios-card overflow-hidden mb-4">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="ios-caption uppercase tracking-wider mb-0.5">
                Reference
              </div>
              <div className="ios-headline">
                {uploadedImage ? uploadedFileName : "Optional image"}
              </div>
            </div>
            {uploadedImage ? (
              <button
                type="button"
                onClick={clearUploadedImage}
                className="w-8 h-8 rounded-full bg-[var(--bg)] flex items-center justify-center text-[var(--fg-muted)]"
                aria-label="Remove image"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.2}
                    d="M6 6l12 12M6 18L18 6"
                  />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="ios-btn-secondary !py-2 !px-4 !text-[14px]"
              >
                Add
              </button>
            )}
          </div>
          {uploadedImage && (
            <>
              <div className="ios-hairline" />
              <div className="p-3 bg-[var(--bg)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uploadedImage}
                  alt="Upload preview"
                  className="max-h-48 mx-auto rounded-[12px]"
                />
              </div>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Prompt + generate */}
        <form onSubmit={handleGenerate} className="space-y-3 mb-6">
          <div className="ios-card overflow-hidden">
            <div className="px-4 py-3">
              <div className="ios-caption uppercase tracking-wider mb-1">
                Prompt
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  uploadedImage
                    ? "make it cinematic…"
                    : "a cute cat wearing a tiny hat…"
                }
                autoFocus
                disabled={loading}
                rows={3}
                className="w-full bg-transparent text-[17px] outline-none resize-none text-[var(--fg)] placeholder:text-[var(--fg-faint)]"
              />
            </div>
          </div>

          {error && (
            <div className="ios-card p-3 text-[var(--danger)] text-[15px] text-center ios-spring-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="ios-btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="ios-dot-loader">
                  <span />
                  <span />
                  <span />
                </span>
                Generating…
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                Generate
              </>
            )}
          </button>
        </form>

        {/* Suggestions — iOS-style chips */}
        {!loading && gallery.length === 0 && (
          <div className="mb-2">
            <div className="ios-caption uppercase tracking-wider mb-2 px-1">
              Try one of these
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="px-3.5 py-1.5 bg-[var(--bg-elev)] border border-[var(--border)] rounded-full text-[var(--fg-muted)] text-[14px] hover:border-[var(--tint)] hover:text-[var(--tint)] active:scale-95 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 pb-24 md:pb-12">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="ios-title">This session</h2>
            <Link
              href="/"
              className="ios-btn-secondary !py-1.5 !px-3.5 !text-[13px]"
            >
              Open library
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {gallery.map((img) => (
              <div
                key={img.filename}
                className="ios-card overflow-hidden group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.path}
                  alt={img.prompt}
                  className="w-full aspect-square object-cover"
                />
                <div className="p-3">
                  <div className="ios-caption uppercase tracking-wider mb-1">
                    {img.mode === "img2img" ? "Image → Image" : "Text → Image"}
                  </div>
                  <p className="ios-subhead line-clamp-2">{img.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}