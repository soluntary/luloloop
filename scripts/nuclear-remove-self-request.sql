-- Nuclear option: Remove the specific problematic self friend request
-- and add bulletproof constraints

-- Remove the specific problematic request
DELETE FROM friend_requests 
WHERE id = '404a943e-8589-4f6d-b40b-43c41e1b29d2';

-- Remove ALL self friend requests (where from_user_id = to_user_id)
DELETE FROM friend_requests 
WHERE from_user_id = to_user_id;

-- Add constraint to prevent self friend requests
ALTER TABLE friend_requests 
DROP CONSTRAINT IF EXISTS no_self_friend_requests;

ALTER TABLE friend_requests 
ADD CONSTRAINT no_self_friend_requests 
CHECK (from_user_id != to_user_id);

-- Verify the result
SELECT COUNT(*) as remaining_self_requests 
FROM friend_requests 
WHERE from_user_id = to_user_id;

-- Show all remaining friend requests for debugging
SELECT id, from_user_id, to_user_id, status, created_at 
FROM friend_requests 
ORDER BY created_at DESC;
