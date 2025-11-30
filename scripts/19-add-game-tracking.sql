-- Enable tracking of game status (rented, swapped, etc.)
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS tracking_info JSONB DEFAULT NULL;

-- Example structure of tracking_info:
-- {
--   "status": "available" | "rented" | "swapped" | "lent",
--   "rented_to": "Username",
--   "rented_until": "Date",
--   "swapped_with": "Username",
--   "notes": "Some text"
-- }
