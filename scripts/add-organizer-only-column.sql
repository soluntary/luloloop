-- Add organizer_only column to ludo_events table
ALTER TABLE ludo_events 
ADD COLUMN organizer_only BOOLEAN DEFAULT FALSE;

-- Add comment to explain the column
COMMENT ON COLUMN ludo_events.organizer_only IS 'When true, the event creator is not automatically added as a participant';
