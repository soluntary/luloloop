"use client"

import { createClient } from "@/lib/supabase/client"
import type {
  MastermindScore,
  Game2048Score,
  MinesweeperScore,
  PatternMatchScore,
  LightsOutScore,
  SudokuScore,
} from "@/lib/leaderboard-types"

// Mastermind Actions
export async function saveMastermindScore(data: { attempts: number; timeSeconds: number }) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Please log in to save your score" }
  }

  // Get username from users table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("username")
    .eq("id", user.id)
    .single()

  if (userError) {
    console.error("[v0] Error fetching username:", userError)
  }

  const username = userData?.username || user.email?.split("@")[0] || "Anonymous"

  // Check if user already has a score
  const { data: existingScore } = await supabase.from("mastermind_scores").select("*").eq("user_id", user.id).single()

  // Determine if new score is better (fewer attempts, or same attempts with less time)
  const isBetter =
    !existingScore ||
    data.attempts < existingScore.attempts ||
    (data.attempts === existingScore.attempts && data.timeSeconds < existingScore.time_seconds)

  if (!isBetter) {
    return { success: true, message: "Score not better than existing record" }
  }

  if (existingScore) {
    // Update existing score
    const { error } = await supabase
      .from("mastermind_scores")
      .update({
        username,
        attempts: data.attempts,
        time_seconds: data.timeSeconds,
        created_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    if (error) throw error
  } else {
    // Insert new score
    const { error } = await supabase.from("mastermind_scores").insert({
      user_id: user.id,
      username,
      attempts: data.attempts,
      time_seconds: data.timeSeconds,
    })

    if (error) throw error
  }

  return { success: true }
}

export async function getMastermindLeaderboard(limit = 50): Promise<MastermindScore[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("mastermind_scores")
    .select("*")
    .order("attempts", { ascending: true })
    .order("time_seconds", { ascending: true })

  if (error) {
    console.error("[v0] Error loading leaderboard:", error)
    throw error
  }

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
export async function save2048Score(data: { score: number }) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Please log in to save your score" }
  }

  const { data: userData } = await supabase.from("users").select("username").eq("id", user.id).single()

  const username = userData?.username || user.email?.split("@")[0] || "Anonymous"

  // Check if user already has a score
  const { data: existingScore } = await supabase.from("game_2048_scores").select("*").eq("user_id", user.id).single()

  // Only save if new score is better (higher)
  if (existingScore && data.score <= existingScore.score) {
    return { success: true, message: "Score not better than existing record" }
  }

  if (existingScore) {
    // Update existing score
    const { error } = await supabase
      .from("game_2048_scores")
      .update({
        username,
        score: data.score,
        created_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    if (error) throw error
  } else {
    // Insert new score
    const { error } = await supabase.from("game_2048_scores").insert({
      user_id: user.id,
      username,
      score: data.score,
    })

    if (error) throw error
  }

  return { success: true }
}

export async function get2048Leaderboard(limit = 50): Promise<Game2048Score[]> {
  const supabase = createClient()

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
export async function saveMinesweeperScore(data: { difficulty: "easy" | "medium" | "hard"; timeSeconds: number }) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Please log in to save your score" }
  }

  const { data: userData } = await supabase.from("users").select("username").eq("id", user.id).single()

  const username = userData?.username || user.email?.split("@")[0] || "Anonymous"

  // Check if user already has a score for this difficulty
  const { data: existingScore } = await supabase
    .from("minesweeper_scores")
    .select("*")
    .eq("user_id", user.id)
    .eq("difficulty", data.difficulty)
    .single()

  // Only save if new time is better (faster)
  if (existingScore && data.timeSeconds >= existingScore.time_seconds) {
    return { success: true, message: "Time not better than existing record" }
  }

  if (existingScore) {
    // Update existing score
    const { error } = await supabase
      .from("minesweeper_scores")
      .update({
        username,
        time_seconds: data.timeSeconds,
        created_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("difficulty", data.difficulty)

    if (error) throw error
  } else {
    // Insert new score
    const { error } = await supabase.from("minesweeper_scores").insert({
      user_id: user.id,
      username,
      difficulty: data.difficulty,
      time_seconds: data.timeSeconds,
    })

    if (error) throw error
  }

  return { success: true }
}

export async function getMinesweeperLeaderboard(
  difficulty: "easy" | "medium" | "hard",
  limit = 50,
): Promise<MinesweeperScore[]> {
  const supabase = createClient()

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
export async function savePatternMatchScore(data: { round: number; score: number }) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Please log in to save your score" }
  }

  const { data: userData } = await supabase.from("users").select("username").eq("id", user.id).single()

  const username = userData?.username || user.email?.split("@")[0] || "Anonymous"

  // Check if user already has a score
  const { data: existingScore } = await supabase
    .from("pattern_match_scores")
    .select("*")
    .eq("user_id", user.id)
    .single()

  // Only save if new score is better (higher score, or same score with higher round)
  const isBetter =
    !existingScore ||
    data.score > existingScore.score ||
    (data.score === existingScore.score && data.round > existingScore.round)

  if (!isBetter) {
    return { success: true, message: "Score not better than existing record" }
  }

  if (existingScore) {
    // Update existing score
    const { error } = await supabase
      .from("pattern_match_scores")
      .update({
        username,
        round: data.round,
        score: data.score,
        created_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    if (error) throw error
  } else {
    // Insert new score
    const { error } = await supabase.from("pattern_match_scores").insert({
      user_id: user.id,
      username,
      round: data.round,
      score: data.score,
    })

    if (error) throw error
  }

  return { success: true }
}

export async function getPatternMatchLeaderboard(limit = 50): Promise<PatternMatchScore[]> {
  const supabase = createClient()

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
export async function saveLightsOutScore(data: {
  difficulty: "easy" | "medium" | "hard"
  moves: number
  hintsUsed: number
  timeSeconds: number
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Please log in to save your score" }
  }

  const { data: userData } = await supabase.from("users").select("username").eq("id", user.id).single()

  const username = userData?.username || user.email?.split("@")[0] || "Anonymous"

  // Check if user already has a score for this difficulty
  const { data: existingScore } = await supabase
    .from("lights_out_scores")
    .select("*")
    .eq("user_id", user.id)
    .eq("difficulty", data.difficulty)
    .single()

  // Only save if new score is better (fewer moves, or same moves with less time)
  const isBetter =
    !existingScore ||
    data.moves < existingScore.moves ||
    (data.moves === existingScore.moves && data.timeSeconds < existingScore.time_seconds)

  if (!isBetter) {
    return { success: true, message: "Score not better than existing record" }
  }

  if (existingScore) {
    // Update existing score
    const { error } = await supabase
      .from("lights_out_scores")
      .update({
        username,
        moves: data.moves,
        hints_used: data.hintsUsed,
        time_seconds: data.timeSeconds,
        created_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("difficulty", data.difficulty)

    if (error) throw error
  } else {
    // Insert new score
    const { error } = await supabase.from("lights_out_scores").insert({
      user_id: user.id,
      username,
      difficulty: data.difficulty,
      moves: data.moves,
      hints_used: data.hintsUsed,
      time_seconds: data.timeSeconds,
    })

    if (error) throw error
  }

  return { success: true }
}

export async function getLightsOutLeaderboard(
  difficulty: "easy" | "medium" | "hard",
  limit = 50,
): Promise<LightsOutScore[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("lights_out_scores")
    .select("*")
    .eq("difficulty", difficulty)
    .order("moves", { ascending: true })
    .order("time_seconds", { ascending: true })

  if (error) throw error
  
  // Filter to only best score per user (fewest moves, then fastest time)
  const bestScores = new Map<string, LightsOutScore>()
  for (const score of data || []) {
    const existing = bestScores.get(score.user_id)
    if (!existing || score.moves < existing.moves || 
        (score.moves === existing.moves && score.time_seconds < existing.time_seconds)) {
      bestScores.set(score.user_id, score)
    }
  }
  
  return Array.from(bestScores.values())
    .sort((a, b) => a.moves - b.moves || a.time_seconds - b.time_seconds)
    .slice(0, limit)
}

// Sudoku Actions
export async function saveSudokuScore(data: { difficulty: "easy" | "medium" | "hard"; timeSeconds: number }) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Please log in to save your score" }
  }

  const { data: userData } = await supabase.from("users").select("username").eq("id", user.id).single()

  const username = userData?.username || user.email?.split("@")[0] || "Anonymous"

  // Check if user already has a score for this difficulty
  const { data: existingScore } = await supabase
    .from("sudoku_scores")
    .select("*")
    .eq("user_id", user.id)
    .eq("difficulty", data.difficulty)
    .single()

  // Only save if new time is better (faster)
  if (existingScore && data.timeSeconds >= existingScore.time_seconds) {
    return { success: true, message: "Time not better than existing record" }
  }

  if (existingScore) {
    // Update existing score
    const { error } = await supabase
      .from("sudoku_scores")
      .update({
        username,
        time_seconds: data.timeSeconds,
        created_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("difficulty", data.difficulty)

    if (error) throw error
  } else {
    // Insert new score
    const { error } = await supabase.from("sudoku_scores").insert({
      user_id: user.id,
      username,
      difficulty: data.difficulty,
      time_seconds: data.timeSeconds,
    })

    if (error) throw error
  }

  return { success: true }
}

export async function getSudokuLeaderboard(difficulty: "easy" | "medium" | "hard", limit = 50): Promise<SudokuScore[]> {
  const supabase = createClient()

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
