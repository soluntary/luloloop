-- Remove the specific self friend request that's causing the issue
DELETE FROM friend_requests 
WHERE id = '404a943e-8589-4f6d-b40b-43c41e1b29d2'
AND from_user_id = to_user_id;

-- Verify the deletion
SELECT COUNT(*) as remaining_self_requests 
FROM friend_requests 
WHERE from_user_id = to_user_id;
