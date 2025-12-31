-- Add missing columns to lights_out_scores table
ALTER TABLE lights_out_scores 
ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS time_seconds INTEGER;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_lights_out_difficulty ON lights_out_scores(difficulty);
