-- Voyle — site_lockdown table
-- Run this in the Supabase SQL Editor.
-- Single-row table that holds the global lockdown flag. When `locked` is true,
-- the middleware (src/proxy.ts) takes the entire site offline — every route
-- returns the lockdown page or a 503. The flag is tripped automatically by
-- the auth route (src/app/api/auth/route.ts) the moment someone attempts to
-- log in with an email that is NOT in the users table. Recovery is manual:
-- an admin sets `locked` back to false in the Supabase Table Editor.

CREATE TABLE IF NOT EXISTS site_lockdown (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- single-row table
  locked BOOLEAN NOT NULL DEFAULT false,
  triggered_by TEXT,
  triggered_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE site_lockdown ENABLE ROW LEVEL SECURITY;

-- Anyone can read (the middleware needs to fetch the flag on every request)
CREATE POLICY "Anyone can read site_lockdown" ON site_lockdown
  FOR SELECT USING (true);

-- Only allow writes via the service-role key (admin) — RLS blocks anon writes.
-- The auth route uses the service-role key (SUPABASE_KEY) to flip the flag.
CREATE POLICY "No public inserts" ON site_lockdown
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No public updates" ON site_lockdown
  FOR UPDATE USING (false);

CREATE POLICY "No public deletes" ON site_lockdown
  FOR DELETE USING (false);

-- Initial seed: unlocked by default.
INSERT INTO site_lockdown (id, locked)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;