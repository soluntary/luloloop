-- Remove any existing self friend requests (where from_user_id = to_user_id)
DELETE FROM friend_requests 
WHERE from_user_id = to_user_id;

-- Add a constraint to prevent self friend requests in the future
ALTER TABLE friend_requests 
ADD CONSTRAINT no_self_friend_requests 
CHECK (from_user_id != to_user_id);
