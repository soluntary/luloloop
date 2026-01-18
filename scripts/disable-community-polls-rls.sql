-- Disable RLS on community_polls and related tables
-- The app handles authentication at the application level

ALTER TABLE community_polls DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_poll_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_poll_votes DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view polls" ON community_polls;
DROP POLICY IF EXISTS "Users can create polls" ON community_polls;
DROP POLICY IF EXISTS "Users can update their own polls" ON community_polls;
DROP POLICY IF EXISTS "Users can delete their own polls" ON community_polls;

DROP POLICY IF EXISTS "Users can view poll options" ON community_poll_options;
DROP POLICY IF EXISTS "Users can create poll options" ON community_poll_options;

DROP POLICY IF EXISTS "Users can view votes" ON community_poll_votes;
DROP POLICY IF EXISTS "Users can vote" ON community_poll_votes;
DROP POLICY IF EXISTS "Users can remove their vote" ON community_poll_votes;
