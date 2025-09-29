-- Enhance ludo_events table for comprehensive event creation form
-- Add missing columns for rich text, frequency, visibility, and additional features

-- Add new columns for enhanced event creation
ALTER TABLE ludo_events 
ADD COLUMN IF NOT EXISTS frequency VARCHAR(20) DEFAULT 'single' CHECK (frequency IN ('single', 'regular', 'recurring')),
ADD COLUMN IF NOT EXISTS interval_type VARCHAR(20) CHECK (interval_type IN ('weekly', 'biweekly', 'monthly', 'other')),
ADD COLUMN IF NOT EXISTS custom_interval TEXT,
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'friends_only', 'private')),
ADD COLUMN IF NOT EXISTS approval_mode VARCHAR(20) DEFAULT 'automatic' CHECK (approval_mode IN ('automatic', 'manual')),
ADD COLUMN IF NOT EXISTS organizer_only BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS additional_notes TEXT,
ADD COLUMN IF NOT EXISTS location_type VARCHAR(20) DEFAULT 'local' CHECK (location_type IN ('local', 'virtual')),
ADD COLUMN IF NOT EXISTS virtual_link TEXT,
ADD COLUMN IF NOT EXISTS rich_description JSONB DEFAULT '{}'::jsonb;

-- Update existing columns to support new requirements
ALTER TABLE ludo_events 
ALTER COLUMN max_players DROP NOT NULL,
ALTER COLUMN max_players DROP DEFAULT,
ADD CONSTRAINT max_players_check CHECK (max_players IS NULL OR (max_players >= 1 AND max_players <= 50));

-- Add comments for new columns
COMMENT ON COLUMN ludo_events.frequency IS 'Event frequency: single, regular (recurring with pattern), or recurring (multiple specific dates)';
COMMENT ON COLUMN ludo_events.interval_type IS 'For regular events: weekly, biweekly, monthly, or other';
COMMENT ON COLUMN ludo_events.custom_interval IS 'Custom interval description when interval_type is other';
COMMENT ON COLUMN ludo_events.visibility IS 'Event visibility: public, friends_only, or private';
COMMENT ON COLUMN ludo_events.approval_mode IS 'Participation approval: automatic or manual';
COMMENT ON COLUMN ludo_events.organizer_only IS 'Whether organizer counts as participant';
COMMENT ON COLUMN ludo_events.additional_notes IS 'Additional notes and hints for participants';
COMMENT ON COLUMN ludo_events.location_type IS 'Location type: local (physical) or virtual (online)';
COMMENT ON COLUMN ludo_events.virtual_link IS 'Virtual meeting link for online events';
COMMENT ON COLUMN ludo_events.rich_description IS 'Rich text description with formatting (JSON format)';
COMMENT ON COLUMN ludo_events.max_players IS 'Maximum participants (NULL for unlimited)';

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_ludo_events_frequency ON ludo_events(frequency);
CREATE INDEX IF NOT EXISTS idx_ludo_events_visibility ON ludo_events(visibility);
CREATE INDEX IF NOT EXISTS idx_ludo_events_approval_mode ON ludo_events(approval_mode);

-- Update RLS policies to handle new visibility options
DROP POLICY IF EXISTS "Users can view public ludo events" ON ludo_events;
CREATE POLICY "Users can view accessible ludo events" ON ludo_events
  FOR SELECT USING (
    visibility = 'public' 
    OR creator_id = auth.uid()
    OR (visibility = 'friends_only' AND EXISTS (
      SELECT 1 FROM friends 
      WHERE (user_id = auth.uid() AND friend_id = creator_id AND status = 'accepted')
      OR (user_id = creator_id AND friend_id = auth.uid() AND status = 'accepted')
    ))
  );

-- Add sample data with new features
INSERT INTO ludo_events (
  title, 
  description, 
  creator_id, 
  max_players, 
  game_type, 
  difficulty_level, 
  event_date, 
  start_time, 
  location, 
  frequency,
  visibility,
  approval_mode,
  location_type,
  additional_notes
) VALUES 
  (
    'Weekly Ludo Night', 
    'Join us every week for fun Ludo games!', 
    (SELECT id FROM auth.users LIMIT 1), 
    6, 
    'casual', 
    'beginner', 
    CURRENT_DATE + INTERVAL '7 days', 
    '19:00:00', 
    'Community Center Room A', 
    'regular',
    'public',
    'automatic',
    'local',
    'Bring your own snacks! We provide drinks.'
  ),
  (
    'Friends Only Tournament', 
    'Private tournament for close friends', 
    (SELECT id FROM auth.users LIMIT 1), 
    NULL, -- Unlimited participants
    'tournament', 
    'advanced', 
    CURRENT_DATE + INTERVAL '14 days', 
    '18:00:00', 
    NULL, 
    'single',
    'friends_only',
    'manual',
    'virtual',
    'Invitation only - check Discord for meeting link'
  )
ON CONFLICT DO NOTHING;
