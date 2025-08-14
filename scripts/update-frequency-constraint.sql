-- Check current constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'community_events_frequency_check';

-- Drop the existing constraint
ALTER TABLE community_events DROP CONSTRAINT IF EXISTS community_events_frequency_check;

-- Add updated constraint with all three frequency options
ALTER TABLE community_events ADD CONSTRAINT community_events_frequency_check 
CHECK (frequency IN ('einmalig', 'regelmäßig', 'wiederholend'));
