-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update their own friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can view their own friends" ON friends;
DROP POLICY IF EXISTS "Users can insert their own friends" ON friends;
DROP POLICY IF EXISTS "Users can delete their own friends" ON friends;

-- Enable RLS on both tables
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Friend requests policies
-- Allow users to view friend requests they sent or received
CREATE POLICY "Users can view their friend requests" ON friend_requests
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Allow users to send friend requests (insert)
CREATE POLICY "Users can send friend requests" ON friend_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Allow users to update friend requests they received (accept/decline)
CREATE POLICY "Users can update received friend requests" ON friend_requests
  FOR UPDATE USING (auth.uid() = to_user_id);

-- Allow users to delete friend requests they sent
CREATE POLICY "Users can delete sent friend requests" ON friend_requests
  FOR DELETE USING (auth.uid() = from_user_id);

-- Friends policies
-- Allow users to view their friendships
CREATE POLICY "Users can view their friends" ON friends
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Allow users to insert friendships (when accepting requests)
CREATE POLICY "Users can create friendships" ON friends
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

-- Allow users to delete their friendships
CREATE POLICY "Users can delete friendships" ON friends
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);
