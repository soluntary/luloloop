-- Fix RLS policy for search_ads to allow status updates
-- The current policy might be too restrictive for UPDATE operations

-- Drop existing UPDATE policy if it exists
DROP POLICY IF EXISTS "Users can update their own search ads" ON search_ads;

-- Create new UPDATE policy that explicitly allows active field updates
CREATE POLICY "Users can update their own search ads"
ON search_ads
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
