-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can send friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can view their own friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update their own friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can view their friendships" ON friends;
DROP POLICY IF EXISTS "Users can create friendships" ON friends;
DROP POLICY IF EXISTS "Users can delete their friendships" ON friends;

-- Enable RLS on both tables
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Friend Requests Policies
CREATE POLICY "Users can send friend requests" ON friend_requests
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can view sent requests" ON friend_requests
    FOR SELECT USING (auth.uid() = from_user_id);

CREATE POLICY "Users can view received requests" ON friend_requests
    FOR SELECT USING (auth.uid() = to_user_id);

CREATE POLICY "Users can update received requests" ON friend_requests
    FOR UPDATE USING (auth.uid() = to_user_id);

-- Friends Policies
CREATE POLICY "Users can view their friendships" ON friends
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships" ON friends
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their friendships" ON friends
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Grant necessary permissions
GRANT ALL ON friend_requests TO authenticated;
GRANT ALL ON friends TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_friend_requests_from_user ON friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user ON friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
