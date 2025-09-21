-- Enable RLS on ludo event tables
ALTER TABLE ludo_event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ludo_event_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ludo_event_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ludo_event_participants
-- Allow event creators to manage participants for their events
CREATE POLICY "Event creators can manage participants" ON ludo_event_participants
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_participants.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
);

-- Allow users to view participants of events they can see
CREATE POLICY "Users can view event participants" ON ludo_event_participants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_participants.event_id 
    AND (ludo_events.is_public = true OR ludo_events.creator_id = auth.uid())
  )
);

-- Allow users to manage their own participation
CREATE POLICY "Users can manage own participation" ON ludo_event_participants
FOR ALL USING (user_id = auth.uid());

-- RLS Policies for ludo_event_join_requests
-- Allow event creators to manage join requests for their events
CREATE POLICY "Event creators can manage join requests" ON ludo_event_join_requests
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_join_requests.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
);

-- Allow users to create and view their own join requests
CREATE POLICY "Users can manage own join requests" ON ludo_event_join_requests
FOR ALL USING (user_id = auth.uid());

-- RLS Policies for ludo_event_invitations
-- Allow event creators to manage invitations for their events
CREATE POLICY "Event creators can manage invitations" ON ludo_event_invitations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_invitations.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
);

-- Allow users to view and respond to their own invitations
CREATE POLICY "Users can manage own invitations" ON ludo_event_invitations
FOR ALL USING (invitee_id = auth.uid() OR inviter_id = auth.uid());
