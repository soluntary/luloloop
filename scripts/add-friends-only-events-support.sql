-- Add visibility column to ludo_events if it doesn't exist
ALTER TABLE ludo_events 
ADD COLUMN IF NOT EXISTS visibility character varying DEFAULT 'public';

-- Add selected_friends column to ludo_events if it doesn't exist  
ALTER TABLE ludo_events 
ADD COLUMN IF NOT EXISTS selected_friends uuid[] DEFAULT '{}';

-- Update existing events to have public visibility
UPDATE ludo_events 
SET visibility = 'public' 
WHERE visibility IS NULL;

-- Create index for better performance on visibility queries
CREATE INDEX IF NOT EXISTS idx_ludo_events_visibility ON ludo_events(visibility);
CREATE INDEX IF NOT EXISTS idx_ludo_events_creator_visibility ON ludo_events(creator_id, visibility);
