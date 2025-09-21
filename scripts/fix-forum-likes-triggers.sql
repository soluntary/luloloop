-- Create triggers to automatically update like counts when likes are added/removed

-- Function to update forum post like counts
CREATE OR REPLACE FUNCTION update_forum_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts 
    SET likes_count = (
      SELECT COUNT(*) 
      FROM forum_post_likes 
      WHERE post_id = NEW.post_id
    )
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts 
    SET likes_count = (
      SELECT COUNT(*) 
      FROM forum_post_likes 
      WHERE post_id = OLD.post_id
    )
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update forum reply like counts
CREATE OR REPLACE FUNCTION update_forum_reply_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_replies 
    SET likes_count = (
      SELECT COUNT(*) 
      FROM forum_reply_likes 
      WHERE reply_id = NEW.reply_id
    )
    WHERE id = NEW.reply_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_replies 
    SET likes_count = (
      SELECT COUNT(*) 
      FROM forum_reply_likes 
      WHERE reply_id = OLD.reply_id
    )
    WHERE id = OLD.reply_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS forum_post_likes_count_trigger ON forum_post_likes;
DROP TRIGGER IF EXISTS forum_reply_likes_count_trigger ON forum_reply_likes;

-- Create triggers for forum post likes
CREATE TRIGGER forum_post_likes_count_trigger
  AFTER INSERT OR DELETE ON forum_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_forum_post_likes_count();

-- Create triggers for forum reply likes
CREATE TRIGGER forum_reply_likes_count_trigger
  AFTER INSERT OR DELETE ON forum_reply_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_forum_reply_likes_count();

-- Update existing like counts to ensure they're accurate
UPDATE forum_posts 
SET likes_count = (
  SELECT COUNT(*) 
  FROM forum_post_likes 
  WHERE post_id = forum_posts.id
);

UPDATE forum_replies 
SET likes_count = (
  SELECT COUNT(*) 
  FROM forum_reply_likes 
  WHERE reply_id = forum_replies.id
);
