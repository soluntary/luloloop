"use server"

import { createClient } from "@/lib/supabase/server"
import type {
  MastermindScore,
  Game2048Score,
  MinesweeperScore,
  PatternMatchScore,
  LightsOutScore,
  SudokuScore,
} from "@/lib/leaderboard-types"

// Mastermind Actions
export async function saveMastermindScore(attempts: number, timeSeconds: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Return without throwing error - allows game to continue
    return { success: false, message: "Please log in to save your score" }
  }

  // Get username from users table
  const { data: userData } = await supabase.from("users").select("username").eq("id", user.id).single()

  const username = userData?.username || user.email?.split("@")[0] || "Anonymous"

  const { error } = await supabase.from("mastermind_scores").insert({
    user_id: user.id,
    username,
    attempts,
    time_seconds: timeSeconds,
  })

  if (error) throw error
  return { success: true }
}

export async function getMastermindLeaderboard(limit = 50): Promise<MastermindScore[]> {
  const supabase = await createClient()

  // Get all scores, then filter to best per user
  const { data, error } = await supabase
    .from("mastermind_scores")
    .select("*")
    .order("attempts", { ascending: true })
    .order("time_seconds", { ascending: true })

  if (error) throw error
  
  // Filter to only best score per user
  const bestScores = new Map<string, MastermindScore>()
  for (const score of data || []) {
    const existing = bestScores.get(score.user_id)
    if (!existing || score.attempts < existing.attempts || 
        (score.attempts === existing.attempts && score.time_seconds < existing.time_seconds)) {
      bestScores.set(score.user_id, score)
    }
  }
  
  return Array.from(bestScores.values())
    .sort((a, b) => a.attempts - b.attempts || a.time_seconds - b.time_seconds)
    .slice(0, limit)
}

// 2048 Actions
export async function save2048Score(score: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Please log in to save your score" }
  }

  const { data: userData } = await supabase.from("users").select("username").eq("id", user.id).single()

  const username = userData?.username || user.email?.split("@")[0] || "Anonymous"

  const { error } = await supabase.from("game_2048_scores").insert({
    user_id: user.id,
    username,
    score,
  })

  if (error) throw error
  return { success: true }
}

export async function get2048Leaderboard(limit = 50): Promise<Game2048Score[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("game_2048_scores")
    .select("*")
    .order("score", { ascending: false })

  if (error) throw error
  
  // Filter to only best score per user (highest score)
  const bestScores = new Map<string, Game2048Score>()
  for (const score of data || []) {
    const existing = bestScores.get(score.user_id)
    if (!existing || score.score > existing.score) {
      bestScores.set(score.user_id, score)
    }
  }
  
  return Array.from(bestScores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

// Minesweeper Actions
export async function saveMinesweeperScore(difficulty: "easy" | "medium" | "hard", timeSeconds: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Please log in to save your score" }
  }

  const { data: userData } = await supabase.from("users").select("username").eq("id", user.id).single()

  const username = userData?.username || user.email?.split("@")[0] || "Anonymous"

  const { error } = await supabase.from("minesweeper_scores").insert({
    user_id: user.id,
    username,
    difficulty,
    time_seconds: timeSeconds,
  })

  if (error) throw error
  return { success: true }
}

export async function getMinesweeperLeaderboard(
  difficulty: "easy" | "medium" | "hard",
  limit = 50,
): Promise<MinesweeperScore[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("minesweeper_scores")
    .select("*")
    .eq("difficulty", difficulty)
    .order("time_seconds", { ascending: true })

  if (error) throw error
  
  // Filter to only best score per user (fastest time)
  const bestScores = new Map<string, MinesweeperScore>()
  for (const score of data || []) {
    const existing = bestScores.get(score.user_id)
    if (!existing || score.time_seconds < existing.time_seconds) {
      bestScores.set(score.user_id, score)
    }
  }
  
  return Array.from(bestScores.values())
    .sort((a, b) => a.time_seconds - b.time_seconds)
    .slice(0, limit)
}

// Pattern Match Actions
export async function savePatternMatchScore(round: number, score: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Please log in to save your score" }
  }

  const { data: userData } = await supabase.from("users").select("username").eq("id", user.id).single()

  const username = userData?.username || user.email?.split("@")[0] || "Anonymous"

  const { error } = await supabase.from("pattern_match_scores").insert({
    user_id: user.id,
    username,
    round,
    score,
  })

  if (error) throw error
  return { success: true }
}

export async function getPatternMatchLeaderboard(limit = 50): Promise<PatternMatchScore[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("pattern_match_scores")
    .select("*")
    .order("score", { ascending: false })
    .order("round", { ascending: false })

  if (error) throw error
  
  // Filter to only best score per user (highest score, then highest round)
  const bestScores = new Map<string, PatternMatchScore>()
  for (const score of data || []) {
    const existing = bestScores.get(score.user_id)
    if (!existing || score.score > existing.score || 
        (score.score === existing.score && score.round > existing.round)) {
      bestScores.set(score.user_id, score)
    }
  }
  
  return Array.from(bestScores.values())
    .sort((a, b) => b.score - a.score || b.round - a.round)
    .slice(0, limit)
}

// Lights Out Actions
export async function saveLightsOutScore(moves: number, hintsUsed: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Please log in to save your score" }
  }

  const { data: userData } = await supabase.from("users").select("username").eq("id", user.id).single()

  const username = userData?.username || user.email?.split("@")[0] || "Anonymous"

  const { error } = await supabase.from("lights_out_scores").insert({
    user_id: user.id,
    username,
    moves,
    hints_used: hintsUsed,
  })

  if (error) throw error
  return { success: true }
}

export async function getLightsOutLeaderboard(limit = 50): Promise<LightsOutScore[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("lights_out_scores")
    .select("*")
    .order("moves", { ascending: true })
    .order("hints_used", { ascending: true })

  if (error) throw error
  
  // Filter to only best score per user (fewest moves, then fewest hints)
  const bestScores = new Map<string, LightsOutScore>()
  for (const score of data || []) {
    const existing = bestScores.get(score.user_id)
    if (!existing || score.moves < existing.moves || 
        (score.moves === existing.moves && score.hints_used < existing.hints_used)) {
      bestScores.set(score.user_id, score)
    }
  }
  
  return Array.from(bestScores.values())
    .sort((a, b) => a.moves - b.moves || a.hints_used - b.hints_used)
    .slice(0, limit)
}

// Sudoku Actions
export async function saveSudokuScore(difficulty: "easy" | "medium" | "hard", timeSeconds: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Please log in to save your score" }
  }

  const { data: userData } = await supabase.from("users").select("username").eq("id", user.id).single()

  const username = userData?.username || user.email?.split("@")[0] || "Anonymous"

  const { error } = await supabase.from("sudoku_scores").insert({
    user_id: user.id,
    username,
    difficulty,
    time_seconds: timeSeconds,
  })

  if (error) throw error
  return { success: true }
}

export async function getSudokuLeaderboard(difficulty: "easy" | "medium" | "hard", limit = 50): Promise<SudokuScore[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("sudoku_scores")
    .select("*")
    .eq("difficulty", difficulty)
    .order("time_seconds", { ascending: true })

  if (error) throw error
  
  // Filter to only best score per user (fastest time)
  const bestScores = new Map<string, SudokuScore>()
  for (const score of data || []) {
    const existing = bestScores.get(score.user_id)
    if (!existing || score.time_seconds < existing.time_seconds) {
      bestScores.set(score.user_id, score)
    }
  }
  
  return Array.from(bestScores.values())
    .sort((a, b) => a.time_seconds - b.time_seconds)
    .slice(0, limit)
}
