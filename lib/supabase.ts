import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Client-side Supabase client (singleton pattern)
let supabaseClient: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  }
  return supabaseClient
}

// Server-side Supabase client
export const createServerClient = () => {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar: string | null
          bio: string | null
          website: string | null
          twitter: string | null
          instagram: string | null
          settings: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          avatar?: string | null
          bio?: string | null
          website?: string | null
          twitter?: string | null
          instagram?: string | null
          settings?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar?: string | null
          bio?: string | null
          website?: string | null
          twitter?: string | null
          instagram?: string | null
          settings?: any
          created_at?: string
          updated_at?: string
        }
      }
      games: {
        Row: {
          id: string
          user_id: string
          title: string
          publisher: string | null
          condition: string
          players: string | null
          duration: string | null
          age: string | null
          language: string | null
          available: string[]
          image: string | null
          type: string | null
          style: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          publisher?: string | null
          condition: string
          players?: string | null
          duration?: string | null
          age?: string | null
          language?: string | null
          available?: string[]
          image?: string | null
          type?: string | null
          style?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          publisher?: string | null
          condition?: string
          players?: string | null
          duration?: string | null
          age?: string | null
          language?: string | null
          available?: string[]
          image?: string | null
          type?: string | null
          style?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      marketplace_offers: {
        Row: {
          id: string
          user_id: string
          game_id: string | null
          title: string
          publisher: string | null
          condition: string
          type: "lend" | "trade" | "sell"
          price: string | null
          location: string | null
          distance: string | null
          description: string | null
          image: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          game_id?: string | null
          title: string
          publisher?: string | null
          condition: string
          type: "lend" | "trade" | "sell"
          price?: string | null
          location?: string | null
          distance?: string | null
          description?: string | null
          image?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          game_id?: string | null
          title?: string
          publisher?: string | null
          condition?: string
          type?: "lend" | "trade" | "sell"
          price?: string | null
          location?: string | null
          distance?: string | null
          description?: string | null
          image?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          game_title: string | null
          game_id: string | null
          offer_type: "lend" | "trade" | "sell" | null
          message: string
          game_image: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          game_title?: string | null
          game_id?: string | null
          offer_type?: "lend" | "trade" | "sell" | null
          message: string
          game_image?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          game_title?: string | null
          game_id?: string | null
          offer_type?: "lend" | "trade" | "sell" | null
          message?: string
          game_image?: string | null
          read?: boolean
          created_at?: string
        }
      }
      friends: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: "pending" | "accepted" | "blocked"
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status?: "pending" | "accepted" | "blocked"
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: "pending" | "accepted" | "blocked"
          created_at?: string
        }
      }
      friend_requests: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          message: string | null
          status: "pending" | "accepted" | "declined"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          message?: string | null
          status?: "pending" | "accepted" | "declined"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          message?: string | null
          status?: "pending" | "accepted" | "declined"
          created_at?: string
          updated_at?: string
        }
      }
      communities: {
        Row: {
          id: string
          creator_id: string
          name: string
          description: string | null
          type: "recurring" | "family" | "campaign" | "casual" | null
          location: string | null
          next_meeting: string | null
          max_members: number | null
          games: string[] | null
          image: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          name: string
          description?: string | null
          type?: "recurring" | "family" | "campaign" | "casual" | null
          location?: string | null
          next_meeting?: string | null
          max_members?: number | null
          games?: string[] | null
          image?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          name?: string
          description?: string | null
          type?: "recurring" | "family" | "campaign" | "casual" | null
          location?: string | null
          next_meeting?: string | null
          max_members?: number | null
          games?: string[] | null
          image?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      community_members: {
        Row: {
          id: string
          community_id: string
          user_id: string
          role: "creator" | "admin" | "member"
          joined_at: string
        }
        Insert: {
          id?: string
          community_id: string
          user_id: string
          role?: "creator" | "admin" | "member"
          joined_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          user_id?: string
          role?: "creator" | "admin" | "member"
          joined_at?: string
        }
      }
      community_events: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string | null
          frequency: "einmalig" | "regelmäßig"
          fixed_date: string | null
          fixed_time_from: string | null
          fixed_time_to: string | null
          location: string
          max_participants: number | null
          visibility: "public" | "friends"
          approval_mode: "automatic" | "manual"
          rules: string | null
          additional_info: string | null
          image_url: string | null
          selected_games: any
          custom_games: string[]
          selected_friends: string[]
          time_slots: any
          use_time_slots: boolean
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description?: string | null
          frequency: "einmalig" | "regelmäßig"
          fixed_date?: string | null
          fixed_time_from?: string | null
          fixed_time_to?: string | null
          location: string
          max_participants?: number | null
          visibility: "public" | "friends"
          approval_mode?: "automatic" | "manual"
          rules?: string | null
          additional_info?: string | null
          image_url?: string | null
          selected_games?: any
          custom_games?: string[]
          selected_friends?: string[]
          time_slots?: any
          use_time_slots?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          description?: string | null
          frequency?: "einmalig" | "regelmäßig"
          fixed_date?: string | null
          fixed_time_from?: string | null
          fixed_time_to?: string | null
          location?: string
          max_participants?: number | null
          visibility?: "public" | "friends"
          approval_mode?: "automatic" | "manual"
          rules?: string | null
          additional_info?: string | null
          image_url?: string | null
          selected_games?: any
          custom_games?: string[]
          selected_friends?: string[]
          time_slots?: any
          use_time_slots?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      community_event_participants: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: "pending" | "approved" | "declined" | "joined"
          joined_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          status?: "pending" | "approved" | "declined" | "joined"
          joined_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          status?: "pending" | "approved" | "declined" | "joined"
          joined_at?: string
        }
      }
    }
  }
}
