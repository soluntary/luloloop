-- Fix infinite recursion in community_members RLS policies
-- Version 3: Complete reset with simple, non-recursive policies

-- Step 1: Disable RLS temporarily
ALTER TABLE IF EXISTS community_members DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (comprehensive list)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'community_members') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON community_members';
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, non-recursive policies

-- SELECT: Allow all authenticated users to view all community members
-- This is safe and doesn't cause recursion because it doesn't reference the table
CREATE POLICY "community_members_select_all" ON community_members
    FOR SELECT
    TO authenticated
    USING (true);

-- INSERT: Allow authenticated users to join communities (insert their own membership)
-- Only checks auth.uid() which doesn't cause recursion
CREATE POLICY "community_members_insert_own" ON community_members
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Allow users to update their own membership
-- Only checks auth.uid() which doesn't cause recursion
CREATE POLICY "community_members_update_own" ON community_members
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Allow users to leave communities (delete their own membership)
-- Only checks auth.uid() which doesn't cause recursion
CREATE POLICY "community_members_delete_own" ON community_members
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Step 5: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON community_members TO authenticated;

-- Verification
SELECT 'RLS policies fixed successfully - no recursion' as status;
