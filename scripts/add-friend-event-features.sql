-- Add selected_friends column to ludo_events if it doesn't exist
ALTER TABLE ludo_events 
ADD COLUMN IF NOT EXISTS selected_friends uuid[] DEFAULT '{}';

-- Update visibility column to have proper constraints
ALTER TABLE ludo_events 
ALTER COLUMN visibility SET DEFAULT 'public';

-- Add check constraint for visibility values
ALTER TABLE ludo_events 
ADD CONSTRAINT check_visibility_values 
CHECK (visibility IN ('public', 'friends_only', 'private'));

-- Ensure ludo_event_invitations table has all needed columns
-- (This table already exists with the right structure)

-- Create index for better performance on friend events
CREATE INDEX IF NOT EXISTS idx_ludo_events_visibility ON ludo_events(visibility);
CREATE INDEX IF NOT EXISTS idx_ludo_events_selected_friends ON ludo_events USING GIN(selected_friends);
CREATE INDEX IF NOT EXISTS idx_ludo_event_invitations_event_invitee ON ludo_event_invitations(event_id, invitee_id);
