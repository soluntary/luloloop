-- Create community_polls table
CREATE TABLE IF NOT EXISTS community_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  description TEXT,
  allow_multiple_votes BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create community_poll_options table
CREATE TABLE IF NOT EXISTS community_poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES community_polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  votes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community_poll_votes table
CREATE TABLE IF NOT EXISTS community_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES community_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES community_poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id, option_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_community_polls_community_id ON community_polls(community_id);
CREATE INDEX IF NOT EXISTS idx_community_polls_creator_id ON community_polls(creator_id);
CREATE INDEX IF NOT EXISTS idx_community_poll_options_poll_id ON community_poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_community_poll_votes_poll_id ON community_poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_community_poll_votes_user_id ON community_poll_votes(user_id);

-- Enable Row Level Security
ALTER TABLE community_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_polls
-- Members can view polls in their communities
CREATE POLICY "Members can view community polls"
  ON community_polls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_polls.community_id
      AND community_members.user_id = auth.uid()
    )
  );

-- Only community creators can create polls
CREATE POLICY "Community creators can create polls"
  ON community_polls FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_polls.community_id
      AND communities.creator_id = auth.uid()
    )
  );

-- Poll creators can update their own polls
CREATE POLICY "Poll creators can update their polls"
  ON community_polls FOR UPDATE
  USING (creator_id = auth.uid());

-- Poll creators can delete their own polls
CREATE POLICY "Poll creators can delete their polls"
  ON community_polls FOR DELETE
  USING (creator_id = auth.uid());

-- RLS Policies for community_poll_options
-- Members can view poll options
CREATE POLICY "Members can view poll options"
  ON community_poll_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_polls
      JOIN community_members ON community_members.community_id = community_polls.community_id
      WHERE community_polls.id = community_poll_options.poll_id
      AND community_members.user_id = auth.uid()
    )
  );

-- Poll creators can insert options
CREATE POLICY "Poll creators can insert options"
  ON community_poll_options FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_polls
      WHERE community_polls.id = community_poll_options.poll_id
      AND community_polls.creator_id = auth.uid()
    )
  );

-- RLS Policies for community_poll_votes
-- Members can view votes
CREATE POLICY "Members can view poll votes"
  ON community_poll_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_polls
      JOIN community_members ON community_members.community_id = community_polls.community_id
      WHERE community_polls.id = community_poll_votes.poll_id
      AND community_members.user_id = auth.uid()
    )
  );

-- Members can vote on polls
CREATE POLICY "Members can vote on polls"
  ON community_poll_votes FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM community_polls
      JOIN community_members ON community_members.community_id = community_polls.community_id
      WHERE community_polls.id = community_poll_votes.poll_id
      AND community_members.user_id = auth.uid()
      AND community_polls.is_active = true
      AND (community_polls.expires_at IS NULL OR community_polls.expires_at > NOW())
    )
  );

-- Users can delete their own votes
CREATE POLICY "Users can delete their own votes"
  ON community_poll_votes FOR DELETE
  USING (user_id = auth.uid());

-- Create function to update votes_count
CREATE OR REPLACE FUNCTION update_poll_option_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_poll_options
    SET votes_count = votes_count + 1
    WHERE id = NEW.option_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_poll_options
    SET votes_count = votes_count - 1
    WHERE id = OLD.option_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update votes_count
DROP TRIGGER IF EXISTS trigger_update_poll_option_votes_count ON community_poll_votes;
CREATE TRIGGER trigger_update_poll_option_votes_count
AFTER INSERT OR DELETE ON community_poll_votes
FOR EACH ROW
EXECUTE FUNCTION update_poll_option_votes_count();
