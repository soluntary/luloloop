-- Fix RLS policy for search_ads to allow users to view their own ads regardless of active status
-- and view all other users' active ads

-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view all active search ads" ON search_ads;

-- Create new SELECT policy that allows:
-- 1. Users to view ALL their own search ads (active or not)
-- 2. Users to view other users' ACTIVE search ads only
CREATE POLICY "Users can view own ads and others active ads" 
ON search_ads
FOR SELECT
USING (
  user_id = auth.uid() 
  OR active = true
);
