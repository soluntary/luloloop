-- Enable RLS on all ludo event tables
ALTER TABLE ludo_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ludo_event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ludo_event_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ludo_event_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ludo_events table
-- Allow users to view public events and their own events
CREATE POLICY "Users can view public events and own events" ON ludo_events
    FOR SELECT USING (
        visibility = 'public' OR 
        creator_id = auth.uid() OR
        id IN (
            SELECT event_id FROM ludo_event_participants WHERE user_id = auth.uid()
        )
    );

-- Allow users to create their own events
CREATE POLICY "Users can create events" ON ludo_events
    FOR INSERT WITH CHECK (creator_id = auth.uid());

-- Allow event creators to update their own events
CREATE POLICY "Event creators can update own events" ON ludo_events
    FOR UPDATE USING (creator_id = auth.uid());

-- Allow event creators to delete their own events
CREATE POLICY "Event creators can delete own events" ON ludo_events
    FOR DELETE USING (creator_id = auth.uid());

-- RLS Policies for ludo_event_participants table
-- Allow users to view participants of events they can see
CREATE POLICY "Users can view participants of accessible events" ON ludo_event_participants
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM ludo_events WHERE 
                visibility = 'public' OR 
                creator_id = auth.uid() OR
                id IN (SELECT event_id FROM ludo_event_participants WHERE user_id = auth.uid())
        )
    );

-- Allow event creators to manage participants for their events
CREATE POLICY "Event creators can manage participants" ON ludo_event_participants
    FOR ALL USING (
        event_id IN (SELECT id FROM ludo_events WHERE creator_id = auth.uid())
    );

-- Allow users to manage their own participation
CREATE POLICY "Users can manage own participation" ON ludo_event_participants
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for ludo_event_join_requests table
-- Allow users to view join requests for events they can manage or their own requests
CREATE POLICY "Users can view relevant join requests" ON ludo_event_join_requests
    FOR SELECT USING (
        user_id = auth.uid() OR
        event_id IN (SELECT id FROM ludo_events WHERE creator_id = auth.uid())
    );

-- Allow users to create join requests for events
CREATE POLICY "Users can create join requests" ON ludo_event_join_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Allow event creators to update join requests for their events
CREATE POLICY "Event creators can manage join requests" ON ludo_event_join_requests
    FOR UPDATE USING (
        event_id IN (SELECT id FROM ludo_events WHERE creator_id = auth.uid())
    );

-- Allow users to update their own join requests
CREATE POLICY "Users can update own join requests" ON ludo_event_join_requests
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for ludo_event_invitations table
-- Allow users to view invitations they sent or received
CREATE POLICY "Users can view relevant invitations" ON ludo_event_invitations
    FOR SELECT USING (
        inviter_id = auth.uid() OR 
        invitee_id = auth.uid()
    );

-- Allow event creators to create invitations for their events
CREATE POLICY "Event creators can create invitations" ON ludo_event_invitations
    FOR INSERT WITH CHECK (
        inviter_id = auth.uid() AND
        event_id IN (SELECT id FROM ludo_events WHERE creator_id = auth.uid())
    );

-- Allow users to update invitations they received
CREATE POLICY "Users can update received invitations" ON ludo_event_invitations
    FOR UPDATE USING (invitee_id = auth.uid());

-- Allow inviters to update their sent invitations
CREATE POLICY "Users can update sent invitations" ON ludo_event_invitations
    FOR UPDATE USING (inviter_id = auth.uid());
