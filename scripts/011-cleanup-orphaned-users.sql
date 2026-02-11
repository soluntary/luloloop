-- Delete users from public.users that no longer exist in auth.users
DELETE FROM public.users
WHERE id NOT IN (SELECT id FROM auth.users);

-- Also ensure the foreign key with ON DELETE CASCADE exists
-- so this cleanup happens automatically in the future
DO $$
BEGIN
  -- Drop existing FK if it exists (it may not have CASCADE)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_id_fkey' 
    AND table_name = 'users' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT users_id_fkey;
  END IF;

  -- Re-add with ON DELETE CASCADE
  ALTER TABLE public.users
    ADD CONSTRAINT users_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add FK constraint: %', SQLERRM;
END $$;
