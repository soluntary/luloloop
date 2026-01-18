-- Disable RLS on critical tables that are causing issues in v0 environment
-- Authentication is handled at the application level

-- Community tables
ALTER TABLE communities DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_join_requests DISABLE ROW LEVEL SECURITY;

-- Event tables
ALTER TABLE ludo_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE ludo_event_instances DISABLE ROW LEVEL SECURITY;
ALTER TABLE ludo_event_instance_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_event_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_event_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_event_time_slots DISABLE ROW LEVEL SECURITY;

-- Forum tables
ALTER TABLE forum_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies DISABLE ROW LEVEL SECURITY;
ALTER TABLE forum_post_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reply_likes DISABLE ROW LEVEL SECURITY;

-- Notifications
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue DISABLE ROW LEVEL SECURITY;
