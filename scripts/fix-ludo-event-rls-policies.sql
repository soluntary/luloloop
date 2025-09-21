-- Fix infinite recursion in RLS policies by removing circular references
-- Drop existing policies that cause recursion
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

-- Create simplified policies without recursion
-- ludo_event_participants policies
CREATE POLICY "ludo_event_participants_select" ON ludo_event_participants
FOR SELECT USING (
  -- Users can see participants of events they created or are participating in
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_participants.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
  OR user_id = auth.uid()
);

CREATE POLICY "ludo_event_participants_insert" ON ludo_event_participants
FOR INSERT WITH CHECK (
  -- Event creators can add participants to their events
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_participants.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
  OR user_id = auth.uid()
);

CREATE POLICY "ludo_event_participants_update" ON ludo_event_participants
FOR UPDATE USING (
  -- Event creators can update participants in their events
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_participants.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
);

CREATE POLICY "ludo_event_participants_delete" ON ludo_event_participants
FOR DELETE USING (
  -- Event creators can remove participants from their events, users can remove themselves
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_participants.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
  OR user_id = auth.uid()
);

-- ludo_event_join_requests policies
CREATE POLICY "ludo_event_join_requests_select" ON ludo_event_join_requests
FOR SELECT USING (
  -- Event creators can see join requests for their events, users can see their own requests
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_join_requests.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
  OR user_id = auth.uid()
);

CREATE POLICY "ludo_event_join_requests_insert" ON ludo_event_join_requests
FOR INSERT WITH CHECK (
  -- Users can create join requests for events
  user_id = auth.uid()
);

CREATE POLICY "ludo_event_join_requests_update" ON ludo_event_join_requests
FOR UPDATE USING (
  -- Event creators can update join requests for their events
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_join_requests.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
);

CREATE POLICY "ludo_event_join_requests_delete" ON ludo_event_join_requests
FOR DELETE USING (
  -- Event creators can delete join requests for their events, users can delete their own requests
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_join_requests.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
  OR user_id = auth.uid()
);

-- ludo_event_invitations policies
CREATE POLICY "ludo_event_invitations_select" ON ludo_event_invitations
FOR SELECT USING (
  -- Event creators can see invitations for their events, invited users can see their invitations
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_invitations.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
  OR invited_user_id = auth.uid()
);

CREATE POLICY "ludo_event_invitations_insert" ON ludo_event_invitations
FOR INSERT WITH CHECK (
  -- Event creators can create invitations for their events
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_invitations.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
);

CREATE POLICY "ludo_event_invitations_update" ON ludo_event_invitations
FOR UPDATE USING (
  -- Event creators can update invitations for their events, invited users can update their own invitations
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_invitations.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
  OR invited_user_id = auth.uid()
);

CREATE POLICY "ludo_event_invitations_delete" ON ludo_event_invitations
FOR DELETE USING (
  -- Event creators can delete invitations for their events, invited users can delete their own invitations
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_invitations.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
  OR invited_user_id = auth.uid()
);
