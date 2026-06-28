"use client";

import { MediaItem } from "@/lib/media";
import { useState, useEffect, useCallback, useRef } from "react";
import { ImageIcon, Play, Upload } from "lucide-react";
import Lightbox from "./Lightbox";

export default function MediaGrid({ items }: { items: MediaItem[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const next = useCallback(
    () => setLightboxIndex((i) => (i === null ? i : (i + 1) % items.length)),
    [items.length]
  );
  const prev = useCallback(
    () =>
      setLightboxIndex((i) =>
        i === null ? i : (i - 1 + items.length) % items.length
      ),
    [items.length]
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, closeLightbox, next, prev]);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setUploading(true);
      setUploadMsg(null);

      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      try {
        const res = await fetch("/api/media", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          setUploadMsg(`Upload failed: ${data.error ?? "unknown error"}`);
        } else {
          const savedCount = data.saved?.length ?? 0;
          const errorCount = data.errors?.length ?? 0;
          if (savedCount > 0 && errorCount === 0) {
            setUploadMsg(`Uploaded ${savedCount} file${savedCount > 1 ? "s" : ""}`);
          } else if (savedCount > 0 && errorCount > 0) {
            setUploadMsg(
              `Uploaded ${savedCount}, ${errorCount} failed`
            );
          } else {
            setUploadMsg(
              data.errors?.map((er: { name: string; error: string }) => er.error).join(", ") ??
                "No files uploaded"
            );
          }
          // Reload to show new media
          window.location.reload();
        }
      } catch (err) {
        setUploadMsg(`Upload failed: ${err instanceof Error ? err.message : "network error"}`);
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    []
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-[#5f6368]">
        <ImageIcon className="w-16 h-16 mb-4 text-[#dadce0]" />
        <p className="text-base mb-1">No photos yet</p>
        <p className="text-sm mb-6 text-[#80868b]">
          Drop photos, gifs, and videos into the{" "}
          <code className="text-[#5f6368] bg-[#f1f3f4] px-1.5 py-0.5 rounded text-sm">
            /media
          </code>{" "}
          folder, or upload below
        </p>
        <UploadButton
          uploading={uploading}
          fileInputRef={fileInputRef}
          onUpload={handleUpload}
        />
        {uploadMsg && (
          <p className="mt-3 text-sm text-[#5f6368]">{uploadMsg}</p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <UploadButton
          uploading={uploading}
          fileInputRef={fileInputRef}
          onUpload={handleUpload}
        />
        {uploadMsg && (
          <p className="text-sm text-[#5f6368]">{uploadMsg}</p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => setLightboxIndex(i)}
            className="relative aspect-square overflow-hidden bg-[#f1f3f4] group focus:outline-none"
          >
            {item.type === "video" ? (
              <video
                src={`/api/media/file/${item.path}`}
                className="w-full h-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={`/api/media/file/${item.path}`}
                alt={item.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
            {item.type === "video" && (
              <div className="absolute bottom-1 right-1 bg-black/60 rounded-full w-7 h-7 flex items-center justify-center">
                <Play className="w-4 h-4 text-white fill-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          items={items}
          index={lightboxIndex}
          onClose={closeLightbox}
          onNext={next}
          onPrev={prev}
        />
      )}
    </>
  );
}

function UploadButton({
  uploading,
  fileInputRef,
  onUpload,
}: {
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.gif,.mp4,.webm,.mov,.avi,.mkv,.m4v"
        onChange={onUpload}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a73e8] hover:bg-[#1765cc] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        <Upload className="w-4 h-4" />
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </>
  );
}