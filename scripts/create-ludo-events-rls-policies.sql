-- Enable RLS on ludo_events table
ALTER TABLE ludo_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all public events
CREATE POLICY "Users can view all ludo events" ON ludo_events
    FOR SELECT USING (true);

-- Policy: Authenticated users can insert their own events
CREATE POLICY "Users can create their own ludo events" ON ludo_events
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Policy: Users can update their own events
CREATE POLICY "Users can update their own ludo events" ON ludo_events
    FOR UPDATE USING (auth.uid() = creator_id);

-- Policy: Users can delete their own events
CREATE POLICY "Users can delete their own ludo events" ON ludo_events
    FOR DELETE USING (auth.uid() = creator_id);

-- Also ensure RLS policies exist for ludo_event_participants table
ALTER TABLE ludo_event_participants ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all participants
CREATE POLICY "Users can view ludo event participants" ON ludo_event_participants
    FOR SELECT USING (true);

-- Policy: Authenticated users can join events
CREATE POLICY "Users can join ludo events" ON ludo_event_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own participation status
CREATE POLICY "Users can update their own participation" ON ludo_event_participants
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can leave events they joined
CREATE POLICY "Users can leave ludo events" ON ludo_event_participants
    FOR DELETE USING (auth.uid() = user_id);
