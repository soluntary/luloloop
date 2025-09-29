-- Fix infinite recursion in community_members RLS policies
-- This script drops and recreates the policies to resolve circular references

-- Drop all existing policies for community_members
DROP POLICY IF EXISTS "Allow public read access" ON public.community_members;
DROP POLICY IF EXISTS "Allow users to join communities" ON public.community_members;
DROP POLICY IF EXISTS "Allow users to leave communities" ON public.community_members;
DROP POLICY IF EXISTS "Users can view all community memberships" ON public.community_members;
DROP POLICY IF EXISTS "Anyone can view community members" ON public.community_members;
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
DROP POLICY IF EXISTS "Users can leave communities" ON public.community_members;

-- Recreate clean, non-recursive policies for community_members table
CREATE POLICY "community_members_select_policy" ON public.community_members
    FOR SELECT USING (true);

CREATE POLICY "community_members_insert_policy" ON public.community_members
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "community_members_delete_policy" ON public.community_members
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- No UPDATE policy needed for community_members as we don't update memberships
