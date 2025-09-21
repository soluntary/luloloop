-- Run the RLS policy fix to resolve infinite recursion
-- This script removes circular references in RLS policies

-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view public events and own events" ON ludo_events;
DROP POLICY IF EXISTS "Users can view participants of accessible events" ON ludo_event_participants;
DROP POLICY IF EXISTS "Event creators can manage participants" ON ludo_event_participants;
DROP POLICY IF EXISTS "Users can manage own participation" ON ludo_event_participants;

-- Create simplified ludo_events policy without circular reference
CREATE POLICY "ludo_events_select_simple" ON ludo_events
FOR SELECT USING (
  visibility = 'public' OR 
  creator_id = auth.uid()
);

-- Create simplified ludo_event_participants policies without circular reference
CREATE POLICY "ludo_event_participants_select_simple" ON ludo_event_participants
FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_participants.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
);

CREATE POLICY "ludo_event_participants_insert_simple" ON ludo_event_participants
FOR INSERT WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_participants.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
);

CREATE POLICY "ludo_event_participants_update_simple" ON ludo_event_participants
FOR UPDATE USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_participants.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
);

CREATE POLICY "ludo_event_participants_delete_simple" ON ludo_event_participants
FOR DELETE USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_participants.event_id 
    AND ludo_events.creator_id = auth.uid()
  )
);
