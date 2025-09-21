-- Execute the message types update to allow new offer types
-- This script runs the previous migration to update the check constraint
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_offer_type_check' 
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE messages DROP CONSTRAINT messages_offer_type_check;
    END IF;
    
    -- Add new constraint with additional message types
    ALTER TABLE messages ADD CONSTRAINT messages_offer_type_check 
    CHECK (offer_type IN (
        'buy', 'sell', 'rent', 'trade', 'borrow', 'lend', 
        'group_inquiry', 'event_inquiry', 'general'
    ));
    
    RAISE NOTICE 'Message types constraint updated successfully';
END $$;
