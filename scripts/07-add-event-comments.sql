-- Create community_event_comments table for event discussions
CREATE TABLE IF NOT EXISTS community_event_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES community_events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_event_comments_event_id ON community_event_comments(event_id);
CREATE INDEX IF NOT EXISTS idx_community_event_comments_user_id ON community_event_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_event_comments_created_at ON community_event_comments(created_at);

-- Add RLS policies
ALTER TABLE community_event_comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments for events they can see
CREATE POLICY "Users can view comments for accessible events" ON community_event_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM community_events 
            WHERE id = event_id AND (
                visibility = 'public' OR 
                creator_id = auth.uid() OR
                (visibility = 'friends' AND (
                    auth.uid() = ANY(selected_friends) OR
                    EXISTS (
                        SELECT 1 FROM friends 
                        WHERE (user_id = auth.uid() AND friend_id = creator_id AND status = 'accepted')
                           OR (user_id = creator_id AND friend_id = auth.uid() AND status = 'accepted')
                    )
                ))
            )
        )
    );

-- Users can add comments to events they can participate in
CREATE POLICY "Users can comment on accessible events" ON community_event_comments
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM community_events 
            WHERE id = event_id AND (
                visibility = 'public' OR 
                creator_id = auth.uid() OR
                (visibility = 'friends' AND (
                    auth.uid() = ANY(selected_friends) OR
                    EXISTS (
                        SELECT 1 FROM friends 
                        WHERE (user_id = auth.uid() AND friend_id = creator_id AND status = 'accepted')
                           OR (user_id = creator_id AND friend_id = auth.uid() AND status = 'accepted')
                    )
                ))
            )
        )
    );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" ON community_event_comments
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own comments, event creators can delete any comment on their events
CREATE POLICY "Users can delete their own comments or event creators can delete any" ON community_event_comments
    FOR DELETE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM community_events 
            WHERE id = event_id AND creator_id = auth.uid()
        )
    );
