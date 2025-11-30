-- Create game_catalog table
CREATE TABLE IF NOT EXISTS game_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bgg_id INTEGER UNIQUE,
  title TEXT NOT NULL,
  original_title TEXT,
  year_published INTEGER,
  min_players INTEGER,
  max_players INTEGER,
  playing_time INTEGER,
  min_playtime INTEGER,
  max_playtime INTEGER,
  age INTEGER,
  description TEXT,
  image TEXT,
  thumbnail TEXT,
  publisher TEXT,
  designers TEXT[],
  categories TEXT[],
  mechanics TEXT[],
  complexity NUMERIC,
  rating NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE game_catalog ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read
CREATE POLICY "Allow public read access" ON game_catalog
  FOR SELECT USING (true);

-- Create policy to allow admins (or service role) to insert/update
-- For now, we'll allow authenticated users to insert if they are importing (can be restricted later)
CREATE POLICY "Allow authenticated insert" ON game_catalog
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON game_catalog
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create index for faster search
CREATE INDEX IF NOT EXISTS idx_game_catalog_title ON game_catalog USING gin(to_tsvector('english', title));
