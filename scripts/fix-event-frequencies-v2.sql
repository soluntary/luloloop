-- Updated script to normalize all frequency values in ludo_events table
-- Fix inconsistent frequency values in ludo_events table
-- Convert all variations to the three standard values: single, regular, recurring

-- First, let's see what frequency values currently exist
-- SELECT DISTINCT frequency FROM ludo_events;

-- Update all frequency values to match the form options
UPDATE ludo_events 
SET frequency = CASE 
    WHEN frequency IN ('wöchentlich', 'weekly', 'regelmäßig', 'regelmässig') THEN 'regular'
    WHEN frequency IN ('einmalig', 'once', 'one-time', 'single-time') THEN 'single'  
    WHEN frequency IN ('wiederholend', 'repeating', 'recurring', 'wiederkehrend') THEN 'recurring'
    WHEN frequency = 'regular' THEN 'regular'  -- keep existing correct values
    WHEN frequency = 'single' THEN 'single'   -- keep existing correct values
    WHEN frequency = 'recurring' THEN 'recurring' -- keep existing correct values
    ELSE 'single' -- default fallback for any other values
END
WHERE frequency IS NOT NULL;

-- Verify the changes
SELECT frequency, COUNT(*) as count 
FROM ludo_events 
GROUP BY frequency 
ORDER BY frequency;
