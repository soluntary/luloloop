-- Create comprehensive fix for all ludo-events issues
-- Fix RLS policies for ludo_events table
ALTER TABLE ludo_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view public ludo events" ON ludo_events;
DROP POLICY IF EXISTS "Users can create their own ludo events" ON ludo_events;
DROP POLICY IF EXISTS "Users can update their own ludo events" ON ludo_events;
DROP POLICY IF EXISTS "Users can delete their own ludo events" ON ludo_events;

-- Create proper RLS policies
CREATE POLICY "Users can view public ludo events" ON ludo_events
    FOR SELECT USING (is_public = true OR auth.uid() = creator_id);

CREATE POLICY "Users can create their own ludo events" ON ludo_events
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own ludo events" ON ludo_events
    FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own ludo events" ON ludo_events
    FOR DELETE USING (auth.uid() = creator_id);

-- Fix RLS policies for ludo_event_participants table
ALTER TABLE ludo_event_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view event participants" ON ludo_event_participants;
DROP POLICY IF EXISTS "Users can join events" ON ludo_event_participants;
DROP POLICY IF EXISTS "Users can leave events" ON ludo_event_participants;

-- Create proper RLS policies for participants
CREATE POLICY "Users can view event participants" ON ludo_event_participants
    FOR SELECT USING (true); -- Anyone can see who's participating

CREATE POLICY "Users can join events" ON ludo_event_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave events" ON ludo_event_participants
    FOR DELETE USING (auth.uid() = user_id);

-- Ensure is_public column has proper default
ALTER TABLE ludo_events ALTER COLUMN is_public SET DEFAULT true;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ludo_events_public ON ludo_events(is_public);
CREATE INDEX IF NOT EXISTS idx_ludo_events_creator ON ludo_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_ludo_events_date ON ludo_events(event_date);
CREATE INDEX IF NOT EXISTS idx_ludo_event_participants_event ON ludo_event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_ludo_event_participants_user ON ludo_event_participants(user_id);
