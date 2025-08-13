-- Create communities table
CREATE TABLE IF NOT EXISTS communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'casual' CHECK (type IN ('casual', 'competitive', 'family')),
  location VARCHAR(255),
  max_members INTEGER DEFAULT 50,
  is_private BOOLEAN DEFAULT false,
  image TEXT,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community_members table for tracking memberships
CREATE TABLE IF NOT EXISTS community_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_communities_creator ON communities(creator_id);
CREATE INDEX IF NOT EXISTS idx_communities_type ON communities(type);
CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);

-- Enable RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for communities
CREATE POLICY "Public communities are viewable by everyone" ON communities
  FOR SELECT USING (NOT is_private OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can create communities" ON communities
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Community creators can update their communities" ON communities
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Community creators can delete their communities" ON communities
  FOR DELETE USING (auth.uid() = creator_id);

-- RLS Policies for community_members
CREATE POLICY "Community members are viewable by community members" ON community_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_members cm 
      WHERE cm.community_id = community_members.community_id 
      AND cm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM communities c 
      WHERE c.id = community_members.community_id 
      AND NOT c.is_private
    )
  );

CREATE POLICY "Users can join communities" ON community_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities" ON community_members
  FOR DELETE USING (auth.uid() = user_id);

-- Function to get member count
CREATE OR REPLACE FUNCTION get_community_member_count(community_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM community_members 
    WHERE community_members.community_id = get_community_member_count.community_id
  );
END;
$$ LANGUAGE plpgsql;
