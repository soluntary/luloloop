-- Fix the friends table status constraint to allow proper values
-- This will allow the friendship system to work correctly

-- First, drop the existing constraint if it exists
ALTER TABLE friends DROP CONSTRAINT IF EXISTS friends_status_check;

-- Add the correct constraint that allows the status values used by the application
ALTER TABLE friends ADD CONSTRAINT friends_status_check 
CHECK (status IN ('active', 'pending', 'blocked', 'accepted'));

-- Update any existing records that might have invalid status values
UPDATE friends SET status = 'active' WHERE status NOT IN ('active', 'pending', 'blocked', 'accepted');

-- Verify the constraint is working
SELECT DISTINCT status FROM friends;
