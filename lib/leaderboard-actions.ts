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

export async function getMastermindLeaderboard(limit = 10): Promise<MastermindScore[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("mastermind_scores")
    .select("*")
    .order("attempts", { ascending: true })
    .order("time_seconds", { ascending: true })
    .limit(limit)

  if (error) throw error
  return data || []
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

export async function get2048Leaderboard(limit = 10): Promise<Game2048Score[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("game_2048_scores")
    .select("*")
    .order("score", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
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
  limit = 10,
): Promise<MinesweeperScore[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("minesweeper_scores")
    .select("*")
    .eq("difficulty", difficulty)
    .order("time_seconds", { ascending: true })
    .limit(limit)

  if (error) throw error
  return data || []
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

export async function getPatternMatchLeaderboard(limit = 10): Promise<PatternMatchScore[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("pattern_match_scores")
    .select("*")
    .order("score", { ascending: false })
    .order("round", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
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

export async function getLightsOutLeaderboard(limit = 10): Promise<LightsOutScore[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("lights_out_scores")
    .select("*")
    .order("moves", { ascending: true })
    .order("hints_used", { ascending: true })
    .limit(limit)

  if (error) throw error
  return data || []
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

export async function getSudokuLeaderboard(difficulty: "easy" | "medium" | "hard", limit = 10): Promise<SudokuScore[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("sudoku_scores")
    .select("*")
    .eq("difficulty", difficulty)
    .order("time_seconds", { ascending: true })
    .limit(limit)

  if (error) throw error
  return data || []
}
