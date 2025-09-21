-- Create forum categories table
CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forum posts table
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL CHECK (post_type IN ('review', 'question', 'tutorial', 'discussion')),
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forum replies table
CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forum post likes table
CREATE TABLE IF NOT EXISTS forum_post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create forum reply likes table
CREATE TABLE IF NOT EXISTS forum_reply_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reply_id, user_id)
);

-- Create game rules table for tutorials and official rules
CREATE TABLE IF NOT EXISTS game_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  official_rules_url TEXT,
  tutorial_video_url TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default forum categories
INSERT INTO forum_categories (name, description, icon, color) VALUES
('Spielbewertungen', 'Bewerte Spiele und teile deine Erfahrungen', '⭐', '#f59e0b'),
('Spieltipps & Fragen', 'Frage andere Nutzer nach Spieltipps und Strategien', '❓', '#3b82f6'),
('Regeln & Tutorials', 'Offizielle Spielregeln und hilfreiche Tutorials', '📚', '#10b981'),
('Allgemeine Diskussion', 'Sonstige Diskussionen rund ums Spielen', '💬', '#8b5cf6')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forum_posts_category_id ON forum_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author_id ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_game_id ON forum_posts(game_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_replies_post_id ON forum_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_author_id ON forum_replies(author_id);

-- Enable Row Level Security
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reply_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Categories: Everyone can read
CREATE POLICY "Everyone can read forum categories" ON forum_categories FOR SELECT USING (true);

-- Posts: Everyone can read, authenticated users can create/update their own
CREATE POLICY "Everyone can read forum posts" ON forum_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create forum posts" ON forum_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own forum posts" ON forum_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own forum posts" ON forum_posts FOR DELETE USING (auth.uid() = author_id);

-- Replies: Everyone can read, authenticated users can create/update their own
CREATE POLICY "Everyone can read forum replies" ON forum_replies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create forum replies" ON forum_replies FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own forum replies" ON forum_replies FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own forum replies" ON forum_replies FOR DELETE USING (auth.uid() = author_id);

-- Likes: Users can manage their own likes
CREATE POLICY "Users can manage their own post likes" ON forum_post_likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own reply likes" ON forum_reply_likes FOR ALL USING (auth.uid() = user_id);

-- Game rules: Everyone can read, authenticated users can create/update their own
CREATE POLICY "Everyone can read game rules" ON game_rules FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create game rules" ON game_rules FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own game rules" ON game_rules FOR UPDATE USING (auth.uid() = author_id);
