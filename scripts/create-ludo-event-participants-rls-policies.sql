-- Enable RLS on ludo_event_participants table
ALTER TABLE ludo_event_participants ENABLE ROW LEVEL SECURITY;

-- Policy: Allow event creators to manage participants for their events
CREATE POLICY "Event creators can manage participants" ON ludo_event_participants
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_participants.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
);

-- Policy: Allow users to view participants of events they can see
CREATE POLICY "Users can view event participants" ON ludo_event_participants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_participants.event_id 
    AND (
      ludo_events.is_public = true 
      OR ludo_events.creator_id = auth.uid()
      OR ludo_event_participants.user_id = auth.uid()
    )
  )
);

-- Policy: Allow users to manage their own participation
CREATE POLICY "Users can manage own participation" ON ludo_event_participants
FOR ALL USING (user_id = auth.uid());

-- Enable RLS on ludo_event_join_requests table
ALTER TABLE ludo_event_join_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow event creators to manage join requests for their events
CREATE POLICY "Event creators can manage join requests" ON ludo_event_join_requests
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_join_requests.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
);

-- Policy: Allow users to manage their own join requests
CREATE POLICY "Users can manage own join requests" ON ludo_event_join_requests
FOR ALL USING (user_id = auth.uid());
