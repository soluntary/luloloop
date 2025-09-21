-- Force remove the specific self friend request that's causing the issue
DELETE FROM friend_requests 
WHERE id = '404a943e-8589-4f6d-b40b-43c41e1b29d2';

-- Also remove any other self friend requests as a safety measure
DELETE FROM friend_requests 
WHERE from_user_id = to_user_id;

-- Add constraint to prevent future self friend requests
ALTER TABLE friend_requests 
ADD CONSTRAINT no_self_friend_requests 
CHECK (from_user_id != to_user_id);

-- Verify the deletion worked
SELECT COUNT(*) as remaining_self_requests 
FROM friend_requests 
WHERE from_user_id = to_user_id;
