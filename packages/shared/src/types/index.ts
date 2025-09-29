export interface User {
  id: string
  email: string
  username: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Game {
  id: string
  name: string
  description?: string
  min_players: number
  max_players: number
  duration_minutes?: number
  complexity_rating?: number
  image_url?: string
  created_at: string
}

export interface Event {
  id: string
  title: string
  description?: string
  game_id: string
  organizer_id: string
  location: string
  date_time: string
  max_participants: number
  current_participants: number
  status: "draft" | "published" | "cancelled" | "completed"
  created_at: string
  updated_at: string
}

export interface Group {
  id: string
  name: string
  description?: string
  owner_id: string
  is_private: boolean
  member_count: number
  created_at: string
  updated_at: string
}

export interface ApiResponse<T> {
  data: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
