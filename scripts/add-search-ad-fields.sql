-- Add new fields to search_ads table for type-specific options
ALTER TABLE search_ads
ADD COLUMN IF NOT EXISTS rental_duration TEXT,
ADD COLUMN IF NOT EXISTS max_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS trade_game_title TEXT;

-- Add comment to explain the fields
COMMENT ON COLUMN search_ads.rental_duration IS 'Rental duration for rent type (e.g., "1 Woche", "flexibel")';
COMMENT ON COLUMN search_ads.max_price IS 'Maximum price willing to pay for buy type';
COMMENT ON COLUMN search_ads.trade_game_title IS 'Game title offered for trade when type is trade';
