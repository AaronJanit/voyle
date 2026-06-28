// Voyle — media scanner
// Recursively scans the /media folder and classifies files by type.

import { readdirSync, statSync } from "node:fs";
import { join, relative, extname, basename } from "node:path";

export type MediaType = "photo" | "gif" | "video";

export interface MediaItem {
  id: string;
  name: string;
  path: string; // relative path from /media, used as URL path
  type: MediaType;
  size: number;
  isGenerated: boolean; // true if AI-generated (filename starts with "gen-")
}

const PHOTO_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".bmp", ".tiff"];
const GIF_EXTS = [".gif"];
const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"];

/** Returns the MediaType for a given lowercase extension, or null if unsupported. */
export function classifyExtension(ext: string): MediaType | null {
  if (PHOTO_EXTS.includes(ext)) return "photo";
  if (GIF_EXTS.includes(ext)) return "gif";
  if (VIDEO_EXTS.includes(ext)) return "video";
  return null;
}

function classifyType(ext: string): MediaType | null {
  return classifyExtension(ext.toLowerCase());
}

function scanDir(dir: string, baseDir: string): MediaItem[] {
  const items: MediaItem[] = [];

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    let stats;
    try {
      stats = statSync(fullPath);
    } catch {
      continue;
    }

    if (stats.isDirectory()) {
      items.push(...scanDir(fullPath, baseDir));
    } else if (stats.isFile()) {
      const ext = extname(entry);
      const type = classifyType(ext);
      if (!type) continue;

      const relPath = relative(baseDir, fullPath).replace(/\\/g, "/");
      items.push({
        id: relPath,
        name: basename(entry),
        path: relPath,
        type,
        size: stats.size,
        isGenerated: basename(entry).startsWith("gen-"),
      });
    }
  }

  return items;
}

let cached: MediaItem[] | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5000; // 5 seconds

/** Scan the /media directory and return all supported media items.
 *  AI-generated images (filenames starting with "gen-") are excluded
 *  so they don't appear on the home screen. */
export function scanMediaDir(): MediaItem[] {
  const now = Date.now();
  if (cached && now - cacheTime < CACHE_TTL_MS) {
    return cached;
  }

  const mediaDir = join(process.cwd(), "media");
  cached = scanDir(mediaDir, mediaDir)
    .filter((item) => !item.isGenerated)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  cacheTime = now;
  return cached;
}