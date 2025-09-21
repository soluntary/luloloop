-- Complete Forum Database Schema
-- This file creates all tables and policies for the Forum feature

-- Enable RLS
ALTER TABLE IF EXISTS forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS forum_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS forum_reply_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS game_rules ENABLE ROW LEVEL SECURITY;

-- Forum Categories table (already exists, but adding constraints)
CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Posts table (already exists, but adding constraints)
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT CHECK (post_type IN ('discussion', 'question', 'review', 'tutorial')) DEFAULT 'discussion',
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES forum_categories(id) ON DELETE SET NULL,
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Replies table (already exists, but adding constraints)
CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Post Likes table
CREATE TABLE IF NOT EXISTS forum_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Forum Reply Likes table
CREATE TABLE IF NOT EXISTS forum_reply_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reply_id, user_id)
);

-- Game Rules table (already exists, but adding constraints)
CREATE TABLE IF NOT EXISTS game_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  official_rules_url TEXT,
  tutorial_video_url TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Post Tags table for better categorization
CREATE TABLE IF NOT EXISTS forum_post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, tag_name)
);

-- Forum Moderators table
CREATE TABLE IF NOT EXISTS forum_moderators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '{"can_pin": true, "can_lock": true, "can_delete": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_game ON forum_posts(game_id) WHERE game_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_forum_posts_type ON forum_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_replies_post ON forum_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_parent ON forum_replies(parent_reply_id) WHERE parent_reply_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_forum_replies_author ON forum_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_likes_post ON forum_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_likes_user ON forum_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_reply_likes_reply ON forum_reply_likes(reply_id);
CREATE INDEX IF NOT EXISTS idx_forum_reply_likes_user ON forum_reply_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_game_rules_game ON game_rules(game_id);
CREATE INDEX IF NOT EXISTS idx_game_rules_author ON game_rules(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_tags_post ON forum_post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_tags_tag ON forum_post_tags(tag_name);

-- RLS Policies for Forum Categories
DROP POLICY IF EXISTS "Forum categories are viewable by everyone" ON forum_categories;
CREATE POLICY "Forum categories are viewable by everyone" ON forum_categories
  FOR SELECT USING (true);

-- RLS Policies for Forum Posts
DROP POLICY IF EXISTS "Forum posts are viewable by everyone" ON forum_posts;
CREATE POLICY "Forum posts are viewable by everyone" ON forum_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create forum posts" ON forum_posts;
CREATE POLICY "Users can create forum posts" ON forum_posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own forum posts" ON forum_posts;
CREATE POLICY "Users can update own forum posts" ON forum_posts
  FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete own forum posts" ON forum_posts;
CREATE POLICY "Users can delete own forum posts" ON forum_posts
  FOR DELETE USING (auth.uid() = author_id);

-- RLS Policies for Forum Replies
DROP POLICY IF EXISTS "Forum replies are viewable by everyone" ON forum_replies;
CREATE POLICY "Forum replies are viewable by everyone" ON forum_replies
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create forum replies" ON forum_replies;
CREATE POLICY "Users can create forum replies" ON forum_replies
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own forum replies" ON forum_replies;
CREATE POLICY "Users can update own forum replies" ON forum_replies
  FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete own forum replies" ON forum_replies;
CREATE POLICY "Users can delete own forum replies" ON forum_replies
  FOR DELETE USING (auth.uid() = author_id);

-- RLS Policies for Forum Post Likes
DROP POLICY IF EXISTS "Forum post likes are viewable by everyone" ON forum_post_likes;
CREATE POLICY "Forum post likes are viewable by everyone" ON forum_post_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can like forum posts" ON forum_post_likes;
CREATE POLICY "Users can like forum posts" ON forum_post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike forum posts" ON forum_post_likes;
CREATE POLICY "Users can unlike forum posts" ON forum_post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Forum Reply Likes
DROP POLICY IF EXISTS "Forum reply likes are viewable by everyone" ON forum_reply_likes;
CREATE POLICY "Forum reply likes are viewable by everyone" ON forum_reply_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can like forum replies" ON forum_reply_likes;
CREATE POLICY "Users can like forum replies" ON forum_reply_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike forum replies" ON forum_reply_likes;
CREATE POLICY "Users can unlike forum replies" ON forum_reply_likes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Game Rules
DROP POLICY IF EXISTS "Game rules are viewable by everyone" ON game_rules;
CREATE POLICY "Game rules are viewable by everyone" ON game_rules
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create game rules" ON game_rules;
CREATE POLICY "Users can create game rules" ON game_rules
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own game rules" ON game_rules;
CREATE POLICY "Users can update own game rules" ON game_rules
  FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete own game rules" ON game_rules;
CREATE POLICY "Users can delete own game rules" ON game_rules
  FOR DELETE USING (auth.uid() = author_id);

-- Functions to update counters
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_reply_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_replies SET likes_count = likes_count + 1 WHERE id = NEW.reply_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_replies SET likes_count = likes_count - 1 WHERE id = OLD.reply_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts SET replies_count = replies_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts SET replies_count = replies_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for counter updates
DROP TRIGGER IF EXISTS update_post_likes_count_trigger ON forum_post_likes;
CREATE TRIGGER update_post_likes_count_trigger
  AFTER INSERT OR DELETE ON forum_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

DROP TRIGGER IF EXISTS update_reply_likes_count_trigger ON forum_reply_likes;
CREATE TRIGGER update_reply_likes_count_trigger
  AFTER INSERT OR DELETE ON forum_reply_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_reply_likes_count();

DROP TRIGGER IF EXISTS update_post_replies_count_trigger ON forum_replies;
CREATE TRIGGER update_post_replies_count_trigger
  AFTER INSERT OR DELETE ON forum_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_post_replies_count();

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_forum_categories_updated_at ON forum_categories;
CREATE TRIGGER update_forum_categories_updated_at
  BEFORE UPDATE ON forum_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_forum_posts_updated_at ON forum_posts;
CREATE TRIGGER update_forum_posts_updated_at
  BEFORE UPDATE ON forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_forum_replies_updated_at ON forum_replies;
CREATE TRIGGER update_forum_replies_updated_at
  BEFORE UPDATE ON forum_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_game_rules_updated_at ON game_rules;
CREATE TRIGGER update_game_rules_updated_at
  BEFORE UPDATE ON game_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default forum categories
INSERT INTO forum_categories (name, description, icon, color) VALUES
  ('Spielbewertungen', 'Bewerte und rezensiere deine Lieblingsspiele', '⭐', '#F59E0B'),
  ('Spieltipps', 'Frage nach Strategien und Tipps für verschiedene Spiele', '💡', '#10B981'),
  ('Regeln & Tutorials', 'Teile und finde Spielregeln und Anleitungen', '📚', '#3B82F6'),
  ('Allgemeine Diskussion', 'Allgemeine Gespräche über Brettspiele', '💬', '#8B5CF6')
ON CONFLICT (name) DO NOTHING;
