-- Fix events that should be single events but were incorrectly set to regular
-- Reset all events to single first, then only set specific ones to regular with intervals

-- Reset all events to single frequency and clear interval data
UPDATE ludo_events 
SET 
  frequency = 'single',
  interval_type = NULL,
  custom_interval = NULL
WHERE frequency = 'regular';

-- Only set specific events that should actually be regular events
-- You can identify these by their titles or other criteria
UPDATE ludo_events 
SET 
  frequency = 'regular',
  interval_type = 'weekly'
WHERE title LIKE '%regelmässig%' 
   OR title LIKE '%wöchentlich%'
   OR title LIKE '%Wöchentlicher%'
   OR title LIKE '%wiederholend%';

-- Set monthly events
UPDATE ludo_events 
SET 
  frequency = 'regular',
  interval_type = 'monthly'
WHERE title LIKE '%monatlich%' 
   OR title LIKE '%Monatlicher%';

-- Set daily events  
UPDATE ludo_events 
SET 
  frequency = 'regular',
  interval_type = 'daily'
WHERE title LIKE '%täglich%' 
   OR title LIKE '%Täglicher%';
