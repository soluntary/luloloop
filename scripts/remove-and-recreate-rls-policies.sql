-- Completely remove existing RLS policies and create simple, non-recursive ones
-- Drop all existing policies that are causing infinite recursion
DROP POLICY IF EXISTS "ludo_event_participants_select_policy" ON ludo_event_participants;
DROP POLICY IF EXISTS "ludo_event_participants_insert_policy" ON ludo_event_participants;
DROP POLICY IF EXISTS "ludo_event_participants_update_policy" ON ludo_event_participants;
DROP POLICY IF EXISTS "ludo_event_participants_delete_policy" ON ludo_event_participants;

DROP POLICY IF EXISTS "ludo_event_join_requests_select_policy" ON ludo_event_join_requests;
DROP POLICY IF EXISTS "ludo_event_join_requests_insert_policy" ON ludo_event_join_requests;
DROP POLICY IF EXISTS "ludo_event_join_requests_update_policy" ON ludo_event_join_requests;
DROP POLICY IF EXISTS "ludo_event_join_requests_delete_policy" ON ludo_event_join_requests;

DROP POLICY IF EXISTS "ludo_event_invitations_select_policy" ON ludo_event_invitations;
DROP POLICY IF EXISTS "ludo_event_invitations_insert_policy" ON ludo_event_invitations;
DROP POLICY IF EXISTS "ludo_event_invitations_update_policy" ON ludo_event_invitations;
DROP POLICY IF EXISTS "ludo_event_invitations_delete_policy" ON ludo_event_invitations;

-- Disable RLS temporarily to avoid recursion during policy creation
ALTER TABLE ludo_event_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE ludo_event_join_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE ludo_event_invitations DISABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for ludo_event_participants
ALTER TABLE ludo_event_participants ENABLE ROW LEVEL SECURITY;

-- Allow users to see participants of events they created or are participating in
CREATE POLICY "ludo_event_participants_select_simple" ON ludo_event_participants
FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_participants.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
);

-- Allow event creators to insert participants
CREATE POLICY "ludo_event_participants_insert_simple" ON ludo_event_participants
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_participants.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
);

-- Allow event creators to update participants
CREATE POLICY "ludo_event_participants_update_simple" ON ludo_event_participants
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_participants.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
);

-- Allow event creators to delete participants
CREATE POLICY "ludo_event_participants_delete_simple" ON ludo_event_participants
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_participants.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
);

-- Create simple policies for ludo_event_join_requests
ALTER TABLE ludo_event_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ludo_event_join_requests_select_simple" ON ludo_event_join_requests
FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_join_requests.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
);

CREATE POLICY "ludo_event_join_requests_insert_simple" ON ludo_event_join_requests
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "ludo_event_join_requests_update_simple" ON ludo_event_join_requests
FOR UPDATE USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_join_requests.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
);

CREATE POLICY "ludo_event_join_requests_delete_simple" ON ludo_event_join_requests
FOR DELETE USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_join_requests.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
);

-- Create simple policies for ludo_event_invitations
ALTER TABLE ludo_event_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ludo_event_invitations_select_simple" ON ludo_event_invitations
FOR SELECT USING (
  invited_user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_invitations.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
);

CREATE POLICY "ludo_event_invitations_insert_simple" ON ludo_event_invitations
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_invitations.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
);

CREATE POLICY "ludo_event_invitations_update_simple" ON ludo_event_invitations
FOR UPDATE USING (
  invited_user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_invitations.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
);

CREATE POLICY "ludo_event_invitations_delete_simple" ON ludo_event_invitations
FOR DELETE USING (
  invited_user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_invitations.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
);
