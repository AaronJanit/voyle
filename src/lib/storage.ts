// Voyle — Supabase Storage client
// Replaces the former Cloudflare R2 abstraction. File bytes live in a
// public Supabase Storage bucket ("media"); metadata lives in the
// `media` Postgres table (see src/lib/media.ts).
//
// Uses the service-role key so uploads/bypass-RLS work server-side.
// The bucket must be created in the Supabase dashboard (public = true).

import { createClient } from "@supabase/supabase-js";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "media";

function getStorageClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Build the public Supabase Storage URL for a media object key.
 * The bucket is public, so this is a simple deterministic URL — no
 * signed-URL round-trip needed.
 */
export function storageUrl(path: string): string {
  const base = process.env.SUPABASE_URL;
  if (!base) return "";
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}

/**
 * Upload a file to the Supabase Storage bucket.
 * @returns true on success, false on failure.
 */
export async function uploadToStorage(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<boolean> {
  const supabase = getStorageClient();
  if (!supabase) return false;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, buffer, {
      contentType,
      upsert: false, // don't overwrite — caller de-dupes filenames
    });

  if (error) {
    console.error("uploadToStorage:", error.message);
    return false;
  }
  return true;
}

/**
 * Check whether an object exists in the bucket and return its size in
 * bytes, or null if it doesn't exist (or storage isn't configured).
 */
export async function headObject(key: string): Promise<number | null> {
  const supabase = getStorageClient();
  if (!supabase) return null;

  try {
    // `list` with a search prefix lets us find the exact key and read
    // its metadata (size) without downloading the body.
    const dir = key.includes("/") ? key.slice(0, key.lastIndexOf("/") + 1) : "";
    const fileName = key.includes("/") ? key.slice(key.lastIndexOf("/") + 1) : key;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(dir, { search: fileName, limit: 100 });

    if (error) {
      console.error("headObject:", error.message);
      return null;
    }

    const match = data?.find((obj) => obj.name === fileName);
    if (!match) return null;
    return match.metadata?.size ?? null;
  } catch (err) {
    console.error("headObject: exception", err);
    return null;
  }
}