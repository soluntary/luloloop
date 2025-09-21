-- Fix Row Level Security policies for friend_requests table
-- This allows users to send friend requests and view their own requests

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can send friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can view their own sent requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can view their own received requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update their own received requests" ON friend_requests;

-- Enable RLS on friend_requests table
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can send friend requests (insert)
CREATE POLICY "Users can send friend requests" ON friend_requests
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Policy: Users can view friend requests they sent
CREATE POLICY "Users can view their own sent requests" ON friend_requests
    FOR SELECT USING (auth.uid() = from_user_id);

-- Policy: Users can view friend requests they received
CREATE POLICY "Users can view their own received requests" ON friend_requests
    FOR SELECT USING (auth.uid() = to_user_id);

-- Policy: Users can update friend requests they received (accept/decline)
CREATE POLICY "Users can update their own received requests" ON friend_requests
    FOR UPDATE USING (auth.uid() = to_user_id);

-- Also ensure the friends table has proper RLS policies
DROP POLICY IF EXISTS "Users can view their friendships" ON friends;
DROP POLICY IF EXISTS "Users can create friendships" ON friends;

-- Enable RLS on friends table
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own friendships
CREATE POLICY "Users can view their friendships" ON friends
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Policy: Users can create friendships (when accepting friend requests)
CREATE POLICY "Users can create friendships" ON friends
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);
