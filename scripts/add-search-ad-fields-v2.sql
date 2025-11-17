-- Add new fields to search_ads table for type-specific details
ALTER TABLE search_ads
ADD COLUMN IF NOT EXISTS rental_duration TEXT,
ADD COLUMN IF NOT EXISTS max_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS trade_game_title TEXT;

-- Add comment explaining the fields
COMMENT ON COLUMN search_ads.rental_duration IS 'For rent type: duration user wants to rent (e.g., "1 Woche", "Flexibel")';
COMMENT ON COLUMN search_ads.max_price IS 'For buy type: maximum price user is willing to pay';
COMMENT ON COLUMN search_ads.trade_game_title IS 'For trade type: game title user wants to offer for trade';
