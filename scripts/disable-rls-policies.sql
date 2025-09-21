-- Completely disable RLS on ludo event tables to fix infinite recursion
-- Drop all existing policies that are causing infinite recursion
DROP POLICY IF EXISTS "ludo_event_participants_select" ON ludo_event_participants;
DROP POLICY IF EXISTS "ludo_event_participants_insert" ON ludo_event_participants;
DROP POLICY IF EXISTS "ludo_event_participants_update" ON ludo_event_participants;
DROP POLICY IF EXISTS "ludo_event_participants_delete" ON ludo_event_participants;

DROP POLICY IF EXISTS "ludo_event_join_requests_select" ON ludo_event_join_requests;
DROP POLICY IF EXISTS "ludo_event_join_requests_insert" ON ludo_event_join_requests;
DROP POLICY IF EXISTS "ludo_event_join_requests_update" ON ludo_event_join_requests;
DROP POLICY IF EXISTS "ludo_event_join_requests_delete" ON ludo_event_join_requests;

DROP POLICY IF EXISTS "ludo_event_invitations_select" ON ludo_event_invitations;
DROP POLICY IF EXISTS "ludo_event_invitations_insert" ON ludo_event_invitations;
DROP POLICY IF EXISTS "ludo_event_invitations_update" ON ludo_event_invitations;
DROP POLICY IF EXISTS "ludo_event_invitations_delete" ON ludo_event_invitations;

-- Disable RLS entirely on these tables to prevent recursion
ALTER TABLE ludo_event_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE ludo_event_join_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE ludo_event_invitations DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled on ludo_events table with simple policy
ALTER TABLE ludo_events ENABLE ROW LEVEL SECURITY;

-- Simple policy for ludo_events - users can only see/modify their own events
DROP POLICY IF EXISTS "ludo_events_policy" ON ludo_events;
CREATE POLICY "ludo_events_policy" ON ludo_events
    FOR ALL USING (auth.uid() = creator_id);
