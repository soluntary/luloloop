-- Update existing regular events with proper interval data
-- This script adds interval_type data to existing regular events that don't have it

-- Update events with "Wöchentlich" in the title to weekly interval
UPDATE ludo_events 
SET interval_type = 'weekly', custom_interval = null
WHERE frequency = 'regular' 
AND (interval_type IS NULL OR interval_type = '')
AND (title ILIKE '%wöchentlich%' OR title ILIKE '%weekly%');

-- Update events with "Monatlich" in the title to monthly interval  
UPDATE ludo_events 
SET interval_type = 'monthly', custom_interval = null
WHERE frequency = 'regular' 
AND (interval_type IS NULL OR interval_type = '')
AND (title ILIKE '%monatlich%' OR title ILIKE '%monthly%');

-- Update events with "Täglich" in the title to daily interval
UPDATE ludo_events 
SET interval_type = 'daily', custom_interval = null
WHERE frequency = 'regular' 
AND (interval_type IS NULL OR interval_type = '')
AND (title ILIKE '%täglich%' OR title ILIKE '%daily%');

-- Update remaining regular events without specific interval to weekly (default)
UPDATE ludo_events 
SET interval_type = 'weekly', custom_interval = null
WHERE frequency = 'regular' 
AND (interval_type IS NULL OR interval_type = '');

-- Verify the updates
SELECT id, title, frequency, interval_type, custom_interval 
FROM ludo_events 
WHERE frequency = 'regular'
ORDER BY title;
