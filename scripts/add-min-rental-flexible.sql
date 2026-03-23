-- Add min_rental_flexible column to marketplace_offers
ALTER TABLE marketplace_offers 
ADD COLUMN IF NOT EXISTS min_rental_flexible boolean DEFAULT false;
