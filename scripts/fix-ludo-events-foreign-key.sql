-- Fix foreign key constraint for ludo_events.creator_id
-- The original constraint references auth.users but should reference public.users

-- First, drop the existing foreign key constraint
ALTER TABLE ludo_events DROP CONSTRAINT IF EXISTS ludo_events_creator_id_fkey;

-- Add the correct foreign key constraint referencing public.users
ALTER TABLE ludo_events 
ADD CONSTRAINT ludo_events_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Also fix the participants table if it has the same issue
ALTER TABLE ludo_event_participants DROP CONSTRAINT IF EXISTS ludo_event_participants_user_id_fkey;

ALTER TABLE ludo_event_participants 
ADD CONSTRAINT ludo_event_participants_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Verify the constraints are working
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('ludo_events', 'ludo_event_participants')
  AND tc.table_schema = 'public';
