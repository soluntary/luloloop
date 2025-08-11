-- Create community_events table
CREATE TABLE IF NOT EXISTS community_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    frequency VARCHAR(50) NOT NULL CHECK (frequency IN ('einmalig', 'regelmäßig')),
    fixed_date DATE,
    fixed_time_from TIME,
    fixed_time_to TIME,
    location VARCHAR(500) NOT NULL,
    max_participants INTEGER,
    visibility VARCHAR(20) NOT NULL CHECK (visibility IN ('public', 'friends')),
    approval_mode VARCHAR(20) DEFAULT 'automatic' CHECK (approval_mode IN ('automatic', 'manual')),
    rules TEXT,
    additional_info TEXT,
    image_url VARCHAR(1000),
    selected_games JSONB DEFAULT '[]'::jsonb,
    custom_games TEXT[] DEFAULT '{}',
    selected_friends UUID[] DEFAULT '{}',
    time_slots JSONB DEFAULT '[]'::jsonb,
    use_time_slots BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create time_slots table for better normalization (optional, keeping JSONB for simplicity)
CREATE TABLE IF NOT EXISTS community_event_time_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES community_events(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    time_from TIME NOT NULL,
    time_to TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community_event_participants table
CREATE TABLE IF NOT EXISTS community_event_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES community_events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'joined')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_events_creator_id ON community_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_community_events_visibility ON community_events(visibility);
CREATE INDEX IF NOT EXISTS idx_community_events_active ON community_events(active);
CREATE INDEX IF NOT EXISTS idx_community_events_created_at ON community_events(created_at);
CREATE INDEX IF NOT EXISTS idx_community_event_participants_event_id ON community_event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_community_event_participants_user_id ON community_event_participants(user_id);

-- Add RLS policies
ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_event_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_event_participants ENABLE ROW LEVEL SECURITY;

-- Community events policies
CREATE POLICY "Users can view public community events" ON community_events
    FOR SELECT USING (visibility = 'public' OR creator_id = auth.uid());

CREATE POLICY "Users can view friend community events if they are friends" ON community_events
    FOR SELECT USING (
        visibility = 'friends' AND (
            creator_id = auth.uid() OR
            auth.uid() = ANY(selected_friends) OR
            EXISTS (
                SELECT 1 FROM friends 
                WHERE (user_id = auth.uid() AND friend_id = creator_id AND status = 'accepted')
                   OR (user_id = creator_id AND friend_id = auth.uid() AND status = 'accepted')
            )
        )
    );

CREATE POLICY "Users can create their own community events" ON community_events
    FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update their own community events" ON community_events
    FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Users can delete their own community events" ON community_events
    FOR DELETE USING (creator_id = auth.uid());

-- Time slots policies
CREATE POLICY "Users can view time slots for events they can see" ON community_event_time_slots
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

CREATE POLICY "Users can manage time slots for their own events" ON community_event_time_slots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM community_events 
            WHERE id = event_id AND creator_id = auth.uid()
        )
    );

-- Participants policies
CREATE POLICY "Users can view participants for events they can see" ON community_event_participants
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

CREATE POLICY "Users can join events" ON community_event_participants
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Event creators can manage participants" ON community_event_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM community_events 
            WHERE id = event_id AND creator_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own participation" ON community_event_participants
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can leave events" ON community_event_participants
    FOR DELETE USING (user_id = auth.uid());
