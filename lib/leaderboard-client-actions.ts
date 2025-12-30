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
export async function saveMastermindScore(attempts: number, timeSeconds: number) {
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
    attempts < existingScore.attempts ||
    (attempts === existingScore.attempts && timeSeconds < existingScore.time_seconds)

  if (!isBetter) {
    return { success: true, message: "Score not better than existing record" }
  }

  if (existingScore) {
    // Update existing score
    const { error } = await supabase
      .from("mastermind_scores")
      .update({
        username,
        attempts,
        time_seconds: timeSeconds,
        created_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    if (error) throw error
  } else {
    // Insert new score
    const { error } = await supabase.from("mastermind_scores").insert({
      user_id: user.id,
      username,
      attempts,
      time_seconds: timeSeconds,
    })

    if (error) throw error
  }

  return { success: true }
}

export async function getMastermindLeaderboard(limit = 10): Promise<MastermindScore[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("mastermind_scores")
    .select("*")
    .order("attempts", { ascending: true })
    .order("time_seconds", { ascending: true })
    .limit(limit)

  if (error) {
    console.error("[v0] Error loading leaderboard:", error)
    throw error
  }

  return data || []
}

// 2048 Actions
export async function save2048Score(score: number) {
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
  if (existingScore && score <= existingScore.score) {
    return { success: true, message: "Score not better than existing record" }
  }

  if (existingScore) {
    // Update existing score
    const { error } = await supabase
      .from("game_2048_scores")
      .update({
        username,
        score,
        created_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    if (error) throw error
  } else {
    // Insert new score
    const { error } = await supabase.from("game_2048_scores").insert({
      user_id: user.id,
      username,
      score,
    })

    if (error) throw error
  }

  return { success: true }
}

export async function get2048Leaderboard(limit = 10): Promise<Game2048Score[]> {
  const supabase = createClient()

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
    .eq("difficulty", difficulty)
    .single()

  // Only save if new time is better (faster)
  if (existingScore && timeSeconds >= existingScore.time_seconds) {
    return { success: true, message: "Time not better than existing record" }
  }

  if (existingScore) {
    // Update existing score
    const { error } = await supabase
      .from("minesweeper_scores")
      .update({
        username,
        time_seconds: timeSeconds,
        created_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("difficulty", difficulty)

    if (error) throw error
  } else {
    // Insert new score
    const { error } = await supabase.from("minesweeper_scores").insert({
      user_id: user.id,
      username,
      difficulty,
      time_seconds: timeSeconds,
    })

    if (error) throw error
  }

  return { success: true }
}

export async function getMinesweeperLeaderboard(
  difficulty: "easy" | "medium" | "hard",
  limit = 10,
): Promise<MinesweeperScore[]> {
  const supabase = createClient()

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
    !existingScore || score > existingScore.score || (score === existingScore.score && round > existingScore.round)

  if (!isBetter) {
    return { success: true, message: "Score not better than existing record" }
  }

  if (existingScore) {
    // Update existing score
    const { error } = await supabase
      .from("pattern_match_scores")
      .update({
        username,
        round,
        score,
        created_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    if (error) throw error
  } else {
    // Insert new score
    const { error } = await supabase.from("pattern_match_scores").insert({
      user_id: user.id,
      username,
      round,
      score,
    })

    if (error) throw error
  }

  return { success: true }
}

export async function getPatternMatchLeaderboard(limit = 10): Promise<PatternMatchScore[]> {
  const supabase = createClient()

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
export async function saveLightsOutScore(difficulty: "easy" | "medium" | "hard", moves: number, hintsUsed: number) {
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
    .eq("difficulty", difficulty)
    .single()

  // Only save if new score is better (fewer moves, or same moves with fewer hints)
  const isBetter =
    !existingScore ||
    moves < existingScore.moves ||
    (moves === existingScore.moves && hintsUsed < existingScore.hints_used)

  if (!isBetter) {
    return { success: true, message: "Score not better than existing record" }
  }

  if (existingScore) {
    // Update existing score
    const { error } = await supabase
      .from("lights_out_scores")
      .update({
        username,
        moves,
        hints_used: hintsUsed,
        created_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("difficulty", difficulty)

    if (error) throw error
  } else {
    // Insert new score
    const { error } = await supabase.from("lights_out_scores").insert({
      user_id: user.id,
      username,
      difficulty,
      moves,
      hints_used: hintsUsed,
    })

    if (error) throw error
  }

  return { success: true }
}

export async function getLightsOutLeaderboard(
  difficulty: "easy" | "medium" | "hard",
  limit = 10,
): Promise<LightsOutScore[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("lights_out_scores")
    .select("*")
    .eq("difficulty", difficulty)
    .order("moves", { ascending: true })
    .order("hints_used", { ascending: true })
    .limit(limit)

  if (error) throw error
  return data || []
}

// Sudoku Actions
export async function saveSudokuScore(difficulty: "easy" | "medium" | "hard", timeSeconds: number) {
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
    .eq("difficulty", difficulty)
    .single()

  // Only save if new time is better (faster)
  if (existingScore && timeSeconds >= existingScore.time_seconds) {
    return { success: true, message: "Time not better than existing record" }
  }

  if (existingScore) {
    // Update existing score
    const { error } = await supabase
      .from("sudoku_scores")
      .update({
        username,
        time_seconds: timeSeconds,
        created_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("difficulty", difficulty)

    if (error) throw error
  } else {
    // Insert new score
    const { error } = await supabase.from("sudoku_scores").insert({
      user_id: user.id,
      username,
      difficulty,
      time_seconds: timeSeconds,
    })

    if (error) throw error
  }

  return { success: true }
}

export async function getSudokuLeaderboard(difficulty: "easy" | "medium" | "hard", limit = 10): Promise<SudokuScore[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("sudoku_scores")
    .select("*")
    .eq("difficulty", difficulty)
    .order("time_seconds", { ascending: true })
    .limit(limit)

  if (error) throw error
  return data || []
}
