-- Create Ludo Forum Categories
INSERT INTO forum_categories (id, name, description, icon, color, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Allgemeine Diskussion', 'Allgemeine Gespräche über Brettspiele und Gaming', '💬', '#3B82F6', NOW(), NOW()),
  (gen_random_uuid(), 'Spielempfehlungen', 'Empfehlungen für neue Spiele und Bewertungen', '🎲', '#10B981', NOW(), NOW()),
  (gen_random_uuid(), 'Event-Organisation', 'Planung und Organisation von Spieleabenden', '📅', '#F59E0B', NOW(), NOW()),
  (gen_random_uuid(), 'Regelfragen', 'Fragen zu Spielregeln und Strategien', '❓', '#EF4444', NOW(), NOW()),
  (gen_random_uuid(), 'Marktplatz', 'Kaufen, Verkaufen und Tauschen von Spielen', '🛒', '#8B5CF6', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on forum tables if not already enabled
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reply_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for forum_categories (public read access)
DROP POLICY IF EXISTS "Anyone can view forum categories" ON forum_categories;
CREATE POLICY "Anyone can view forum categories" ON forum_categories
  FOR SELECT USING (true);

-- Create policies for forum_posts
DROP POLICY IF EXISTS "Anyone can view forum posts" ON forum_posts;
CREATE POLICY "Anyone can view forum posts" ON forum_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON forum_posts;
CREATE POLICY "Authenticated users can create posts" ON forum_posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update their own posts" ON forum_posts;
CREATE POLICY "Users can update their own posts" ON forum_posts
  FOR UPDATE USING (auth.uid() = author_id);

-- Create policies for forum_replies
DROP POLICY IF EXISTS "Anyone can view forum replies" ON forum_replies;
CREATE POLICY "Anyone can view forum replies" ON forum_replies
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create replies" ON forum_replies;
CREATE POLICY "Authenticated users can create replies" ON forum_replies
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update their own replies" ON forum_replies;
CREATE POLICY "Users can update their own replies" ON forum_replies
  FOR UPDATE USING (auth.uid() = author_id);

-- Create policies for forum_post_likes
DROP POLICY IF EXISTS "Users can view all post likes" ON forum_post_likes;
CREATE POLICY "Users can view all post likes" ON forum_post_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own post likes" ON forum_post_likes;
CREATE POLICY "Users can manage their own post likes" ON forum_post_likes
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for forum_reply_likes
DROP POLICY IF EXISTS "Users can view all reply likes" ON forum_reply_likes;
CREATE POLICY "Users can view all reply likes" ON forum_reply_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own reply likes" ON forum_reply_likes;
CREATE POLICY "Users can manage their own reply likes" ON forum_reply_likes
  FOR ALL USING (auth.uid() = user_id);
