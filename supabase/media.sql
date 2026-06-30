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
  file_path TEXT NOT NULL UNIQUE,   -- relative path (R2 object key)
  uploader_email TEXT NOT NULL,    -- stable identity (users.email)
  uploader_name TEXT NOT NULL,     -- display name (e.g. "Aaron")
  title TEXT,                       -- optional custom title (null = filename)
  views BIGINT NOT NULL DEFAULT 0,  -- view count (incremented on each /p/[id] visit)
  created_at TIMESTAMPTZ DEFAULT now(),
  type TEXT NOT NULL DEFAULT 'photo',  -- "photo" | "gif" | "video" | "audio"
  size BIGINT NOT NULL DEFAULT 0,      -- file size in bytes
  storage_key TEXT                     -- R2 object key (same as file_path for new uploads)
);

-- Add columns if the table already exists without them (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'media' AND column_name = 'views'
  ) THEN
    ALTER TABLE media ADD COLUMN views BIGINT NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'media' AND column_name = 'type'
  ) THEN
    ALTER TABLE media ADD COLUMN type TEXT NOT NULL DEFAULT 'photo';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'media' AND column_name = 'size'
  ) THEN
    ALTER TABLE media ADD COLUMN size BIGINT NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'media' AND column_name = 'storage_key'
  ) THEN
    ALTER TABLE media ADD COLUMN storage_key TEXT;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first so this file is fully idempotent
-- (Postgres has no CREATE POLICY IF NOT EXISTS).
DROP POLICY IF EXISTS "Anyone can read media" ON media;
DROP POLICY IF EXISTS "No public inserts" ON media;
DROP POLICY IF EXISTS "No public updates" ON media;
DROP POLICY IF EXISTS "No public deletes" ON media;

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

-- Index for filtering by type (photos/gifs/videos vs audio)
CREATE INDEX IF NOT EXISTS media_type_idx ON media (type);