-- Fix communities table to match current schema and constraints
-- Drop existing constraint if it exists
ALTER TABLE communities DROP CONSTRAINT IF EXISTS communities_type_check;

-- Add the correct constraint for type column
ALTER TABLE communities ADD CONSTRAINT communities_type_check 
  CHECK (type IN ('casual', 'competitive', 'family'));

-- Ensure the table structure matches what we expect
-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add games column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'games') THEN
    ALTER TABLE communities ADD COLUMN games TEXT[];
  END IF;
  
  -- Add next_meeting column if it doesn't exist  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'next_meeting') THEN
    ALTER TABLE communities ADD COLUMN next_meeting TEXT;
  END IF;
  
  -- Add active column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'active') THEN
    ALTER TABLE communities ADD COLUMN active BOOLEAN DEFAULT true;
  END IF;
END $$;
