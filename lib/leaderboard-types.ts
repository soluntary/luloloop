export type MastermindScore = {
  id: string
  user_id: string
  username: string
  attempts: number
  time_seconds: number
  created_at: string
}

export type Game2048Score = {
  id: string
  user_id: string
  username: string
  score: number
  created_at: string
}

export type MinesweeperScore = {
  id: string
  user_id: string
  username: string
  difficulty: "easy" | "medium" | "hard"
  time_seconds: number
  created_at: string
}

export type PatternMatchScore = {
  id: string
  user_id: string
  username: string
  round: number
  score: number
  created_at: string
}

export type LightsOutScore = {
  id: string
  user_id: string
  username: string
  moves: number
  hints_used: number
  created_at: string
}

export type SudokuScore = {
  id: string
  user_id: string
  username: string
  difficulty: "easy" | "medium" | "hard"
  time_seconds: number
  created_at: string
}
