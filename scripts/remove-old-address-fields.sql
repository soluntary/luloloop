-- Migration: Remove old address fields from users table
-- The new single 'address' field already exists and will be used instead

-- Remove old address-related columns
ALTER TABLE users DROP COLUMN IF EXISTS street;
ALTER TABLE users DROP COLUMN IF EXISTS house_number;
ALTER TABLE users DROP COLUMN IF EXISTS zip_code;
ALTER TABLE users DROP COLUMN IF EXISTS city;
ALTER TABLE users DROP COLUMN IF EXISTS country;

-- Verify the address column exists (it should already exist)
-- If it doesn't exist, create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'address'
    ) THEN
        ALTER TABLE users ADD COLUMN address TEXT;
    END IF;
END $$;
