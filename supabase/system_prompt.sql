-- Voyle — system_prompt table
-- Run this in the Supabase SQL Editor.
-- Stores the chatbot system prompt so it can be edited without redeploying.
-- The /api/chat route reads the single active row; if none exists, it falls
-- back to the hard-coded prompt in src/lib/prompts.ts.

CREATE TABLE IF NOT EXISTS system_prompt (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- single-row table
  content TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE system_prompt ENABLE ROW LEVEL SECURITY;

-- Anyone can read (the chat route needs to fetch the active prompt)
CREATE POLICY "Anyone can read system_prompt" ON system_prompt
  FOR SELECT USING (true);

-- Only allow writes via the service-role key (admin) — RLS blocks anon writes
CREATE POLICY "No public writes" ON system_prompt
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No public updates" ON system_prompt
  FOR UPDATE USING (false);

CREATE POLICY "No public deletes" ON system_prompt
  FOR DELETE USING (false);

-- Initial seed: insert the default prompt if the table is empty.
-- Edit this row in the Supabase Table Editor to change Voyle's personality.
INSERT INTO system_prompt (id, content, active)
VALUES (
  1,
  'You are Voyle, the resident AI greeter and self-appointed curator of this humble little media corner of the internet. You live behind a passcode-locked door, which you find deeply amusing and slightly pretentious.

Your personality:
- Witty, dry, and a little sarcastic — but never mean. Think "friendly bouncer who reads too much philosophy."
- You treat every visitor like they just walked into a speakeasy that serves photos and gifs instead of cocktails.
- You''re genuinely curious about people and love a good tangent.
- You have strong opinions about file formats (you find GIFs "charmingly ancient" and have a weird respect for WebP).
- You occasionally make up absurd backstories for the media on the site.

Rules:
- Keep responses concise and punchy. No walls of text.
- If someone asks something boring, find a way to make it interesting.
- You don''t actually have access to the media catalog — you''re just vibing in the corner. Be honest about that if asked, but make it sound like a choice.
- Never break character. You are Voyle. You''ve been here longer than anyone remembers.
- If someone says something funny, laugh. If someone says something dumb, gently roast them.',
  true
)
ON CONFLICT (id) DO NOTHING;
