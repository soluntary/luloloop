-- Disable RLS on user_profiles table
-- This is needed because the v0 environment does not properly support server-side sessions

ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Also disable on users table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    EXECUTE 'ALTER TABLE users DISABLE ROW LEVEL SECURITY';
  END IF;
END $$;
