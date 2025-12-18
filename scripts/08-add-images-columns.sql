-- Add images array column to communities table
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS images text[];

-- Add images array column to community_events table (for consistency)
ALTER TABLE community_events
ADD COLUMN IF NOT EXISTS images text[];

-- Add images array column to ludo_events table
ALTER TABLE ludo_events
ADD COLUMN IF NOT EXISTS images text[];

COMMENT ON COLUMN communities.images IS 'Array of image URLs for the community, first image is the main image';
COMMENT ON COLUMN community_events.images IS 'Array of image URLs for the event, first image is the main image';
COMMENT ON COLUMN ludo_events.images IS 'Array of image URLs for the event, first image is the main image';
