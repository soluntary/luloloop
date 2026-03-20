-- Add additional_images column to marketplace_offers table
-- This column stores an array of image URLs for additional offer photos

ALTER TABLE marketplace_offers 
ADD COLUMN IF NOT EXISTS additional_images TEXT[];

-- Add a comment to describe the column
COMMENT ON COLUMN marketplace_offers.additional_images IS 'Array of additional image URLs for the offer (max 5 total including main image)';
