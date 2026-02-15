-- Add year_published column to games table
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS year_published integer;
