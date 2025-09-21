-- Complete rebuild of friendship system with working constraints
-- Drop existing constraints and recreate with proper values
ALTER TABLE public.friends DROP CONSTRAINT IF EXISTS friends_status_check;
ALTER TABLE public.friend_requests DROP CONSTRAINT IF EXISTS friend_requests_status_check;

-- Create proper constraints that allow the status values we need
ALTER TABLE public.friends ADD CONSTRAINT friends_status_check 
CHECK (status IN ('active', 'accepted', 'pending', 'blocked'));

ALTER TABLE public.friend_requests ADD CONSTRAINT friend_requests_status_check 
CHECK (status IN ('pending', 'accepted', 'declined'));

-- Clean up any inconsistent data
DELETE FROM public.friends WHERE status NOT IN ('active', 'accepted', 'pending', 'blocked');
DELETE FROM public.friend_requests WHERE status NOT IN ('pending', 'accepted', 'declined');

-- Update existing friends to use 'active' status
UPDATE public.friends SET status = 'active' WHERE status = 'accepted';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_friends_status ON public.friends(status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests(status);

-- Ensure RLS policies are correct
DROP POLICY IF EXISTS "Allow users to view their friendships" ON public.friends;
DROP POLICY IF EXISTS "Allow users to create friendships" ON public.friends;
DROP POLICY IF EXISTS "Allow users to delete their friendships" ON public.friends;

CREATE POLICY "Allow users to view their friendships" ON public.friends
    FOR SELECT USING (auth.uid()::text = user_id::text OR auth.uid()::text = friend_id::text);

CREATE POLICY "Allow users to create friendships" ON public.friends
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Allow users to delete their friendships" ON public.friends
    FOR DELETE USING (auth.uid()::text = user_id::text OR auth.uid()::text = friend_id::text);
