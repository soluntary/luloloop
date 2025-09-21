-- Fix the friends table constraint to allow proper status values
-- This script will update the constraint to allow 'active', 'pending', 'blocked' status values

-- First, check what constraint exists
DO $$
BEGIN
    -- Drop the existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'friends_status_check' 
        AND table_name = 'friends'
    ) THEN
        ALTER TABLE friends DROP CONSTRAINT friends_status_check;
        RAISE NOTICE 'Dropped existing friends_status_check constraint';
    END IF;
    
    -- Add the new constraint with proper values
    ALTER TABLE friends ADD CONSTRAINT friends_status_check 
    CHECK (status IN ('active', 'pending', 'blocked'));
    
    RAISE NOTICE 'Added new friends_status_check constraint with values: active, pending, blocked';
    
    -- Update any existing rows that might have invalid status values
    UPDATE friends SET status = 'active' WHERE status NOT IN ('active', 'pending', 'blocked');
    
    RAISE NOTICE 'Updated existing rows to use valid status values';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating constraint: %', SQLERRM;
END $$;
