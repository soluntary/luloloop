-- Create database functions for forum post and reply management

-- Function to increment post replies count
CREATE OR REPLACE FUNCTION public.increment_post_replies(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE forum_posts 
  SET replies_count = replies_count + 1,
      updated_at = NOW()
  WHERE id = post_id;
END;
$$;

-- Function to decrement post replies count
CREATE OR REPLACE FUNCTION public.decrement_post_replies(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE forum_posts 
  SET replies_count = GREATEST(replies_count - 1, 0),
      updated_at = NOW()
  WHERE id = post_id;
END;
$$;

-- Function to increment reply likes count
CREATE OR REPLACE FUNCTION public.increment_reply_likes(reply_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE forum_replies 
  SET likes_count = likes_count + 1,
      updated_at = NOW()
  WHERE id = reply_id;
END;
$$;

-- Function to decrement reply likes count
CREATE OR REPLACE FUNCTION public.decrement_reply_likes(reply_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE forum_replies 
  SET likes_count = GREATEST(likes_count - 1, 0),
      updated_at = NOW()
  WHERE id = reply_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_post_replies(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_post_replies(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_reply_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_reply_likes(UUID) TO authenticated;
