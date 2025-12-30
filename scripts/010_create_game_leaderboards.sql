-- Creating leaderboard tables for mini games with RLS policies

-- Mastermind Leaderboard Table
CREATE TABLE IF NOT EXISTS public.mastermind_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  attempts INTEGER NOT NULL,
  time_seconds INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.mastermind_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mastermind scores" 
  ON public.mastermind_scores FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert their own scores" 
  ON public.mastermind_scores FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 2048 Leaderboard Table
CREATE TABLE IF NOT EXISTS public.game_2048_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.game_2048_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view 2048 scores" 
  ON public.game_2048_scores FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert their own scores" 
  ON public.game_2048_scores FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Minesweeper Leaderboard Table (with difficulty levels)
CREATE TABLE IF NOT EXISTS public.minesweeper_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  time_seconds INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.minesweeper_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view minesweeper scores" 
  ON public.minesweeper_scores FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert their own scores" 
  ON public.minesweeper_scores FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Pattern Match Leaderboard Table
CREATE TABLE IF NOT EXISTS public.pattern_match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  round INTEGER NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pattern_match_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pattern match scores" 
  ON public.pattern_match_scores FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert their own scores" 
  ON public.pattern_match_scores FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Lights Out Leaderboard Table
CREATE TABLE IF NOT EXISTS public.lights_out_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  moves INTEGER NOT NULL,
  hints_used INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.lights_out_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lights out scores" 
  ON public.lights_out_scores FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert their own scores" 
  ON public.lights_out_scores FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Sudoku Leaderboard Table (with difficulty levels)
CREATE TABLE IF NOT EXISTS public.sudoku_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  time_seconds INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.sudoku_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sudoku scores" 
  ON public.sudoku_scores FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert their own scores" 
  ON public.sudoku_scores FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mastermind_attempts ON public.mastermind_scores(attempts, time_seconds);
CREATE INDEX IF NOT EXISTS idx_2048_score ON public.game_2048_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_minesweeper_difficulty_time ON public.minesweeper_scores(difficulty, time_seconds);
CREATE INDEX IF NOT EXISTS idx_pattern_match_score ON public.pattern_match_scores(score DESC, round DESC);
CREATE INDEX IF NOT EXISTS idx_lights_out_moves ON public.lights_out_scores(moves, hints_used);
CREATE INDEX IF NOT EXISTS idx_sudoku_difficulty_time ON public.sudoku_scores(difficulty, time_seconds);
