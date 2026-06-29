// Voyle — channel attribution library
// Reads/writes the Supabase `media` table to track which user uploaded or
// generated each file. This replaces the fake `channelFor()` hash in
// YouTubeGrid with real per-user attribution.
//
// All functions use the raw `createClient(SUPABASE_URL, SUPABASE_KEY)`
// pattern (same as src/lib/prompts.ts and src/lib/user.ts). The env vars
// are non-NEXT_PUBLIC_ so they're read at runtime, not frozen at build.

import { createClient } from "@supabase/supabase-js";
import { scanMediaDir, scanAudioDir, MediaItem } from "@/lib/media";

/** A single attribution row from the `media` table. */
export interface MediaAttribution {
  filePath: string;
  uploaderEmail: string;
  uploaderName: string;
  title: string | null;
  createdAt: string;
}

/** Lightweight channel info used by the grid. */
export interface ChannelInfo {
  name: string;
  initial: string;
  color: string;
}

/** Attribution info for a single file: channel + upload date + views. */
export interface FileAttribution {
  channel: ChannelInfo;
  uploadedAt: number | null; // ms since epoch, or null if unknown
  views: number; // real view count from the DB (0 if unattributed)
}

const PALETTE = [
  "#e53935",
  "#1e88e5",
  "#43a047",
  "#fb8c00",
  "#8e24aa",
  "#00acc1",
  "#fdd835",
  "#6d4c41",
];

/** Deterministic color from a name (stable avatar color per channel). */
function colorForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(h) % PALETTE.length];
}

