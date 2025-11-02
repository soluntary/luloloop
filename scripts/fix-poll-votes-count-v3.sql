-- Fix the votes_count update issue by adding missing RLS policy and improving the trigger

-- Drop and recreate the UPDATE policy for community_poll_options
DROP POLICY IF EXISTS "Allow vote count updates" ON community_poll_options;
CREATE POLICY "Allow vote count updates"
  ON community_poll_options FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Recreate the trigger function with SECURITY DEFINER to bypass RLS
DROP FUNCTION IF EXISTS update_poll_option_votes_count() CASCADE;

CREATE OR REPLACE FUNCTION update_poll_option_votes_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_poll_options
    SET votes_count = votes_count + 1
    WHERE id = NEW.option_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_poll_options
    SET votes_count = GREATEST(votes_count - 1, 0)
    WHERE id = OLD.option_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_poll_option_votes_count ON community_poll_votes;
CREATE TRIGGER trigger_update_poll_option_votes_count
AFTER INSERT OR DELETE ON community_poll_votes
FOR EACH ROW
EXECUTE FUNCTION update_poll_option_votes_count();
