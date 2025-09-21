-- Completely rebuilding the friendship system with proper RLS policies
-- Drop existing policies and recreate everything from scratch

-- Drop all existing policies for friend_requests and friends tables
DROP POLICY IF EXISTS "Users can view their own sent requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can view their own received requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can insert their own requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update their own requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can delete their own requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can view their friendships" ON friends;
DROP POLICY IF EXISTS "Users can insert their friendships" ON friends;
DROP POLICY IF EXISTS "Users can update their friendships" ON friends;
DROP POLICY IF EXISTS "Users can delete their friendships" ON friends;

-- Ensure RLS is enabled
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Friend Requests Policies
-- Users can view requests they sent or received
CREATE POLICY "Users can view their friend requests" ON friend_requests 
FOR SELECT USING (
  auth.uid() = from_user_id OR auth.uid() = to_user_id
);

-- Users can send friend requests (insert)
CREATE POLICY "Users can send friend requests" ON friend_requests 
FOR INSERT WITH CHECK (
  auth.uid() = from_user_id
);

-- Users can update requests they received (accept/reject)
CREATE POLICY "Users can update received requests" ON friend_requests 
FOR UPDATE USING (
  auth.uid() = to_user_id
);

-- Users can delete requests they sent
CREATE POLICY "Users can delete sent requests" ON friend_requests 
FOR DELETE USING (
  auth.uid() = from_user_id
);

-- Friends Policies
-- Users can view their friendships
CREATE POLICY "Users can view their friendships" ON friends 
FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);

-- System can insert friendships (when requests are accepted)
CREATE POLICY "System can create friendships" ON friends 
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR auth.uid() = friend_id
);

-- Users can update their friendships
CREATE POLICY "Users can update their friendships" ON friends 
FOR UPDATE USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);

-- Users can delete their friendships
CREATE POLICY "Users can delete their friendships" ON friends 
FOR DELETE USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);

-- Create some test data for debugging
-- First, let's insert some test friend requests
INSERT INTO friend_requests (id, from_user_id, to_user_id, message, status, created_at, updated_at)
VALUES 
  (gen_random_uuid(), '5792b81e-9d84-4fa2-aa61-9fbacb601118', '550e8400-e29b-41d4-a716-446655440007', 'Lass uns Freunde werden!', 'pending', NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440008', '5792b81e-9d84-4fa2-aa61-9fbacb601118', 'Hallo! Möchtest du befreundet sein?', 'pending', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create some test friendships
INSERT INTO friends (id, user_id, friend_id, status, created_at)
VALUES 
  (gen_random_uuid(), '5792b81e-9d84-4fa2-aa61-9fbacb601118', '550e8400-e29b-41d4-a716-446655440009', 'active', NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440009', '5792b81e-9d84-4fa2-aa61-9fbacb601118', 'active', NOW())
ON CONFLICT (id) DO NOTHING;
