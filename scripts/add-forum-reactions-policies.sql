-- Enable RLS on forum_post_reactions table
ALTER TABLE forum_post_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view reactions
CREATE POLICY "Anyone can view post reactions" ON forum_post_reactions
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can add reactions
CREATE POLICY "Authenticated users can add post reactions" ON forum_post_reactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own reactions
CREATE POLICY "Users can delete their own post reactions" ON forum_post_reactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on forum_reply_reactions table
ALTER TABLE forum_reply_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view reactions
CREATE POLICY "Anyone can view reply reactions" ON forum_reply_reactions
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can add reactions
CREATE POLICY "Authenticated users can add reply reactions" ON forum_reply_reactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own reactions
CREATE POLICY "Users can delete their own reply reactions" ON forum_reply_reactions
  FOR DELETE
  USING (auth.uid() = user_id);
