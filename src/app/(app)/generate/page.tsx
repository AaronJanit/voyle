"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { X, Sparkles, ImagePlus, Loader2, Wand2, Lightbulb } from "lucide-react";

interface GeneratedImage {
  image: string;
  prompt: string;
  mode: string;
}

const SUGGESTIONS = [
  { label: "Neon city at night", prompt: "a neon city at night in the rain" },
  { label: "Cozy cabin", prompt: "a cozy cabin in a snowy forest" },
  { label: "Space whale", prompt: "an astronaut riding a whale through space" },
  { label: "Parisian café", prompt: "a vintage film photo of a parisian café" },
  { label: "Flower dragon", prompt: "a dragon made of flowers" },
  { label: "Cyberpunk street", prompt: "a cyberpunk street market in tokyo" },
];

/* /generate — YouTube-styled AI image studio.
 *
 * Layout matches the rest of the site: same chip rail pattern, same
 * 16:9 card grid, same color tokens. The composer is a single focused
 * bar with the image-upload affordance tucked into an icon button so
 * the page reads like YouTube first and only reveals its purpose on
 * interaction. */
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

  async function handleGenerate(e?: React.FormEvent) {
    e?.preventDefault();
    const value = prompt.trim();
    if (!value || loading) return;

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
        formData.append("prompt", value);
        formData.append("image", file);

        res = await fetch("/api/generate", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: value }),
        });
      }

      const data = await res.json();

      if (res.ok) {
        setGallery((prev) => [
          {
            image: data.image,
            prompt: value,
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
    <div className="px-4 sm:px-6 py-6 max-w-[1600px] mx-auto">
      {/* Hero strip */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shrink-0 shadow-sm">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold leading-tight">Create with AI</h1>
          <p className="text-sm text-[color:var(--yt-text-secondary)]">
            Describe anything, get a picture. 100,000 free generations per day.
          </p>
        </div>
      </div>

      {/* Composer — single focused row */}
      <form
        onSubmit={handleGenerate}
        className="flex flex-col gap-3 mb-8"
      >
        {/* Reference image preview row */}
        {uploadedImage && (
          <div className="flex items-center gap-2">
            <div className="relative inline-block">
              <img
                src={uploadedImage}
                alt="Reference image"
                className="h-14 w-14 rounded-lg object-cover border border-[color:var(--yt-border)]"
              />
              <button
                type="button"
                onClick={clearUploadedImage}
                className="absolute -top-1.5 -right-1.5 bg-white border border-[color:var(--yt-border)] rounded-full w-5 h-5 flex items-center justify-center text-[color:var(--yt-text-secondary)] hover:text-[color:var(--yt-text)] shadow-sm"
                aria-label="Remove reference image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="text-xs text-[color:var(--yt-text-secondary)] truncate max-w-[300px]">
              <span className="font-medium text-[color:var(--yt-text)]">
                Reference image
              </span>
              {" — "}
              {uploadedFileName}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 w-full">
          {/* Reference image button (left) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            title={uploadedImage ? "Change reference image" : "Add reference image"}
            aria-label="Add reference image"
            className="yt-btn-icon disabled:opacity-40"
          >
            <ImagePlus className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Prompt bar */}
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              uploadedImage
                ? "Describe how to transform the image…"
                : "Describe anything you can imagine…"
            }
            autoFocus
            disabled={loading}
            className="flex-1 h-10 px-4 border border-[color:var(--yt-border)] rounded-full bg-white text-sm focus:outline-none focus:border-[color:var(--yt-blue)] focus:ring-1 focus:ring-[color:var(--yt-blue)] transition-all placeholder:text-[color:var(--yt-text-secondary)]"
          />

          {/* Generate button */}
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="h-10 px-5 bg-[color:var(--yt-text)] text-white rounded-full text-sm font-medium hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate
              </>
            )}
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </form>

      {/* Suggestion chips — only when gallery is empty */}
      {!loading && gallery.length === 0 && (
        <div className="mb-10">
          <h3 className="text-xs font-semibold text-[color:var(--yt-text-secondary)] uppercase tracking-wide mb-3 flex items-center gap-2">
            <Lightbulb className="w-3.5 h-3.5" />
            Try one of these
          </h3>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.prompt}
                type="button"
                onClick={() => setPrompt(s.prompt)}
                className="yt-chip"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading skeleton card */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 mb-10">
          <div className="space-y-3">
            <div className="aspect-video rounded-xl bg-[color:var(--yt-chip)] animate-pulse flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-[color:var(--yt-text-secondary)] animate-spin" />
            </div>
            <div className="h-3 bg-[color:var(--yt-chip)] rounded animate-pulse w-3/4" />
            <div className="h-3 bg-[color:var(--yt-chip)] rounded animate-pulse w-1/4" />
          </div>
        </div>
      )}

      {/* Gallery section — YouTube-style card grid */}
      {(gallery.length > 0 || loading) && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[color:var(--yt-text)]">
              Your generations
              <span className="ml-2 text-[color:var(--yt-text-secondary)] font-normal">
                ({gallery.length})
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {gallery.map((img, i) => (
              <article key={i} className="group animate-yt-fade-up">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-[color:var(--yt-chip)] ring-1 ring-[color:var(--yt-border)]">
                  <img
                    src={img.image}
                    alt={img.prompt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  {/* Mode badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-medium uppercase tracking-wide backdrop-blur-sm">
                    {img.mode === "img2img" ? "img → img" : "text → img"}
                  </div>
                </div>
                <h3 className="text-sm font-medium mt-3 line-clamp-2 leading-snug">
                  {img.prompt}
                </h3>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-[color:var(--yt-text-secondary)]">
                  <Sparkles className="w-3 h-3" />
                  <span>AI generated · this session</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Footer note (only when nothing has been generated yet) */}
      {!loading && gallery.length === 0 && (
        <div className="text-center text-xs text-[color:var(--yt-text-secondary)] mt-12">
          Generated images stay in this session — they don&apos;t get saved to the
          catalog.
          <br />
          Powered by Stable Diffusion on Cloudflare Workers AI.
        </div>
      )}
    </div>
  );
}