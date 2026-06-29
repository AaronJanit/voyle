"use client";

import { MediaItem } from "@/lib/media";
import { useState, useEffect, useCallback, useRef } from "react";
import { ImageIcon, Play, Upload, X } from "lucide-react";
import Lightbox from "./Lightbox";

export default function MediaGrid({ items }: { items: MediaItem[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pending files selected by the user, waiting for the title modal.
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
  const [title, setTitle] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

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

  // When files are selected, open the title modal instead of uploading
  // immediately.
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      const arr = Array.from(files);
      setPendingFiles(arr);
      // Pre-fill title with the first file's name (without extension).
      const first = arr[0];
      const dot = first.name.lastIndexOf(".");
      setTitle(dot > 0 ? first.name.slice(0, dot) : first.name);
      // Focus the title input after the modal renders.
      setTimeout(() => titleInputRef.current?.focus(), 50);
      // Reset the input so selecting the same file again still fires.
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    []
  );

  const cancelUpload = useCallback(() => {
    setPendingFiles(null);
    setTitle("");
  }, []);

  const confirmUpload = useCallback(async () => {
    if (!pendingFiles || pendingFiles.length === 0) return;

    setUploading(true);
    setUploadMsg(null);
    setPendingFiles(null);

    const formData = new FormData();
    for (const file of pendingFiles) {
      formData.append("files", file);
    }
    if (title.trim()) {
      formData.append("title", title.trim());
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
      setTitle("");
    }
  }, [pendingFiles, title]);

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
          onFileSelect={handleFileSelect}
        />
        {uploadMsg && (
          <p className="mt-3 text-sm text-[#5f6368]">{uploadMsg}</p>
        )}
        {pendingFiles && (
          <TitleModal
            files={pendingFiles}
            title={title}
            setTitle={setTitle}
            titleInputRef={titleInputRef}
            uploading={uploading}
            onConfirm={confirmUpload}
            onCancel={cancelUpload}
          />
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
          onFileSelect={handleFileSelect}
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
            ) : item.type === "audio" ? (
              <div className="w-full h-full bg-[#e8eaed] flex items-center justify-center">
                <svg className="w-10 h-10 text-[#5f6368]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                </svg>
              </div>
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
            {(item.type === "video" || item.type === "audio") && (
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

      {pendingFiles && (
        <TitleModal
          files={pendingFiles}
          title={title}
          setTitle={setTitle}
          titleInputRef={titleInputRef}
          uploading={uploading}
          onConfirm={confirmUpload}
          onCancel={cancelUpload}
        />
      )}
    </>
  );
}

function TitleModal({
  files,
  title,
  setTitle,
  titleInputRef,
  uploading,
  onConfirm,
  onCancel,
}: {
  files: File[];
  title: string;
  setTitle: (s: string) => void;
  titleInputRef: React.RefObject<HTMLInputElement | null>;
  uploading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
      }
    },
    [onConfirm]
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-[#202124]">
            {files.length > 1
              ? `Upload ${files.length} files`
              : "Upload file"}
          </h2>
          <button
            onClick={onCancel}
            className="text-[#5f6368] hover:bg-[#f1f3f4] rounded-full p-1.5 transition-colors"
            aria-label="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File list preview */}
        <div className="mb-4 max-h-32 overflow-y-auto space-y-1">
          {files.slice(0, 5).map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm text-[#5f6368] truncate"
            >
              <span className="truncate">{f.name}</span>
              <span className="text-[#80868b] text-xs shrink-0">
                {(f.size / 1024 / 1024).toFixed(1)} MB
              </span>
            </div>
          ))}
          {files.length > 5 && (
            <p className="text-xs text-[#80868b]">
              +{files.length - 5} more…
            </p>
          )}
        </div>

        <label className="block text-sm font-medium text-[#202124] mb-1.5">
          Title
        </label>
        <p className="text-xs text-[#80868b] mb-3">
          What should this {files.length > 1 ? "be" : "file"} be called on the site?
        </p>
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a title…"
          className="w-full px-3 py-2.5 border border-[#dadce0] rounded-lg text-sm text-[#202124] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] mb-5"
        />

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={uploading}
            className="px-4 py-2 rounded-full text-sm font-medium text-[#1a73e8] hover:bg-[#f1f3f4] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#1a73e8] hover:bg-[#1765cc] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UploadButton({
  uploading,
  fileInputRef,
  onFileSelect,
}: {
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.gif,.mp4,.webm,.mov,.avi,.mkv,.m4v,.mp3,.wav,.ogg,.m4a,.flac,.aac"
        onChange={onFileSelect}
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