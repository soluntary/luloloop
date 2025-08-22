-- Add username field to users table
ALTER TABLE users ADD COLUMN username text;

-- Create unique index on username to prevent duplicates
CREATE UNIQUE INDEX users_username_key ON users(username) WHERE username IS NOT NULL;

-- Update existing users to have a username based on their name (temporary)
UPDATE users SET username = LOWER(REPLACE(name, ' ', '_')) WHERE username IS NULL AND name IS NOT NULL;
