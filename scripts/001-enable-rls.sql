-- ============================================================
-- Migration: Enable RLS on all tables that have policies defined
-- but RLS not yet activated.
-- 
-- NOTE: Server-actions use createAdminClient() with service_role
-- key which bypasses RLS, so admin inserts (notifications, etc.)
-- will continue to work.
-- ============================================================

-- 1. Fix missing policies BEFORE enabling RLS
-- Use DROP IF EXISTS + CREATE to be idempotent

-- forum_reply_reactions: INSERT policy
DROP POLICY IF EXISTS "Authenticated users can add reply reactions" ON public.forum_reply_reactions;
CREATE POLICY "Authenticated users can add reply reactions"
  ON public.forum_reply_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- notification_queue: INSERT for authenticated
DROP POLICY IF EXISTS "System can insert notification queue" ON public.notification_queue;
CREATE POLICY "System can insert notification queue"
  ON public.notification_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- user_profiles: INSERT policy
DROP POLICY IF EXISTS "Users can insert own user_profile" ON public.user_profiles;
CREATE POLICY "Users can insert own user_profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. Enable RLS on all tables that have policies but RLS disabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_event_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ludo_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ludo_event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ludo_event_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ludo_event_instance_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ludo_event_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ludo_event_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_reply_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_reply_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Ad tables: add basic policies then enable RLS

-- ad_analytics
DROP POLICY IF EXISTS "Service role manages ad_analytics" ON public.ad_analytics;
CREATE POLICY "Service role manages ad_analytics"
  ON public.ad_analytics FOR ALL TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Public can view ad_analytics" ON public.ad_analytics;
CREATE POLICY "Public can view ad_analytics"
  ON public.ad_analytics FOR SELECT TO anon USING (true);
ALTER TABLE public.ad_analytics ENABLE ROW LEVEL SECURITY;

-- ad_space_assignments
DROP POLICY IF EXISTS "Service role manages ad_space_assignments" ON public.ad_space_assignments;
CREATE POLICY "Service role manages ad_space_assignments"
  ON public.ad_space_assignments FOR ALL TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Public can view ad_space_assignments" ON public.ad_space_assignments;
CREATE POLICY "Public can view ad_space_assignments"
  ON public.ad_space_assignments FOR SELECT TO anon USING (true);
ALTER TABLE public.ad_space_assignments ENABLE ROW LEVEL SECURITY;

-- ad_spaces
DROP POLICY IF EXISTS "Service role manages ad_spaces" ON public.ad_spaces;
CREATE POLICY "Service role manages ad_spaces"
  ON public.ad_spaces FOR ALL TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Public can view ad_spaces" ON public.ad_spaces;
CREATE POLICY "Public can view ad_spaces"
  ON public.ad_spaces FOR SELECT TO anon USING (true);
ALTER TABLE public.ad_spaces ENABLE ROW LEVEL SECURITY;

-- ads
DROP POLICY IF EXISTS "Service role manages ads" ON public.ads;
CREATE POLICY "Service role manages ads"
  ON public.ads FOR ALL TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Public can view active ads" ON public.ads;
CREATE POLICY "Public can view active ads"
  ON public.ads FOR SELECT TO anon USING (is_active = true);
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- ludo_event_instance_participants: DELETE policy
DROP POLICY IF EXISTS "Users can leave event instances" ON public.ludo_event_instance_participants;
CREATE POLICY "Users can leave event instances"
  ON public.ludo_event_instance_participants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
