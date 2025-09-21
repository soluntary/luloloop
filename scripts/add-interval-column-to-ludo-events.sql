-- Add interval column to ludo_events table to properly store recurring event intervals
ALTER TABLE ludo_events 
ADD COLUMN IF NOT EXISTS interval_type character varying,
ADD COLUMN IF NOT EXISTS custom_interval text;

-- Update existing events that have combined frequency data
-- Extract interval information from existing frequency values
UPDATE ludo_events 
SET 
  interval_type = CASE 
    WHEN frequency LIKE '%weekly' THEN 'weekly'
    WHEN frequency LIKE '%biweekly' THEN 'biweekly' 
    WHEN frequency LIKE '%monthly' THEN 'monthly'
    WHEN frequency LIKE 'regular-%' AND frequency NOT LIKE '%weekly' AND frequency NOT LIKE '%biweekly' AND frequency NOT LIKE '%monthly' THEN 'other'
    ELSE NULL
  END,
  custom_interval = CASE 
    WHEN frequency LIKE 'regular-%' AND frequency NOT LIKE '%weekly' AND frequency NOT LIKE '%biweekly' AND frequency NOT LIKE '%monthly' 
    THEN SUBSTRING(frequency FROM 9) -- Extract text after 'regular-'
    ELSE NULL
  END,
  frequency = CASE 
    WHEN frequency LIKE 'regular-%' THEN 'regular'
    ELSE frequency
  END
WHERE frequency IS NOT NULL;
