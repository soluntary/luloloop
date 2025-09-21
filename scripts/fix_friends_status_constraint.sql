-- Check current constraint and fix friends table status values
-- The friends table status should allow 'active' for active friendships

-- First, let's see what the current constraint allows
-- Then update it to allow 'active' status

-- Drop the existing constraint if it exists
ALTER TABLE friends DROP CONSTRAINT IF EXISTS friends_status_check;

-- Add the correct constraint that allows 'active' status
ALTER TABLE friends ADD CONSTRAINT friends_status_check 
CHECK (status IN ('active', 'blocked', 'pending'));

-- Update any existing rows that might have incorrect status values
UPDATE friends SET status = 'active' WHERE status NOT IN ('active', 'blocked', 'pending');
