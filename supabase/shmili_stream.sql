-- Voyle — Shmili Streamer link table
-- Run this in the Supabase SQL Editor.
-- Stores the prewritten list of YouTube video links for the Shmili Streamer
-- feature on the /muzic page. The player auto-advances through these in
-- `position` order.
--
-- youtube_id is the 11-character video ID (e.g. "dQw4w9WgXcQ"), not the full
-- URL. Extract it before inserting. title is an optional display label.

CREATE TABLE IF NOT EXISTS shmili_stream (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  youtube_id TEXT NOT NULL UNIQUE,   -- YouTube video ID (11 chars)
  title TEXT,                         -- optional display title (null = use YouTube's)
  position INT NOT NULL DEFAULT 0,   -- playback order (ascending)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE shmili_stream ENABLE ROW LEVEL SECURITY;

-- Anyone can read (all authenticated users can watch the stream)
CREATE POLICY "Anyone can read shmili_stream" ON shmili_stream
  FOR SELECT USING (true);

-- Only the service-role key (SUPABASE_SERVICE_ROLE_KEY, used server-side) can write.
CREATE POLICY "No public inserts" ON shmili_stream
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No public updates" ON shmili_stream
  FOR UPDATE USING (false);

CREATE POLICY "No public deletes" ON shmili_stream
  FOR DELETE USING (false);

-- Helpful index for ordered playback lookups
CREATE INDEX IF NOT EXISTS shmili_stream_position_idx ON shmili_stream (position);

-- Example inserts (replace with real video IDs):
-- INSERT INTO shmili_stream (youtube_id, title, position) VALUES
--   ('dQw4w9WgXcQ', 'Never Gonna Give You Up', 0),
--   ('9bZkp7q19f0', 'Gangnam Style', 1),
--   ('kJQP7kiw5Fk', 'Despacito', 2);