-- Make event_date nullable and store all dates in instances
ALTER TABLE ludo_events 
ALTER COLUMN event_date DROP NOT NULL;

-- Add comment to clarify the new structure
COMMENT ON COLUMN ludo_events.event_date IS 'Legacy field - all dates now stored in ludo_event_instances';
