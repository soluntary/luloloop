-- Update age field to new format "Ab X Jahren"
-- This script converts various existing age formats to the standardized format

-- First, let's see what formats exist (for reference)
-- SELECT DISTINCT age FROM games WHERE age IS NOT NULL;

-- Update patterns like "8+" or "8 +" to "Ab 8 Jahren"
UPDATE games
SET age = 'Ab ' || regexp_replace(age, '\s*\+.*', '', 'g') || ' Jahren'
WHERE age ~ '^\d+\s*\+';

-- Update patterns like "ab 8" or "Ab 8" (without "Jahren") to "Ab 8 Jahren"
UPDATE games
SET age = 'Ab ' || regexp_replace(age, '^[Aa]b\s*', '', 'g') || ' Jahren'
WHERE age ~* '^ab\s*\d+$';

-- Update patterns like "8 Jahre" or "8 Jahren" to "Ab 8 Jahren"
UPDATE games
SET age = 'Ab ' || regexp_replace(age, '\s*[Jj]ahr.*', '', 'g') || ' Jahren'
WHERE age ~ '^\d+\s*[Jj]ahr' AND age !~* '^ab';

-- Update patterns like "8 - 12" or "8-12" or "8 bis 12" to "Ab 8 Jahren" (take minimum age)
UPDATE games
SET age = 'Ab ' || regexp_replace(age, '\s*[-–bis].*', '', 'g') || ' Jahren'
WHERE age ~ '^\d+\s*[-–]' OR age ~* '^\d+\s*bis';

-- Update standalone numbers like "8" to "Ab 8 Jahren"
UPDATE games
SET age = 'Ab ' || age || ' Jahren'
WHERE age ~ '^\d+$';

-- Clean up any double spaces
UPDATE games
SET age = regexp_replace(age, '\s+', ' ', 'g')
WHERE age LIKE '%  %';

-- Verify the updates
SELECT DISTINCT age, COUNT(*) as count 
FROM games 
WHERE age IS NOT NULL 
GROUP BY age 
ORDER BY age;
