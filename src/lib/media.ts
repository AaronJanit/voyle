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
}

const PHOTO_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".bmp", ".tiff"];
const GIF_EXTS = [".gif"];
const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"];

function classifyType(ext: string): MediaType | null {
  const lower = ext.toLowerCase();
  if (PHOTO_EXTS.includes(lower)) return "photo";
  if (GIF_EXTS.includes(lower)) return "gif";
  if (VIDEO_EXTS.includes(lower)) return "video";
  return null;
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
      });
    }
  }

  return items;
}

let cached: MediaItem[] | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5000; // 5 seconds

/** Scan the /media directory and return all supported media items. */
export function scanMediaDir(): MediaItem[] {
  const now = Date.now();
  if (cached && now - cacheTime < CACHE_TTL_MS) {
    return cached;
  }

  const mediaDir = join(process.cwd(), "media");
  cached = scanDir(mediaDir, mediaDir).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true })
  );
  cacheTime = now;
  return cached;
}