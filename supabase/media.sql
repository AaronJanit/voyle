-- Voyle — media attribution table
-- Run this in the Supabase SQL Editor.
-- Tracks which user uploaded/generated each file in /media so the
-- YouTube-style grid can show real channel names instead of fake ones.
--
-- The file_path column stores the relative path inside /media (matching
-- MediaItem.path from src/lib/media.ts). uploader_email is the stable
-- identity key (FK to users.email conceptually); uploader_name is
-- denormalized for quick display lookups without a join.

CREATE TABLE IF NOT EXISTS media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL UNIQUE,   -- relative path inside /media
  uploader_email TEXT NOT NULL,    -- stable identity (users.email)
  uploader_name TEXT NOT NULL,     -- display name (e.g. "Aaron")
  title TEXT,                       -- optional custom title (null = filename)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Anyone can read (all authenticated users can browse channels)
CREATE POLICY "Anyone can read media" ON media
  FOR SELECT USING (true);

-- Only the service-role key (SUPABASE_KEY, used server-side) can write.
-- RLS blocks anon/publishable-key writes.
CREATE POLICY "No public inserts" ON media
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No public updates" ON media
  FOR UPDATE USING (false);

CREATE POLICY "No public deletes" ON media
  FOR DELETE USING (false);

-- Helpful index for channel-page lookups by uploader name
CREATE INDEX IF NOT EXISTS media_uploader_name_idx ON media (uploader_name);

-- Helpful index for single-file lookups (file_path is already unique, but
-- an explicit index makes the upsert pattern fast)
CREATE INDEX IF NOT EXISTS media_file_path_idx ON media (file_path);