// Voyle — media library
// The Supabase `media` table is the source of truth for the media list.
// File bytes live in Cloudflare R2; this module queries the DB for
// metadata and builds MediaItem objects for the UI.
//
// The table has columns: file_path, type, size, storage_key, uploader_*,
// title, views, created_at. We cache results for 5 seconds to avoid
// hitting Supabase on every page load.

import { createClient } from "@supabase/supabase-js";
import { basename } from "node:path";
import { r2Url } from "@/lib/r2";

export type MediaType = "photo" | "gif" | "video" | "audio";

export interface MediaItem {
  id: string;
  name: string;
  path: string; // R2 object key (relative path)
  type: MediaType;
  size: number;
  isGenerated: boolean; // true if AI-generated (filename starts with "gen-")
  mtime: number; // created_at as ms since epoch
}

const PHOTO_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".bmp", ".tiff"];
const GIF_EXTS = [".gif"];
const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"];
const AUDIO_EXTS = [".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"];

/** Returns the MediaType for a given lowercase extension, or null if unsupported. */
export function classifyExtension(ext: string): MediaType | null {
  if (PHOTO_EXTS.includes(ext)) return "photo";
  if (GIF_EXTS.includes(ext)) return "gif";
  if (VIDEO_EXTS.includes(ext)) return "video";
  if (AUDIO_EXTS.includes(ext)) return "audio";
  return null;
}

/**
 * Build the public R2 URL for a media item path.
 * Use this everywhere a media URL is needed instead of /api/media/file/.
 */
export function mediaUrl(path: string): string {
  return r2Url(path);
}

// --- DB client -----------------------------------------------------------

function getReadClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// --- Row → MediaItem mapping --------------------------------------------

interface MediaRow {
  file_path: string;
  type: string;
  size: number;
  storage_key: string | null;
  created_at: string | null;
}

function rowToItem(row: MediaRow): MediaItem {
  const path = row.storage_key ?? row.file_path;
  const name = basename(row.file_path);
  return {
    id: row.file_path,
    name,
    path,
    type: (row.type as MediaType) ?? "photo",
    size: row.size ?? 0,
    isGenerated: name.startsWith("gen-"),
    mtime: row.created_at ? new Date(row.created_at).getTime() : 0,
  };
}

// --- Cached queries ------------------------------------------------------

let cached: MediaItem[] | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5000; // 5 seconds

/**
 * Query the `media` table for all non-audio, non-generated media items.
 * AI-generated images (filenames starting with "gen-") are excluded
 * so they don't appear on the home screen.
 */
export async function scanMediaDir(): Promise<MediaItem[]> {
  const now = Date.now();
  if (cached && now - cacheTime < CACHE_TTL_MS) {
    return cached;
  }

  const supabase = getReadClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("media")
      .select("file_path, type, size, storage_key, created_at")
      .in("type", ["photo", "gif", "video"])
      .order("file_path", { ascending: true });

    if (error) {
      console.error("scanMediaDir: Supabase error:", error.message);
      return cached ?? [];
    }

    const items = (data as MediaRow[])
      .map(rowToItem)
      .filter((item) => !item.isGenerated)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    cached = items;
    cacheTime = now;
    return items;
  } catch (e) {
    console.error("scanMediaDir: error:", e);
    return cached ?? [];
  }
}

let audioCached: MediaItem[] | null = null;
let audioCacheTime = 0;

/**
 * Query the `media` table for all audio items.
 * Has its own 5-second cache, separate from scanMediaDir().
 */
export async function scanAudioDir(): Promise<MediaItem[]> {
  const now = Date.now();
  if (audioCached && now - audioCacheTime < CACHE_TTL_MS) {
    return audioCached;
  }

  const supabase = getReadClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("media")
      .select("file_path, type, size, storage_key, created_at")
      .eq("type", "audio")
      .order("file_path", { ascending: true });

    if (error) {
      console.error("scanAudioDir: Supabase error:", error.message);
      return audioCached ?? [];
    }

    const items = (data as MediaRow[])
      .map(rowToItem)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    audioCached = items;
    audioCacheTime = now;
    return items;
  } catch (e) {
    console.error("scanAudioDir: error:", e);
    return audioCached ?? [];
  }
}