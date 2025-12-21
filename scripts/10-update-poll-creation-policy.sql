-- Update RLS policy to allow community members (not just creators) to create polls

-- Drop old policy
DROP POLICY IF EXISTS "Community creators can create polls" ON community_polls;

-- Create new policy that allows community members to create polls
CREATE POLICY "Community members can create polls" ON community_polls
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_polls.community_id
      AND community_members.user_id = auth.uid()
    )
  );
