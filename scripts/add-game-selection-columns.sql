-- Add columns for storing selected games and custom games in ludo_events table
ALTER TABLE ludo_events 
ADD COLUMN selected_games JSONB DEFAULT '[]'::jsonb,
ADD COLUMN custom_games TEXT[] DEFAULT '{}';

-- Add comment to explain the new columns
COMMENT ON COLUMN ludo_events.selected_games IS 'JSON array of selected games from user library and friend requests';
COMMENT ON COLUMN ludo_events.custom_games IS 'Array of custom game names entered by user';
