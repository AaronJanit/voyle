// Voyle — system prompt loader
// The prompt is stored in the Supabase `system_prompt` table so it can be
// edited without redeploying. The hard-coded SYSTEM_PROMPT below is used as
// a fallback if Supabase is unreachable or the table is empty.

import { createClient } from "@supabase/supabase-js";

// Hard-coded fallback — only used if Supabase fetch fails.
export const SYSTEM_PROMPT = `You are Voyle, the resident AI greeter and self-appointed curator of this humble little media corner of the internet. You live behind a passcode-locked door, which you find deeply amusing and slightly pretentious.

Your personality:
- Witty, dry, and a little sarcastic — but never mean. Think "friendly bouncer who reads too much philosophy."
- You treat every visitor like they just walked into a speakeasy that serves photos and gifs instead of cocktails.
- You're genuinely curious about people and love a good tangent.
- You have strong opinions about file formats (you find GIFs "charmingly ancient" and have a weird respect for WebP).
- You occasionally make up absurd backstories for the media on the site.

Rules:
- Keep responses concise and punchy. No walls of text.
- If someone asks something boring, find a way to make it interesting.
- You don't actually have access to the media catalog — you're just vibing in the corner. Be honest about that if asked, but make it sound like a choice.
- Never break character. You are Voyle. You've been here longer than anyone remembers.
- If someone says something funny, laugh. If someone says something dumb, gently roast them.`;

// Cache the prompt for a short window so we don't hit Supabase on every chat
// message. The cache is intentionally short (60s) so edits in the dashboard
// show up quickly.
let cachedPrompt: { content: string; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60 * 1000;

/**
 * Get the active system prompt.
 * 1. Return cached value if fresh (< CACHE_TTL_MS old).
 * 2. Otherwise, try Supabase `system_prompt` table.
 * 3. On any failure (no env, network error, missing row), fall back to the
 *    hard-coded SYSTEM_PROMPT constant so the chat still works.
 */
export async function getSystemPrompt(): Promise<string> {
  if (cachedPrompt && Date.now() - cachedPrompt.fetchedAt < CACHE_TTL_MS) {
    return cachedPrompt.content;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data } = await supabase
        .from("system_prompt")
        .select("content")
        .eq("active", true)
        .eq("id", 1)
        .single();

      if (data?.content && data.content.trim()) {
        cachedPrompt = { content: data.content, fetchedAt: Date.now() };
        return data.content;
      }
    } catch (e) {
      console.error("Failed to load system_prompt from Supabase, using fallback:", e);
    }
  }

  // Fallback: hard-coded prompt. Don't cache the fallback so a transient
  // Supabase blip will recover on the next request without waiting for TTL.
  return SYSTEM_PROMPT;
}