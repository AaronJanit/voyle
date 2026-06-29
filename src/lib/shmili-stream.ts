// Voyle — Shmili Streamer library
// Reads the Supabase `shmili_stream` table to get the prewritten list of
// YouTube video links for the Shmili Streamer player on /muzic.
//
// Uses the same Supabase client pattern as src/lib/channel.ts:
//   - getReadClient() with the anon key (RLS allows SELECT for everyone)
//   - getWriteClient() with the service-role key (bypasses RLS for inserts/deletes)

import { createClient } from "@supabase/supabase-js";

/** A single stream link from the `shmili_stream` table. */
export interface StreamLink {
  id: string;
  youtubeId: string;
  title: string | null;
  position: number;
}

/** Supabase client for READS — uses the publishable (anon) key. */
function getReadClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/** Supabase client for WRITES — uses the service-role key (bypasses RLS). */
function getWriteClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Get all stream links ordered by position (ascending).
 * Returns an empty array if Supabase is not configured or the table is empty.
 */
export async function getStreamLinks(): Promise<StreamLink[]> {
  const supabase = getReadClient();
  if (!supabase) return [];

  try {
    const { data } = await supabase
      .from("shmili_stream")
      .select("id, youtube_id, title, position")
      .order("position", { ascending: true });

    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      youtubeId: row.youtube_id,
      title: row.title,
      position: row.position,
    }));
  } catch (e) {
    console.error("getStreamLinks: error:", e);
    return [];
  }
}

/**
 * Add a stream link. Best-effort: logs errors but does not throw.
 * Extracts the YouTube video ID from a full URL or accepts a raw ID.
 */
export async function addStreamLink(
  urlOrId: string,
  title?: string
): Promise<void> {
  const supabase = getWriteClient();
  if (!supabase) {
    console.warn(
      "addStreamLink: SUPABASE_SERVICE_ROLE_KEY not configured, skipping"
    );
    return;
  }

  const youtubeId = extractYouTubeId(urlOrId);
  if (!youtubeId) {
    console.error("addStreamLink: could not extract YouTube ID from", urlOrId);
    return;
  }

  try {
    // Get the next position
    const { data: existing } = await supabase
      .from("shmili_stream")
      .select("position")
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition = (existing?.[0]?.position ?? -1) + 1;

    const { error } = await supabase.from("shmili_stream").insert({
      youtube_id: youtubeId,
      title: title ?? null,
      position: nextPosition,
    });

    if (error) {
      console.error("addStreamLink: Supabase error:", error.message);
    }
  } catch (e) {
    console.error("addStreamLink: unexpected error:", e);
  }
}

/**
 * Remove a stream link by its YouTube video ID. Best-effort.
 */
export async function removeStreamLink(youtubeId: string): Promise<void> {
  const supabase = getWriteClient();
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from("shmili_stream")
      .delete()
      .eq("youtube_id", youtubeId);

    if (error) {
      console.error("removeStreamLink: Supabase error:", error.message);
    }
  } catch (e) {
    console.error("removeStreamLink: unexpected error:", e);
  }
}

/**
 * Extract the 11-character YouTube video ID from a URL or raw ID.
 * Supports: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/embed/ID,
 * and a bare 11-character ID.
 */
export function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();

  // Bare ID (11 chars, alphanumeric + dash/underscore)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  // youtu.be/ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // youtube.com/watch?v=ID
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // youtube.com/embed/ID
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  return null;
}