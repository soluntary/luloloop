-- Disable RLS on forum_post_reactions table
-- The app handles authentication at the application level

ALTER TABLE forum_post_reactions DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view all reactions" ON forum_post_reactions;
DROP POLICY IF EXISTS "Authenticated users can add reactions" ON forum_post_reactions;
DROP POLICY IF EXISTS "Users can remove their own reactions" ON forum_post_reactions;

-- Also disable RLS on forum_reply_reactions if it exists
ALTER TABLE IF EXISTS forum_reply_reactions DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all reply reactions" ON forum_reply_reactions;
DROP POLICY IF EXISTS "Authenticated users can add reply reactions" ON forum_reply_reactions;
DROP POLICY IF EXISTS "Users can remove their own reply reactions" ON forum_reply_reactions;
