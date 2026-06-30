#!/usr/bin/env node
/**
 * One-off script: add missing columns to the Supabase `media` table
 * and update existing rows with type/size/storage_key values.
 *
 * Requires: SUPABASE_DB_PASSWORD env var (the database password from
 * Supabase Dashboard → Project Settings → Database → Connection string).
 */

const { Client } = require("pg");
const { readdir, stat } = require("fs/promises");
const { join, extname } = require("path");

const PROJECT_REF = "xdfuvfxagyhgweqpfwai";
const POOLER_HOST = "aws-0-eu-west-2.pooler.supabase.com";
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

if (!DB_PASSWORD) {
  console.error("ERROR: Set SUPABASE_DB_PASSWORD env var first.");
  console.error("Find it in Supabase Dashboard → Project Settings → Database → Connection info.");
  process.exit(1);
}

const PHOTO_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".bmp", ".tiff"];
const GIF_EXTS = [".gif"];
const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"];
const AUDIO_EXTS = [".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"];

function classifyType(ext) {
  if (PHOTO_EXTS.includes(ext)) return "photo";
  if (GIF_EXTS.includes(ext)) return "gif";
  if (VIDEO_EXTS.includes(ext)) return "video";
  if (AUDIO_EXTS.includes(ext)) return "audio";
  return "photo";
}

async function main() {
  const client = new Client({
    host: POOLER_HOST,
    port: 6543,
    database: "postgres",
    user: `postgres.${PROJECT_REF}`,
    password: DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Connecting to Supabase Postgres...");
  await client.connect();
  console.log("Connected!");

  // 1. Add missing columns
  console.log("Adding missing columns (type, size, storage_key)...");
  await client.query(`
    ALTER TABLE media ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'photo';
    ALTER TABLE media ADD COLUMN IF NOT EXISTS size BIGINT NOT NULL DEFAULT 0;
    ALTER TABLE media ADD COLUMN IF NOT EXISTS storage_key TEXT;
  `);
  console.log("Columns added.");

  // 2. Update existing rows with type, size, and storage_key based on file_path
  console.log("Updating existing rows with type/size/storage_key...");
  const { rows } = await client.query("SELECT file_path FROM media");
  console.log(`Found ${rows.length} row(s) to update.`);

  let updated = 0;
  for (const row of rows) {
    const filePath = row.file_path;
    const ext = extname(filePath).toLowerCase();
    const type = classifyType(ext);

    // Try to get file size from local /media folder
    let size = 0;
    try {
      const localPath = join(process.cwd(), "media", filePath);
      const s = await stat(localPath);
      size = s.size;
    } catch {
      // File not in local /media — leave size as 0
    }

    await client.query(
      `UPDATE media SET type = $1, size = $2, storage_key = $3 WHERE file_path = $4`,
      [type, size, filePath, filePath]
    );
    updated++;
  }

  console.log(`Updated ${updated} row(s).`);
  await client.end();
  console.log("Done!");
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});