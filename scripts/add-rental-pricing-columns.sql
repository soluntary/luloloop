-- Add new columns for the updated rental pricing system
-- base_price: Base price per day
-- max_rental_flexible: Whether max rental duration is flexible
-- price_tiers: JSON array of tiered pricing [{days: number, price: number}]

ALTER TABLE marketplace_offers
ADD COLUMN IF NOT EXISTS base_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS max_rental_flexible BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS price_tiers JSONB;

-- Add comment for documentation
COMMENT ON COLUMN marketplace_offers.base_price IS 'Base rental price per day in CHF';
COMMENT ON COLUMN marketplace_offers.max_rental_flexible IS 'Whether the maximum rental duration is flexible/negotiable';
COMMENT ON COLUMN marketplace_offers.price_tiers IS 'JSON array of tiered pricing: [{days: number, price: number}]';
