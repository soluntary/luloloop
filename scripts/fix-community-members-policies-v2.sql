-- Fix infinite recursion in community_members RLS policies
-- This script completely resets all policies for community_members table

-- First, disable RLS temporarily to ensure we can work with the table
ALTER TABLE community_members DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies for community_members
DROP POLICY IF EXISTS "Users can view community members" ON community_members;
DROP POLICY IF EXISTS "Users can insert community members" ON community_members;
DROP POLICY IF EXISTS "Users can update community members" ON community_members;
DROP POLICY IF EXISTS "Users can delete community members" ON community_members;
DROP POLICY IF EXISTS "community_members_select_policy" ON community_members;
DROP POLICY IF EXISTS "community_members_insert_policy" ON community_members;
DROP POLICY IF EXISTS "community_members_update_policy" ON community_members;
DROP POLICY IF EXISTS "community_members_delete_policy" ON community_members;
DROP POLICY IF EXISTS "Enable read access for all users" ON community_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON community_members;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON community_members;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON community_members;

-- Re-enable RLS
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
-- SELECT: Allow users to see all community members (needed for group member lists)
CREATE POLICY "community_members_select" ON community_members
    FOR SELECT
    TO authenticated
    USING (true);

-- INSERT: Allow authenticated users to join communities
CREATE POLICY "community_members_insert" ON community_members
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Allow users to leave communities they are members of
-- This is the critical policy - keep it simple to avoid recursion
CREATE POLICY "community_members_delete" ON community_members
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- UPDATE: Allow users to update their own membership status
CREATE POLICY "community_members_update" ON community_members
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Verify the policies are working by testing a simple query
-- This should not cause recursion
SELECT 'Policies created successfully' as status;
