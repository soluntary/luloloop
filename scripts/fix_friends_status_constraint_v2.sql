-- Fix the friends_status_check constraint to allow 'active' status
-- This script updates the constraint to allow the correct status values

-- First, check what the current constraint allows
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
    
    -- Create the new constraint that allows 'active', 'blocked', and 'pending'
    ALTER TABLE friends ADD CONSTRAINT friends_status_check 
    CHECK (status IN ('active', 'blocked', 'pending'));
    
    RAISE NOTICE 'Created new friends_status_check constraint allowing: active, blocked, pending';
    
    -- Update any existing rows that might have invalid status values
    UPDATE friends SET status = 'active' WHERE status NOT IN ('active', 'blocked', 'pending');
    
    RAISE NOTICE 'Updated any invalid status values to active';
    
END $$;
