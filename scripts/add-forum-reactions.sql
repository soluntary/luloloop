-- Create forum_post_reactions table for emoji reactions
CREATE TABLE IF NOT EXISTS forum_post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, emoji)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_forum_post_reactions_post_id ON forum_post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_reactions_user_id ON forum_post_reactions(user_id);

-- Create forum_reply_reactions table for emoji reactions on replies
CREATE TABLE IF NOT EXISTS forum_reply_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id UUID NOT NULL REFERENCES forum_replies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reply_id, user_id, emoji)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_forum_reply_reactions_reply_id ON forum_reply_reactions(reply_id);
CREATE INDEX IF NOT EXISTS idx_forum_reply_reactions_user_id ON forum_reply_reactions(user_id);
