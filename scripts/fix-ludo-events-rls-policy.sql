-- Enable RLS on ludo_events table
ALTER TABLE ludo_events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert their own events
CREATE POLICY "Users can insert their own ludo events" ON ludo_events
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Create policy to allow all authenticated users to read public events
CREATE POLICY "Users can read public ludo events" ON ludo_events
    FOR SELECT USING (is_public = true OR auth.uid() = creator_id);

-- Create policy to allow users to update their own events
CREATE POLICY "Users can update their own ludo events" ON ludo_events
    FOR UPDATE USING (auth.uid() = creator_id);

-- Create policy to allow users to delete their own events
CREATE POLICY "Users can delete their own ludo events" ON ludo_events
    FOR DELETE USING (auth.uid() = creator_id);
