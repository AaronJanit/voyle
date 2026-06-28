-- Voyle — login_attempts table
-- Run this in the Supabase SQL Editor.
-- Logs every blocked login attempt (e.g. emails ending in @mesivta.co.uk or
-- any email not in the users table) so the admin has a full audit trail of
-- who tried to get in and when.

CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL,
  reason TEXT NOT NULL,          -- e.g. 'blocked_domain', 'not_allowlisted'
  ip_address TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Anyone can read (the admin needs to view attempts via the Table Editor
-- using the publishable key). Writes happen via the service-role key from
-- the auth route.
CREATE POLICY "Anyone can read login_attempts" ON login_attempts
  FOR SELECT USING (true);

CREATE POLICY "No public inserts" ON login_attempts
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No public updates" ON login_attempts
  FOR UPDATE USING (false);

CREATE POLICY "No public deletes" ON login_attempts
  FOR DELETE USING (false);

-- Helpful index for browsing by most recent first
CREATE INDEX IF NOT EXISTS login_attempts_attempted_at_idx
  ON login_attempts (attempted_at DESC);