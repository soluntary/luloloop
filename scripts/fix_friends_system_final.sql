-- Fix the friends table constraint to allow proper status values
ALTER TABLE friends DROP CONSTRAINT IF EXISTS friends_status_check;

-- Add new constraint that allows the status values we need
ALTER TABLE friends ADD CONSTRAINT friends_status_check 
CHECK (status IN ('pending', 'accepted', 'active', 'blocked'));

-- Update any existing rows to use 'active' status (the standard for confirmed friendships)
UPDATE friends SET status = 'active' WHERE status NOT IN ('pending', 'accepted', 'active', 'blocked');

-- Also ensure we have proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);
