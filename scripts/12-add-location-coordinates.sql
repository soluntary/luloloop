-- Add latitude and longitude coordinates to tables for geolocation functionality

-- Add location coordinates to games table
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add location coordinates to communities table (already has location text field)
ALTER TABLE communities 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8);

-- Add location coordinates to community_events table (already has location field)
ALTER TABLE community_events 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8);

-- Add location coordinates to marketplace_offers table (already has location text field)
ALTER TABLE marketplace_offers 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8);

-- Add location coordinates to search_ads table
ALTER TABLE search_ads 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add location coordinates to users table for user's home location
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS location TEXT;

-- Create indexes for efficient location-based queries
CREATE INDEX IF NOT EXISTS idx_games_location ON games(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_communities_location ON communities(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_community_events_location ON community_events(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_location ON marketplace_offers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_search_ads_location ON search_ads(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(latitude, longitude);

-- Add comments to document the coordinate system
COMMENT ON COLUMN games.latitude IS 'Latitude coordinate in decimal degrees (-90 to 90)';
COMMENT ON COLUMN games.longitude IS 'Longitude coordinate in decimal degrees (-180 to 180)';
COMMENT ON COLUMN communities.latitude IS 'Latitude coordinate in decimal degrees (-90 to 90)';
COMMENT ON COLUMN communities.longitude IS 'Longitude coordinate in decimal degrees (-180 to 180)';
COMMENT ON COLUMN community_events.latitude IS 'Latitude coordinate in decimal degrees (-90 to 90)';
COMMENT ON COLUMN community_events.longitude IS 'Longitude coordinate in decimal degrees (-180 to 180)';
COMMENT ON COLUMN marketplace_offers.latitude IS 'Latitude coordinate in decimal degrees (-90 to 90)';
COMMENT ON COLUMN marketplace_offers.longitude IS 'Longitude coordinate in decimal degrees (-180 to 180)';
COMMENT ON COLUMN search_ads.latitude IS 'Latitude coordinate in decimal degrees (-90 to 90)';
COMMENT ON COLUMN search_ads.longitude IS 'Longitude coordinate in decimal degrees (-180 to 180)';
COMMENT ON COLUMN users.latitude IS 'User home location latitude in decimal degrees (-90 to 90)';
COMMENT ON COLUMN users.longitude IS 'User home location longitude in decimal degrees (-180 to 180)';
