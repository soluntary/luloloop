-- Add show_full_address field to marketplace_offers table
ALTER TABLE marketplace_offers
ADD COLUMN IF NOT EXISTS show_full_address BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN marketplace_offers.show_full_address IS 'Whether to display full address or only postal code and city';
