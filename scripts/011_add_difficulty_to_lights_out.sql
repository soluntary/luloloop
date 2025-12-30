-- Add difficulty column to lights_out_scores table
ALTER TABLE public.lights_out_scores 
ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'medium' 
CHECK (difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text]));

-- Add comment
COMMENT ON COLUMN public.lights_out_scores.difficulty IS 'Difficulty level: easy, medium, or hard';
