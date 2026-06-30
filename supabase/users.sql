-- Voyle — users table
-- Run this in the Supabase SQL Editor to create the users table.
-- Admin manually inserts allowed users here.

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (the app needs to check if an email exists)
-- This is safe because the table only contains email + name (no passwords)
DROP POLICY IF EXISTS "Anyone can read users" ON users;
CREATE POLICY "Anyone can read users" ON users
  FOR SELECT USING (true);

-- Only authenticated Supabase users (admin) can insert/update/delete
-- For now, allow all since we're using the publishable key
DROP POLICY IF EXISTS "Anyone can insert users" ON users;
CREATE POLICY "Anyone can insert users" ON users
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update users" ON users;
CREATE POLICY "Anyone can update users" ON users
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete users" ON users;
CREATE POLICY "Anyone can delete users" ON users
  FOR DELETE USING (true);

-- IP pinning columns (added for cybersecurity hardening).
-- first_login_ip is set the first time a user logs in successfully; every
-- subsequent login must originate from the same IP. ip_locked_at records
-- when the binding happened (audit only). To reset a user's IP (e.g. they
-- changed ISP), an admin clears first_login_ip back to NULL in the Table
-- Editor — the next login re-binds it.
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_login_ip TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ip_locked_at TIMESTAMPTZ;

-- Role + approval columns (added for admin user management).
-- is_admin:  true for admin users who can access /admin and submit new emails.
-- allowed:   controls whether a user may actually log in. When an admin
--            submits a new email via /admin, the row is inserted with
--            allowed = false (pending). A real admin must flip it to true
--            in the Supabase Table Editor before that user can sign in.
--            Existing users default to true so they aren't locked out.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed BOOLEAN NOT NULL DEFAULT true;

-- Example: insert your first user
-- INSERT INTO users (email, name) VALUES ('someone@example.com', 'Someone');
-- Example: make a user an admin
-- UPDATE users SET is_admin = true WHERE email = 'someone@example.com';