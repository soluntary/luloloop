-- Create ludo_events table for dedicated Ludo event management
-- This is separate from community_events to avoid RLS policy conflicts

CREATE TABLE IF NOT EXISTS ludo_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Ludo-specific fields
  max_players INTEGER NOT NULL DEFAULT 4 CHECK (max_players >= 2 AND max_players <= 8),
  game_type VARCHAR(50) DEFAULT 'classic' CHECK (game_type IN ('classic', 'team', 'tournament', 'casual')),
  difficulty_level VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  
  -- Date and time
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  
  -- Location
  location VARCHAR(255),
  is_online BOOLEAN DEFAULT false,
  online_platform VARCHAR(100), -- Discord, Zoom, etc.
  
  -- Event settings
  is_public BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  
  -- Additional info
  prize_info TEXT,
  rules TEXT,
  image_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ludo_event_participants table for tracking participants
CREATE TABLE IF NOT EXISTS ludo_event_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES ludo_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'pending', 'approved', 'declined', 'cancelled')),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(event_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ludo_events_creator_id ON ludo_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_ludo_events_event_date ON ludo_events(event_date);
CREATE INDEX IF NOT EXISTS idx_ludo_events_is_public ON ludo_events(is_public);
CREATE INDEX IF NOT EXISTS idx_ludo_event_participants_event_id ON ludo_event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_ludo_event_participants_user_id ON ludo_event_participants(user_id);

-- Enable Row Level Security
ALTER TABLE ludo_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ludo_event_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ludo_events
CREATE POLICY "Users can view public ludo events" ON ludo_events
  FOR SELECT USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can create ludo events" ON ludo_events
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update their own ludo events" ON ludo_events
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Users can delete their own ludo events" ON ludo_events
  FOR DELETE USING (creator_id = auth.uid());

-- RLS Policies for ludo_event_participants
CREATE POLICY "Users can view participants of public events" ON ludo_event_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ludo_events 
      WHERE ludo_events.id = ludo_event_participants.event_id 
      AND (ludo_events.is_public = true OR ludo_events.creator_id = auth.uid())
    )
  );

CREATE POLICY "Users can register for events" ON ludo_event_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation" ON ludo_event_participants
  FOR UPDATE USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_participants.event_id 
    AND ludo_events.creator_id = auth.uid()
  ));

CREATE POLICY "Users can cancel their participation or event creators can manage" ON ludo_event_participants
  FOR DELETE USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE ludo_events.id = ludo_event_participants.event_id 
    AND ludo_events.creator_id = auth.uid()
  ));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ludo_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ludo_events_updated_at
  BEFORE UPDATE ON ludo_events
  FOR EACH ROW
  EXECUTE FUNCTION update_ludo_events_updated_at();

-- Insert sample data for testing
INSERT INTO ludo_events (title, description, creator_id, max_players, game_type, difficulty_level, event_date, start_time, location, is_public)
VALUES 
  ('Ludo Championship 2024', 'Join our exciting Ludo championship with prizes!', (SELECT id FROM auth.users LIMIT 1), 4, 'tournament', 'intermediate', CURRENT_DATE + INTERVAL '7 days', '19:00:00', 'Community Center', true),
  ('Casual Ludo Evening', 'Relaxed Ludo games for beginners', (SELECT id FROM auth.users LIMIT 1), 6, 'casual', 'beginner', CURRENT_DATE + INTERVAL '3 days', '18:30:00', 'Local Café', true)
ON CONFLICT DO NOTHING;
