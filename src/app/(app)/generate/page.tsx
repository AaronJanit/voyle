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
      <section className="border-b border-[#e0e0e0] bg-[#f8f9fa]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-normal text-[#202124] tracking-tight mb-3">
            Create with AI
          </h1>
          <p className="text-[#5f6368] text-base mb-1">
            Type anything. Get a picture. No limits.
          </p>
          <p className="text-[#80868b] text-sm">
            powered by Stable Diffusion XL
          </p>
        </div>
      </section>

      {/* Generator */}
      <section className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-8">
        <form onSubmit={handleGenerate} className="space-y-4">
          {/* Image upload area */}
          <div>
            <label className="text-[#5f6368] text-xs mb-2 block">
              reference image (optional — AI will use it as context)
            </label>
            {uploadedImage ? (
              <div className="relative inline-block">
                <img
                  src={uploadedImage}
                  alt="Upload preview"
                  className="max-h-32 rounded-lg border border-[#dadce0]"
                />
                <button
                  type="button"
                  onClick={clearUploadedImage}
                  className="absolute -top-2 -right-2 bg-white border border-[#dadce0] rounded-full w-6 h-6 flex items-center justify-center text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] transition-colors shadow-sm"
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
                className="w-full border-2 border-dashed border-[#dadce0] rounded-lg py-6 px-4 text-[#5f6368] text-sm hover:border-[#1a73e8] hover:text-[#1a73e8] transition-colors flex flex-col items-center gap-2 disabled:opacity-40"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>click to upload an image</span>
                <span className="text-xs text-[#80868b]">jpg, png, gif · max 4MB</span>
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
              className="flex-1 px-4 py-3 bg-white border border-[#dadce0] rounded-lg text-[#202124] text-sm focus:outline-none focus:border-[#1a73e8] focus:border-2 transition-colors placeholder:text-[#80868b]"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-6 py-3 bg-[#1a73e8] text-white rounded-lg font-medium hover:bg-[#1765cc] hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm whitespace-nowrap"
            >
              {loading ? "generating..." : "generate"}
            </button>
          </div>

          {error && <p className="text-[#d93025] text-sm">{error}</p>}
        </form>

        {/* Suggestion chips */}
        {!loading && gallery.length === 0 && (
          <div className="mt-6">
            <p className="text-[#5f6368] text-xs mb-3">try one of these:</p>
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
                  className="px-3 py-1.5 bg-white border border-[#dadce0] rounded-full text-[#5f6368] text-xs hover:border-[#1a73e8] hover:text-[#1a73e8] transition-colors"
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
          <div className="bg-[#f8f9fa] border border-[#e0e0e0] rounded-2xl p-12 flex flex-col items-center gap-4">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#1a73e8] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2.5 h-2.5 bg-[#1a73e8] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2.5 h-2.5 bg-[#1a73e8] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <p className="text-[#5f6368] text-sm">
              {uploadedImage ? "transforming your image..." : "painting your image..."}
            </p>
          </div>
        </div>
      )}

      {/* Gallery of generated images */}
      {gallery.length > 0 && (
        <section className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 pb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#5f6368] text-sm">
              {gallery.length} {gallery.length === 1 ? "image" : "images"} generated this session
            </h2>
            <Link
              href="/"
              className="text-[#1a73e8] hover:text-[#1765cc] text-sm font-medium transition-colors"
            >
              view full catalog →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {gallery.map((img) => (
              <div
                key={img.filename}
                className="rounded-lg overflow-hidden bg-white border border-[#e0e0e0] group relative shadow-sm hover:shadow-md transition-shadow"
              >
                <img
                  src={img.path}
                  alt={img.prompt}
                  className="w-full h-auto"
                />
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#80868b] text-[10px] uppercase tracking-wide">
                      {img.mode === "img2img" ? "img → img" : "text → img"}
                    </span>
                  </div>
                  <p className="text-[#5f6368] text-xs line-clamp-2">{img.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}