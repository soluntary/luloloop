-- Drop the event_date column from ludo_events table
-- All dates are now stored in ludo_event_instances

ALTER TABLE ludo_events DROP COLUMN IF EXISTS event_date;
