-- Fix duplicate mastermind_scores entries
-- Keep only the best score for each user (lowest attempts, then lowest time)

-- First, delete all but the best entry for each user
DELETE FROM mastermind_scores
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM mastermind_scores
  ORDER BY user_id, attempts ASC, time_seconds ASC
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE mastermind_scores
ADD CONSTRAINT mastermind_scores_user_id_unique UNIQUE (user_id);
