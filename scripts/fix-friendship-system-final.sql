-- Final friendship system fix - Complete rewrite of RLS policies
-- This script ensures the friendship system works correctly

-- Disable RLS temporarily for cleanup
ALTER TABLE friend_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE friends DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view sent requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can view received requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update received requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can view their friendships" ON friends;
DROP POLICY IF EXISTS "Users can create friendships" ON friends;
DROP POLICY IF EXISTS "Users can update their friendships" ON friends;

-- Re-enable RLS
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Create simple, working RLS policies for friend_requests
CREATE POLICY "friend_requests_select" ON friend_requests
    FOR SELECT USING (
        from_user_id = auth.uid() OR to_user_id = auth.uid()
    );

CREATE POLICY "friend_requests_insert" ON friend_requests
    FOR INSERT WITH CHECK (
        from_user_id = auth.uid() AND from_user_id != to_user_id
    );

CREATE POLICY "friend_requests_update" ON friend_requests
    FOR UPDATE USING (
        to_user_id = auth.uid()
    );

-- Create simple, working RLS policies for friends
CREATE POLICY "friends_select" ON friends
    FOR SELECT USING (
        user_id = auth.uid() OR friend_id = auth.uid()
    );

CREATE POLICY "friends_insert" ON friends
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR friend_id = auth.uid()
    );

CREATE POLICY "friends_delete" ON friends
    FOR DELETE USING (
        user_id = auth.uid() OR friend_id = auth.uid()
    );

-- Grant necessary permissions
GRANT ALL ON friend_requests TO authenticated;
GRANT ALL ON friends TO authenticated;

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_friend_requests_from_user ON friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user ON friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);

-- Clean up any self-referencing friend requests
DELETE FROM friend_requests WHERE from_user_id = to_user_id;

-- Add constraint to prevent self-friend requests
ALTER TABLE friend_requests ADD CONSTRAINT no_self_requests CHECK (from_user_id != to_user_id);
