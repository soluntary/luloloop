-- Check the constraint definition for search_ads type column
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'search_ads'::regclass
AND conname = 'search_ads_type_check';

-- Drop the old constraint if it exists
ALTER TABLE search_ads DROP CONSTRAINT IF EXISTS search_ads_type_check;

-- Add the correct constraint with German values
ALTER TABLE search_ads ADD CONSTRAINT search_ads_type_check 
  CHECK (type IN ('kaufen', 'mieten', 'tauschen'));
