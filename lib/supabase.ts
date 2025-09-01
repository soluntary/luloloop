import { createBrowserClient, createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import type { cookies } from "next/headers"
import { cache } from "react"

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  const isConfigured = !!(
    url &&
    key &&
    url !== "https://placeholder.supabase.co" &&
    key !== "placeholder-key" &&
    !url.includes("placeholder") &&
    !key.includes("placeholder")
  )

  return { url, key, isConfigured }
}

let browserClientInstance: any = null
let mockClientInstance: any = null

function createMockClient() {
  if (mockClientInstance) return mockClientInstance

  mockClientInstance = {
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          order: (column: string, options?: any) => ({
            single: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
            then: (resolve: any) => resolve({ data: [], error: null }),
          }),
          single: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
          then: (resolve: any) => resolve({ data: [], error: null }),
        }),
        neq: (column: string, value: any) => ({
          order: (column: string, options?: any) => ({
            then: (resolve: any) => resolve({ data: [], error: null }),
          }),
          then: (resolve: any) => resolve({ data: [], error: null }),
        }),
        order: (column: string, options?: any) => ({
          then: (resolve: any) => resolve({ data: [], error: null }),
        }),
        then: (resolve: any) => resolve({ data: [], error: null }),
      }),
      insert: (data: any) => ({
        select: () => ({
          then: (resolve: any) => resolve({ data: [], error: { message: "Supabase not configured" } }),
        }),
        then: (resolve: any) => resolve({ data: [], error: { message: "Supabase not configured" } }),
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: () => ({
            then: (resolve: any) => resolve({ data: [], error: { message: "Supabase not configured" } }),
          }),
          then: (resolve: any) => resolve({ data: [], error: { message: "Supabase not configured" } }),
        }),
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({
          then: (resolve: any) => resolve({ data: [], error: { message: "Supabase not configured" } }),
        }),
      }),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () =>
        Promise.resolve({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
      signUp: () =>
        Promise.resolve({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  }

  return mockClientInstance
}

export function createClient() {
  const { url, key, isConfigured } = getSupabaseConfig()

  console.log("[v0] Supabase configuration check:", {
    hasUrl: !!url,
    hasKey: !!key,
    isConfigured,
    url: url ? `${url.substring(0, 20)}...` : "undefined",
  })

  if (!isConfigured) {
    return createMockClient()
  }

  if (browserClientInstance) return browserClientInstance

  browserClientInstance = createBrowserClient(url!, key!, {
    cookies: {
      getAll() {
        if (typeof document === "undefined" || !document.cookie) {
          return []
        }

        try {
          return document.cookie
            .split(";")
            .map((cookie) => cookie.trim().split("="))
            .filter(([name]) => name)
            .map(([name, value]) => ({ name, value: decodeURIComponent(value || "") }))
        } catch (error) {
          console.warn("[v0] Cookie parsing error:", error)
          return []
        }
      },
      setAll(cookiesToSet) {
        if (typeof document === "undefined") {
          return
        }

        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = []
            if (options?.maxAge) cookieOptions.push(`max-age=${options.maxAge}`)
            if (options?.path) cookieOptions.push(`path=${options.path}`)
            if (options?.domain) cookieOptions.push(`domain=${options.domain}`)
            if (options?.secure) cookieOptions.push("secure")
            if (options?.httpOnly) cookieOptions.push("httponly")
            if (options?.sameSite) cookieOptions.push(`samesite=${options.sameSite}`)

            const cookieString = `${name}=${encodeURIComponent(value || "")}${cookieOptions.length ? "; " + cookieOptions.join("; ") : ""}`
            document.cookie = cookieString
          })
        } catch (error) {
          console.warn("[v0] Cookie setting error:", error)
        }
      },
    },
  })

  return browserClientInstance
}

export function createServerClient(cookieStore: ReturnType<typeof cookies>) {
  const { url, key, isConfigured } = getSupabaseConfig()

  if (!isConfigured) {
    return createMockClient()
  }

  if (!cookieStore) {
    // Return a client without cookie handling if cookies are not available
    return createSupabaseServerClient(url!, key!, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // No-op when cookies are not available
        },
      },
    })
  }

  return createSupabaseServerClient(url!, key!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

export const supabase = createClient()

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

// Create a cached version of the Supabase client for Server Components
export const createServerClientFunc = cache(createServerClient)
