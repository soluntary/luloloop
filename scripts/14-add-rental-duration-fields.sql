-- Add minimum and maximum rental duration fields to marketplace_offers table
ALTER TABLE marketplace_offers 
ADD COLUMN min_rental_days INTEGER,
ADD COLUMN max_rental_days INTEGER;

-- Add comments to document the new fields
COMMENT ON COLUMN marketplace_offers.min_rental_days IS 'Minimum rental duration in days for lending offers';
COMMENT ON COLUMN marketplace_offers.max_rental_days IS 'Maximum rental duration in days for lending offers';
