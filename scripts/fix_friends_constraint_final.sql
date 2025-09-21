-- Fix the friends_status_check constraint to allow proper status values
-- Drop existing constraint and recreate with correct values
ALTER TABLE friends DROP CONSTRAINT IF EXISTS friends_status_check;

-- Add new constraint that allows the status values our code uses
ALTER TABLE friends ADD CONSTRAINT friends_status_check 
CHECK (status IN ('active', 'blocked', 'pending'));

-- Update any existing rows that might have invalid status values
UPDATE friends SET status = 'active' WHERE status NOT IN ('active', 'blocked', 'pending');
