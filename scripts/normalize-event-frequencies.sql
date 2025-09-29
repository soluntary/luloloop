-- Normalize inconsistent frequency values in events table
-- Convert old frequency values to match the current form options

-- Update "wöchentlich" to "regular" (Regelmässig)
UPDATE events 
SET frequency = 'regular' 
WHERE frequency = 'wöchentlich';

-- Update "einmalig" to "single" (Einmalig)
UPDATE events 
SET frequency = 'single' 
WHERE frequency = 'einmalig';

-- Update any other non-standard values to "single" as default
UPDATE events 
SET frequency = 'single' 
WHERE frequency NOT IN ('single', 'regular', 'recurring');

-- Verify the cleanup
SELECT frequency, COUNT(*) as count 
FROM events 
GROUP BY frequency 
ORDER BY frequency;
