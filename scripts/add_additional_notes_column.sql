-- Add additional_notes column to ludo_events table
ALTER TABLE ludo_events 
ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN ludo_events.additional_notes IS 'Additional information and notes about the event (Zusatzinfos & Hinweise)';
