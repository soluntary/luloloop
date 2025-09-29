-- Add event_invitation to the allowed notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('friend_request', 'friend_accepted', 'forum_reply', 'comment_reply', 'game_shelf_request', 'message', 'event_invitation'));
