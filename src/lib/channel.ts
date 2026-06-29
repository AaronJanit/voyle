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
 * Per-channel aggregate stats, used by the Channels directory and the
 * channel details page header.
 */
export interface ChannelStats {
  name: string;             // uploader_name (display)
  videos: number;           // photo / gif / video files attributed to this channel
  tracks: number;           // audio files attributed to this channel
  views: number;            // sum of views across all attributed files
  firstUploadAt: number | null;  // ms since epoch
  latestUploadAt: number | null; // ms since epoch
}

/**
 * Aggregate stats for a single channel by name.
 *
 * Cross-references the `media` table with scanMediaDir()/scanAudioDir()
 * so counts only include files that still exist on disk. Returns zeroes
 * (and null timestamps) if the channel has no attribution rows.
 */
export async function getChannelStats(name: string): Promise<ChannelStats> {
  const empty: ChannelStats = {
    name,
    videos: 0,
    tracks: 0,
    views: 0,
    firstUploadAt: null,
    latestUploadAt: null,
  };

  const supabase = getReadClient();
  if (!supabase) return empty;

  try {
    const { data } = await supabase
      .from("media")
      .select("file_path, views, created_at")
      .eq("uploader_name", name);

    if (!data || data.length === 0) return empty;

    // Cross-reference with on-disk media so we don't count files that
    // were deleted from /media but still have leftover attribution rows.
    const mediaSet = new Set(scanMediaDir().map((i) => i.path));
    const audioSet = new Set(scanAudioDir().map((i) => i.path));

    let videos = 0;
    let tracks = 0;
    let views = 0;
    let first: number | null = null;
    let latest: number | null = null;

    for (const row of data) {
      const isAudio = audioSet.has(row.file_path);
      const isVideo = mediaSet.has(row.file_path);
      if (!isAudio && !isVideo) continue; // file was deleted from disk

      if (isAudio) tracks += 1;
      if (isVideo) videos += 1;
      views += typeof row.views === "number" ? row.views : 0;

      if (row.created_at) {
        const t = new Date(row.created_at).getTime();
        if (!Number.isNaN(t)) {
          if (first === null || t < first) first = t;
          if (latest === null || t > latest) latest = t;
        }
      }
    }

    return {
      name,
      videos,
      tracks,
      views,
      firstUploadAt: first,
      latestUploadAt: latest,
    };
  } catch (e) {
    console.error("getChannelStats: error:", e);
    return empty;
  }
}

/**
 * Aggregate stats for every channel that has at least one attribution row
 * and at least one file still on disk. Sorted by total views (desc) by
 * default so the directory surfaces the most-watched channels first.
 */
export async function getAllChannelStats(): Promise<ChannelStats[]> {
  const supabase = getReadClient();
  if (!supabase) return [];

  try {
    const { data } = await supabase
      .from("media")
      .select("uploader_name, file_path, views, created_at");

    if (!data) return [];

    // Bucket rows by uploader_name
    const byChannel = new Map<
      string,
      {
        videos: Set<string>;
        tracks: Set<string>;
        views: number;
        first: number | null;
        latest: number | null;
      }
    >();

    // On-disk sets for cross-reference
    const mediaSet = new Set(scanMediaDir().map((i) => i.path));
    const audioSet = new Set(scanAudioDir().map((i) => i.path));

    for (const row of data) {
      const isAudio = audioSet.has(row.file_path);
      const isVideo = mediaSet.has(row.file_path);
      if (!isAudio && !isVideo) continue;

      let bucket = byChannel.get(row.uploader_name);
      if (!bucket) {
        bucket = {
          videos: new Set(),
          tracks: new Set(),
          views: 0,
          first: null,
          latest: null,
        };
        byChannel.set(row.uploader_name, bucket);
      }

      if (isVideo) bucket.videos.add(row.file_path);
      if (isAudio) bucket.tracks.add(row.file_path);
      bucket.views += typeof row.views === "number" ? row.views : 0;

      if (row.created_at) {
        const t = new Date(row.created_at).getTime();
        if (!Number.isNaN(t)) {
          if (bucket.first === null || t < bucket.first) bucket.first = t;
          if (bucket.latest === null || t > bucket.latest) bucket.latest = t;
        }
      }
    }

    const stats: ChannelStats[] = [];
    for (const [name, b] of byChannel.entries()) {
      stats.push({
        name,
        videos: b.videos.size,
        tracks: b.tracks.size,
        views: b.views,
        firstUploadAt: b.first,
        latestUploadAt: b.latest,
      });
    }

    // Sort by views desc, then by latest upload desc as a tiebreaker
    stats.sort((a, b) => {
      if (b.views !== a.views) return b.views - a.views;
      return (b.latestUploadAt ?? 0) - (a.latestUploadAt ?? 0);
    });

    return stats;
  } catch (e) {
    console.error("getAllChannelStats: error:", e);
    return [];
  }
}

/**
 * Get the most recently uploaded media items (any type) for a channel.
 * Returns MediaItem objects so the caller can render them straight into
 * a grid (with the file already verified to exist on disk).
 */
export async function getRecentMediaForChannel(
  name: string,
  limit = 4
): Promise<MediaItem[]> {
  const supabase = getReadClient();
  if (!supabase) return [];

  try {
    const { data } = await supabase
      .from("media")
      .select("file_path, created_at")
      .eq("uploader_name", name)
      .order("created_at", { ascending: false })
      .limit(limit * 3); // over-fetch so we can still return `limit` after disk-filtering

    if (!data || data.length === 0) return [];

    const mediaMap = new Map(scanMediaDir().map((i) => [i.path, i] as const));
    const audioMap = new Map(scanAudioDir().map((i) => [i.path, i] as const));

    const out: { item: MediaItem; t: number }[] = [];
    for (const row of data) {
      const item = mediaMap.get(row.file_path) ?? audioMap.get(row.file_path);
      if (!item) continue;
      const t = row.created_at ? new Date(row.created_at).getTime() : 0;
      out.push({ item, t });
      if (out.length >= limit) break;
    }

    out.sort((a, b) => b.t - a.t);
    return out.map((x) => x.item);
  } catch (e) {
    console.error("getRecentMediaForChannel: error:", e);
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