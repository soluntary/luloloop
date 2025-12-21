-- Fix RLS policy for community_poll_options to match the updated poll creation policy
-- This allows community members (not just the original creator) to insert poll options

-- Drop old policy
DROP POLICY IF EXISTS "Poll creators can insert options" ON community_poll_options;

-- Create new policy that allows community members who can create polls to also insert poll options
CREATE POLICY "Community members can insert poll options"
  ON community_poll_options FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_polls
      JOIN community_members ON community_members.community_id = community_polls.community_id
      WHERE community_polls.id = community_poll_options.poll_id
      AND community_members.user_id = auth.uid()
    )
  );
