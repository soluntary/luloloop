-- Fix the friends table status constraint to allow proper values
-- This script will drop the existing constraint and create a new one with correct values

-- First, drop the existing constraint that's causing issues
ALTER TABLE friends DROP CONSTRAINT IF EXISTS friends_status_check;

-- Create a new constraint that allows the status values we need
ALTER TABLE friends ADD CONSTRAINT friends_status_check 
CHECK (status IN ('active', 'pending', 'blocked', 'accepted'));

-- Verify the constraint was created
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'friends'::regclass 
AND conname = 'friends_status_check';
