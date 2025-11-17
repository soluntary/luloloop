-- Update the search_ads type constraint to accept English values
-- This matches the pattern used in marketplace_offers (lend, trade, sell)

-- Drop the existing constraint
ALTER TABLE search_ads DROP CONSTRAINT IF EXISTS search_ads_type_check;

-- Add the new constraint with English values
ALTER TABLE search_ads ADD CONSTRAINT search_ads_type_check 
CHECK (type IN ('buy', 'rent', 'trade'));
