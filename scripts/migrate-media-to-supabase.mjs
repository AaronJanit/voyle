#!/usr/bin/env node
/**
 * Voyle — Migrate committed /media files into Supabase Storage + `media` table.
 *
 * WHAT IT DOES
 * ------------
 * 1. Reads every file in the local /media folder (the ones committed to git).
 * 2. Uploads each file to the Supabase Storage bucket ("media" by default).
 *    - Skips files that already exist in the bucket (idempotent).
 * 3. Inserts a row into the Supabase `media` table with attribution metadata
 *    (file_path, type, size, storage_key, uploader_email, uploader_name).
 *    - Uses upsert so re-running won't duplicate rows.
 *
 * PREREQUISITES
 * -------------
 * - Create a **public** bucket named "media" in the Supabase Dashboard
 *   (Storage → New bucket → Public = true).
 * - Set these env vars before running:
 *     SUPABASE_URL              — e.g. https://xdfuvfxagyhgweqpfwai.supabase.co
 *     SUPABASE_SERVICE_ROLE_KEY — service-role key (bypasses RLS for inserts)
 *     SUPABASE_STORAGE_BUCKET   — (optional) defaults to "media"
 *
 * USAGE
 * -----
 *   node scripts/migrate-media-to-supabase.mjs
 *
 *   # If env vars aren't set in the shell, pass them inline:
 *   $env:SUPABASE_URL="https://..."; $env:SUPABASE_SERVICE_ROLE_KEY="..."; node scripts/migrate-media-to-supabase.mjs
 *
 * Idempotent: safe to run multiple times.
 */

import { readdir, stat } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MEDIA_DIR = join(__dirname, "..", "media");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "media";

// --- Type classification (mirrors src/lib/media.ts) ----------------------

const PHOTO_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".bmp", ".tiff"];
const GIF_EXTS = [".gif"];
const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"];
const AUDIO_EXTS = [".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"];

const MIME_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
  ".tiff": "image/tiff",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  ".m4v": "video/x-m4v",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".flac": "audio/flac",
  ".aac": "audio/aac",
};

function classifyType(ext) {
  if (PHOTO_EXTS.includes(ext)) return "photo";
  if (GIF_EXTS.includes(ext)) return "gif";
  if (VIDEO_EXTS.includes(ext)) return "video";
  if (AUDIO_EXTS.includes(ext)) return "audio";
  return null;
}

// --- Helpers --------------------------------------------------------------

function log(msg) {
  console.log(`[migrate-media] ${msg}`);
}
function warn(msg) {
  console.warn(`[migrate-media] WARNING: ${msg}`);
}
function error(msg) {
  console.error(`[migrate-media] ERROR: ${msg}`);
}

// --- Main -----------------------------------------------------------------

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    error("Missing env vars. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.");
    error("Example:");
    error('  $env:SUPABASE_URL="https://xdfuvfxagyhgweqpfwai.supabase.co"; $env:SUPABASE_SERVICE_ROLE_KEY="..."; node scripts/migrate-media-to-supabase.mjs');
    process.exit(1);
  }

  log(`Supabase URL: ${SUPABASE_URL}`);
  log(`Bucket:      ${BUCKET}`);
  log(`Media dir:   ${MEDIA_DIR}`);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Read all files in /media
  let files;
  try {
    files = await readdir(MEDIA_DIR);
  } catch (e) {
    error(`Could not read media directory: ${e.message}`);
    process.exit(1);
  }

  // Filter out non-media files (.gitkeep, etc.)
  const mediaFiles = [];
  for (const name of files) {
    if (name === ".gitkeep") continue;
    const fullPath = join(MEDIA_DIR, name);
    const s = await stat(fullPath);
    if (!s.isFile()) continue;
    const ext = extname(name).toLowerCase();
    const type = classifyType(ext);
    if (!type) {
      warn(`Skipping unsupported file type: ${name}`);
      continue;
    }
    mediaFiles.push({ name, fullPath, ext, type, size: s.size });
  }

  log(`Found ${mediaFiles.length} media file(s) to migrate.`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of mediaFiles) {
    const { name, fullPath, ext, type, size } = file;
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    // 1. Check if the object already exists in the bucket
    let existsInStorage = false;
    try {
      const { data, error: listError } = await supabase.storage
        .from(BUCKET)
        .list("", { search: name, limit: 100 });
      if (listError) {
        warn(`Could not check bucket for "${name}": ${listError.message}`);
      } else {
        existsInStorage = !!data?.find((obj) => obj.name === name);
      }
    } catch (e) {
      warn(`Exception checking bucket for "${name}": ${e.message}`);
    }

    // 2. Upload if not already present
    if (!existsInStorage) {
      log(`Uploading "${name}" (${type}, ${(size / 1024 / 1024).toFixed(1)} MB)...`);
      try {
        const buffer = await readFile(fullPath);
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(name, buffer, { contentType, upsert: false });
        if (uploadError) {
          error(`  Upload failed for "${name}": ${uploadError.message}`);
          failed++;
          continue;
        }
        uploaded++;
      } catch (e) {
        error(`  Exception uploading "${name}": ${e.message}`);
        failed++;
        continue;
      }
    } else {
      log(`"${name}" already in bucket — skipping upload.`);
      skipped++;
    }

    // 3. Upsert the `media` table row
    const row = {
      file_path: name,
      uploader_email: "admin@voyle",
      uploader_name: "Voyle",
      type,
      size,
      storage_key: name,
    };

    try {
      const { error: upsertError } = await supabase
        .from("media")
        .upsert(row, { onConflict: "file_path" });
      if (upsertError) {
        warn(`  DB upsert failed for "${name}": ${upsertError.message}`);
      } else {
        log(`  DB row upserted for "${name}".`);
      }
    } catch (e) {
      warn(`  DB upsert exception for "${name}": ${e.message}`);
    }
  }

  log("-".repeat(50));
  log(`Done. Uploaded: ${uploaded} | Already present: ${skipped} | Failed: ${failed}`);
}

main().catch((e) => {
  error(`Fatal: ${e.message}`);
  process.exit(1);
});