/** Two-letter avatar initial from a channel name. */
function initialForName(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Build a ChannelInfo object from a display name. */
export function channelInfoForName(name: string): ChannelInfo {
  return {
    name,
    initial: initialForName(name),
    color: colorForName(name),
  };
}

/**
 * Supabase client for READS — uses the publishable (anon) key.
 * RLS allows SELECT for everyone, so this is safe to expose conceptually
 * even though we never actually send it to the browser (it's server-only).
 */
function getReadClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Supabase client for WRITES — uses the service-role key, which bypasses
 * RLS. This is the only way the publishable key can be blocked from
 * inserting into the `media` table (consistent with lockdown.sql and
 * system_prompt.sql, which also write with the service-role key).
 *
 * If SUPABASE_SERVICE_ROLE_KEY is not configured, writes will silently
 * no-op (logged as a warning) so uploads still succeed — they just
 * won't be attributed.
 */
function getWriteClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Record that a user uploaded/generated a file.
 * Best-effort: logs errors but does not throw, so a failed attribution
 * write never blocks a successful upload.
 */
export async function recordUpload(
  filePath: string,
  email: string,
  name: string
): Promise<void> {
  const supabase = getWriteClient();
  if (!supabase) {
    console.warn(
      "recordUpload: SUPABASE_SERVICE_ROLE_KEY not configured, skipping attribution"
    );
    return;
  }

  try {
    const { error } = await supabase
      .from("media")
      .upsert(
        {
          file_path: filePath,
          uploader_email: email,
          uploader_name: name,
        },
        { onConflict: "file_path" }
      );

    if (error) {
      console.error("recordUpload: Supabase error:", error.message);
    } else {
      console.log(`recordUpload: attributed ${filePath} to ${name}`);
    }
  } catch (e) {
    console.error("recordUpload: unexpected error:", e);
  }
}

/**
 * Look up the uploader of a single file.
 * Returns null if the file has no attribution row (legacy/unattributed).
 */
export async function getUploader(
  filePath: string
): Promise<{ email: string; name: string } | null> {
  const supabase = getReadClient();
  if (!supabase) return null;

  try {
    const { data } = await supabase
      .from("media")
      .select("uploader_email, uploader_name")
      .eq("file_path", filePath)
      .single();

    if (!data) return null;
    return { email: data.uploader_email, name: data.uploader_name };
  } catch {
    return null;
  }
}

/**
 * Batch-lookup attribution for many file paths at once.
 * Returns a Map keyed by file path → FileAttribution (channel + upload date).
 * Files without a row are simply absent from the map (caller falls back
 * to the fake channelFor() hash for those).
 */
export async function getAttributionMap(
  paths: string[]
): Promise<Map<string, FileAttribution>> {
  const result = new Map<string, FileAttribution>();
  if (paths.length === 0) return result;

  const supabase = getReadClient();
  if (!supabase) return result;

  try {
    const { data } = await supabase
      .from("media")
      .select("file_path, uploader_name, created_at, views")
      .in("file_path", paths);

    if (data) {
      for (const row of data) {
        const uploadedAt = row.created_at
          ? new Date(row.created_at).getTime()
          : null;
        result.set(row.file_path, {
          channel: channelInfoForName(row.uploader_name),
          uploadedAt,
          views: typeof row.views === "number" ? row.views : 0,
        });
      }
    }
  } catch (e) {
    console.error("getAttributionMap: error:", e);
  }

  return result;
}

/**
 * Get all media items belonging to a channel (uploader name).
 * Cross-references the `media` table with scanMediaDir() so only files
 * that still exist on disk are returned.
 */
export async function getChannelContent(name: string): Promise<MediaItem[]> {
  const supabase = getReadClient();
  if (!supabase) return [];

  try {
    const { data } = await supabase
      .from("media")
      .select("file_path")
      .eq("uploader_name", name);

    if (!data || data.length === 0) return [];

    // Build a set of attributed file paths for this channel
    const channelPaths = new Set(data.map((r) => r.file_path));

    // Filter the on-disk media items to only those in this channel
    const allItems = scanMediaDir();
    return allItems.filter((item) => channelPaths.has(item.path));
  } catch (e) {
    console.error("getChannelContent: error:", e);
    return [];
  }
}

/**
 * Get all audio items belonging to a channel (uploader name).
 * Cross-references the `media` table with scanAudioDir() so only audio
 * files that still exist on disk are returned.
 */
export async function getChannelAudio(name: string): Promise<MediaItem[]> {
  const supabase = getReadClient();
  if (!supabase) return [];

  try {
    const { data } = await supabase
      .from("media")
      .select("file_path")
      .eq("uploader_name", name);

    if (!data || data.length === 0) return [];

    const channelPaths = new Set(data.map((r) => r.file_path));
    const allAudio = scanAudioDir();
    return allAudio.filter((item) => channelPaths.has(item.path));
  } catch (e) {
    console.error("getChannelAudio: error:", e);
    return [];
  }
}

/**
 * List all channels (distinct uploader names) with their content counts.
 * Useful for a future "browse all channels" page.
 */
export async function listChannels(): Promise<
  { name: string; count: number }[]
> {
  const supabase = getReadClient();
  if (!supabase) return [];

  try {
    const { data } = await supabase
      .from("media")
      .select("uploader_name");

    if (!data) return [];

    // Aggregate counts client-side (simple, no RPC needed)
    const counts = new Map<string, number>();
    for (const row of data) {
      counts.set(row.uploader_name, (counts.get(row.uploader_name) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  } catch (e) {
    console.error("listChannels: error:", e);
    return [];
  }
}

/**
 * Increment the view count for a single file.
 * Uses the service-role (write) client to bypass RLS.
 * Best-effort: logs errors but does not throw, so a failed view increment
 * never blocks the share page from rendering.
 *
 * If the file has no attribution row yet, this is a no-op (we can't
 * increment views on a row that doesn't exist). Views are only tracked
 * for files that have been uploaded/attributed via recordUpload.
 */
export async function incrementViews(filePath: string): Promise<void> {
  const supabase = getWriteClient();
  if (!supabase) return; // silently skip if not configured

  try {
    // Fetch current views, then increment. We do a read-then-write
    // instead of an RPC because Supabase doesn't expose arbitrary SQL
    // without a stored procedure. The race condition (two concurrent
    // views) is acceptable — a lost increment is off by at most 1.
    const { data } = await supabase
      .from("media")
      .select("views")
      .eq("file_path", filePath)
      .single();

    if (!data) return; // no attribution row → skip

    const newCount = (data.views ?? 0) + 1;
    const { error } = await supabase
      .from("media")
      .update({ views: newCount })
      .eq("file_path", filePath);

    if (error) {
      console.error("incrementViews: Supabase error:", error.message);
    }
  } catch (e) {
    console.error("incrementViews: unexpected error:", e);
  }
}