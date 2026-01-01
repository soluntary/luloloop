-- Fix duplicate entries in all leaderboard tables
-- Only keep the best score per user

-- 1. Fix Mastermind (best = fewest attempts, then shortest time)
WITH ranked_mastermind AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY attempts ASC, time_seconds ASC, created_at ASC
    ) as rn
  FROM mastermind_scores
)
DELETE FROM mastermind_scores
WHERE id IN (
  SELECT id FROM ranked_mastermind WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE mastermind_scores 
DROP CONSTRAINT IF EXISTS mastermind_scores_user_id_key;

ALTER TABLE mastermind_scores 
ADD CONSTRAINT mastermind_scores_user_id_key UNIQUE (user_id);

-- 2. Fix 2048 (best = highest score)
WITH ranked_2048 AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY score DESC, created_at ASC
    ) as rn
  FROM game_2048_scores
)
DELETE FROM game_2048_scores
WHERE id IN (
  SELECT id FROM ranked_2048 WHERE rn > 1
);

ALTER TABLE game_2048_scores 
DROP CONSTRAINT IF EXISTS game_2048_scores_user_id_key;

ALTER TABLE game_2048_scores 
ADD CONSTRAINT game_2048_scores_user_id_key UNIQUE (user_id);

-- 3. Fix Minesweeper (best = shortest time per difficulty)
WITH ranked_minesweeper AS (
  SELECT 
    id,
    user_id,
    difficulty,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, difficulty 
      ORDER BY time_seconds ASC, created_at ASC
    ) as rn
  FROM minesweeper_scores
)
DELETE FROM minesweeper_scores
WHERE id IN (
  SELECT id FROM ranked_minesweeper WHERE rn > 1
);

ALTER TABLE minesweeper_scores 
DROP CONSTRAINT IF EXISTS minesweeper_scores_user_difficulty_key;

ALTER TABLE minesweeper_scores 
ADD CONSTRAINT minesweeper_scores_user_difficulty_key UNIQUE (user_id, difficulty);

-- 4. Fix Lights Out (best = fewest moves per difficulty, then fewest hints, then shortest time)
WITH ranked_lights_out AS (
  SELECT 
    id,
    user_id,
    difficulty,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, difficulty 
      ORDER BY moves ASC, hints_used ASC, time_seconds ASC, created_at ASC
    ) as rn
  FROM lights_out_scores
)
DELETE FROM lights_out_scores
WHERE id IN (
  SELECT id FROM ranked_lights_out WHERE rn > 1
);

ALTER TABLE lights_out_scores 
DROP CONSTRAINT IF EXISTS lights_out_scores_user_difficulty_key;

ALTER TABLE lights_out_scores 
ADD CONSTRAINT lights_out_scores_user_difficulty_key UNIQUE (user_id, difficulty);

-- 5. Fix Sudoku (best = shortest time per difficulty)
WITH ranked_sudoku AS (
  SELECT 
    id,
    user_id,
    difficulty,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, difficulty 
      ORDER BY time_seconds ASC, created_at ASC
    ) as rn
  FROM sudoku_scores
)
DELETE FROM sudoku_scores
WHERE id IN (
  SELECT id FROM ranked_sudoku WHERE rn > 1
);

ALTER TABLE sudoku_scores 
DROP CONSTRAINT IF EXISTS sudoku_scores_user_difficulty_key;

ALTER TABLE sudoku_scores 
ADD CONSTRAINT sudoku_scores_user_difficulty_key UNIQUE (user_id, difficulty);

-- 6. Fix Pattern Match (best = highest score per round)
WITH ranked_pattern_match AS (
  SELECT 
    id,
    user_id,
    round,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, round 
      ORDER BY score DESC, created_at ASC
    ) as rn
  FROM pattern_match_scores
)
DELETE FROM pattern_match_scores
WHERE id IN (
  SELECT id FROM ranked_pattern_match WHERE rn > 1
);

ALTER TABLE pattern_match_scores 
DROP CONSTRAINT IF EXISTS pattern_match_scores_user_round_key;

ALTER TABLE pattern_match_scores 
ADD CONSTRAINT pattern_match_scores_user_round_key UNIQUE (user_id, round);
