-- Fix the type constraint for search_ads table to accept the correct German values
-- that the form is sending: 'tauschen', 'mieten', 'kaufen'

-- First, drop the existing constraint if it exists
ALTER TABLE search_ads DROP CONSTRAINT IF EXISTS search_ads_type_check;

-- Add the correct constraint that matches the form values
ALTER TABLE search_ads 
ADD CONSTRAINT search_ads_type_check 
CHECK (type IN ('tauschen', 'mieten', 'kaufen'));
