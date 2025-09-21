-- Remove tutorials from forum system
-- This script removes all tutorial-related functionality from the forum

-- Remove tutorial posts first (to avoid foreign key constraints)
DELETE FROM forum_post_likes WHERE post_id IN (
  SELECT id FROM forum_posts WHERE post_type = 'tutorial'
);

DELETE FROM forum_replies WHERE post_id IN (
  SELECT id FROM forum_posts WHERE post_type = 'tutorial'
);

DELETE FROM forum_posts WHERE post_type = 'tutorial';

-- Drop the game_rules table entirely
DROP TABLE IF EXISTS game_rules CASCADE;

-- Remove the "Regeln & Tutorials" category
DELETE FROM forum_categories WHERE name = 'Regeln & Tutorials';

-- Update the forum_posts table to remove 'tutorial' from the CHECK constraint
ALTER TABLE forum_posts DROP CONSTRAINT IF EXISTS forum_posts_post_type_check;
ALTER TABLE forum_posts ADD CONSTRAINT forum_posts_post_type_check 
  CHECK (post_type IN ('review', 'question', 'discussion'));

-- Update the forum schema files to reflect changes
-- Note: The original schema files should be updated to remove tutorial references
