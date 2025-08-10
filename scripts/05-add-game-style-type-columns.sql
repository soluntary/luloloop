-- Add missing columns to games table
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS style TEXT;

-- Update existing games to have default values if needed
UPDATE public.games 
SET type = 'Brettspiel', style = 'Kompetitiv' 
WHERE type IS NULL OR style IS NULL;

-- Add indexes for better performance on the new columns
CREATE INDEX IF NOT EXISTS idx_games_type ON public.games(type);
CREATE INDEX IF NOT EXISTS idx_games_style ON public.games(style);
