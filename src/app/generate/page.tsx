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
      // Use multipart form data if an image was uploaded, otherwise JSON
      let res: Response;

      if (uploadedImage) {
        // Convert base64 data URL back to a File
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
        <form onSubmit={handleGenerate} className="space-y-4">
          {/* Image upload area */}
          <div>
            <label className="text-neutral-500 text-xs mb-2 block">
              reference image (optional — AI will use it as context)
            </label>
            {uploadedImage ? (
              <div className="relative inline-block">
                <img
                  src={uploadedImage}
                  alt="Upload preview"
                  className="max-h-32 rounded-lg border border-neutral-800"
                />
                <button
                  type="button"
                  onClick={clearUploadedImage}
                  className="absolute -top-2 -right-2 bg-neutral-800 border border-neutral-700 rounded-full w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full border-2 border-dashed border-neutral-800 rounded-lg py-6 px-4 text-neutral-600 text-sm hover:border-neutral-600 hover:text-neutral-400 transition-colors flex flex-col items-center gap-2 disabled:opacity-40"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>click to upload an image</span>
                <span className="text-xs text-neutral-700">jpg, png, gif · max 4MB</span>
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

          {/* Prompt input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={uploadedImage ? "describe how to transform the image..." : "describe anything..."}
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
            <p className="text-neutral-500 text-sm">
              {uploadedImage ? "transforming your image..." : "painting your image..."}
            </p>
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
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-neutral-700 text-[10px] uppercase tracking-wide">
                      {img.mode === "img2img" ? "img → img" : "text → img"}
                    </span>
                  </div>
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