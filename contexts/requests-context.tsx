"use client"
// force rebuild v2
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "./auth-context"
import { useFriends } from "./friends-context"
import { withRateLimit, checkGlobalRateLimit } from "@/lib/supabase/rate-limit"
import { createNotificationIfEnabled } from "@/app/actions/notification-helpers"

interface ShelfAccessRequest {
  id: string
  requester_id: string
  owner_id: string
  status: "pending" | "approved" | "denied"
  message?: string
  created_at: string
  updated_at: string
  requester?: {
    id: string
    name: string
    avatar?: string
  }
  owner?: {
    id: string
    name: string
    avatar?: string
  }
}

interface GameInteractionRequest {
  id: string
  requester_id: string
  owner_id: string
  game_id: string
  request_type: "trade" | "buy" | "rent"
  status: "pending" | "approved" | "denied" | "completed"
  message?: string
  offered_game_id?: string
  offered_price?: number
  rental_duration_days?: number
  created_at: string
  updated_at: string
  requester?: {
    id: string
    name: string
    avatar?: string
  }
  owner?: {
    id: string
    name: string
    avatar?: string
  }
  game?: {
    id: string
    title: string
    image?: string
  }
  offered_game?: {
    id: string
    title: string
    image?: string
  }
}

interface RequestsContextType {
  shelfAccessRequests: ShelfAccessRequest[]
  gameInteractionRequests: GameInteractionRequest[]
  loading: boolean
  error: string | null
  sendShelfAccessRequest: (ownerId: string, message?: string) => Promise<void>
  respondToShelfAccessRequest: (requestId: string, status: "approved" | "denied") => Promise<void>
  sendGameInteractionRequest: (data: {
    ownerId: string
    gameId: string
    requestType: "trade" | "buy" | "rent"
    message?: string
    offeredGameId?: string
    offeredPrice?: number
    rentalDurationDays?: number
  }) => Promise<void>
  respondToGameInteractionRequest: (requestId: string, status: "approved" | "denied") => Promise<void>
  getShelfAccessStatus: (ownerId: string) => "none" | "pending" | "approved" | "denied"
  canViewShelf: (ownerId: string, ownerSettings?: any) => boolean
  refreshRequests: () => Promise<void>
}

const RequestsContext = createContext<RequestsContextType | undefined>(undefined)

export function RequestsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { getFriendshipStatus } = useFriends()
  const [shelfAccessRequests, setShelfAccessRequests] = useState<ShelfAccessRequest[]>([])
  const [gameInteractionRequests, setGameInteractionRequests] = useState<GameInteractionRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const getSupabase = useCallback(() => {
    return createClient()
  }, [])

  // Load shelf access requests
  const loadShelfAccessRequests = useCallback(async () => {
    if (!user) return
    const supabase = getSupabase()

    if (checkGlobalRateLimit()) {
      // removed debug Requests: Skipping shelf access requests load due to rate limiting")
      return
    }

    try {
      const data = await withRateLimit(async () => {
        const { data, error } = await supabase
          .from("shelf_access_requests")
          .select(`
            *,
            requester:users!shelf_access_requests_requester_id_fkey(id, name, avatar),
            owner:users!shelf_access_requests_owner_id_fkey(id, name, avatar)
          `)
          .or(`requester_id.eq.${user.id},owner_id.eq.${user.id}`)
          .order("created_at", { ascending: false })

        if (error) throw error
        return data || []
      }, [])

      setShelfAccessRequests(data)
    } catch (err: any) {
      if (
        err.message?.includes("Rate limited") ||
        err.message?.includes("Too Many R") ||
        err.message?.includes("Unexpected token") ||
        err.name === "SyntaxError"
      ) {
        // removed debug Shelf access requests loading rate limited, using empty fallback")
        return
      }
      console.error("Error loading shelf access requests:", err)
      setError("Fehler beim Laden der Spielregal-Anfragen")
    }
  }, [user])

  // Load game interaction requests
  const loadGameInteractionRequests = useCallback(async () => {
    if (!user) return
    const supabase = getSupabase()

    if (checkGlobalRateLimit()) {
      return
    }

    try {
      const data = await withRateLimit(async () => {
        const { data, error } = await supabase
          .from("game_interaction_requests")
          .select(`
            *,
            requester:users!game_interaction_requests_requester_id_fkey(id, name, avatar),
            owner:users!game_interaction_requests_owner_id_fkey(id, name, avatar),
            game:games!game_interaction_requests_game_id_fkey(id, title, image),
            offered_game:games!game_interaction_requests_offered_game_id_fkey(id, title, image)
          `)
          .or(`requester_id.eq.${user.id},owner_id.eq.${user.id}`)
          .order("created_at", { ascending: false })

        if (error) throw error
        return data || []
      }, [])

      setGameInteractionRequests(data)
    } catch (err: any) {
      if (
        err.message?.includes("Rate limited") ||
        err.message?.includes("Too Many R") ||
        err.message?.includes("Unexpected token") ||
        err.name === "SyntaxError"
      ) {
        // removed debug Game interaction requests loading rate limited, using empty fallback")
        return
      }
      console.error("Error loading game interaction requests:", err)
      setError("Fehler beim Laden der Spiel-Anfragen")
    }
  }, [user])

  // Send shelf access request
  const sendShelfAccessRequest = async (ownerId: string, message?: string) => {
    if (!user) throw new Error("User not authenticated")
    const supabase = getSupabase()

    try {
      await withRateLimit(async () => {
        const { error } = await supabase.from("shelf_access_requests").insert([
          {
            requester_id: user.id,
            owner_id: ownerId,
            message: message || null,
          },
        ])

        if (error) throw error

        const { data: userData } = await supabase.from("users").select("username, name").eq("id", user.id).single()

        const requesterName = userData?.username || userData?.name || "Ein Nutzer"

        await createNotificationIfEnabled(
          ownerId,
          "game_shelf_request",
          "Neue Spielregal-Anfrage",
          `${requesterName} möchte Zugriff auf dein Spielregal`,
          {
            requester_id: user.id,
            requester_name: requesterName,
          },
        )
      })

      await loadShelfAccessRequests()
    } catch (err: any) {
      if (
        err.message?.includes("Rate limited") ||
        err.message?.includes("Too Many R") ||
        err.message?.includes("Unexpected token") ||
        err.name === "SyntaxError"
      ) {
        throw new Error("Zu viele Anfragen. Bitte versuchen Sie es später erneut.")
      }
      console.error("Error sending shelf access request:", err)
      throw new Error("Fehler beim Senden der Spielregal-Anfrage")
    }
  }

  // Respond to shelf access request
  const respondToShelfAccessRequest = async (requestId: string, status: "approved" | "denied") => {
    if (!user) throw new Error("User not authenticated")
    const supabase = getSupabase()

    try {
      await withRateLimit(async () => {
        const { data: request } = await supabase
          .from("shelf_access_requests")
          .select("requester_id, owner_id")
          .eq("id", requestId)
          .single()

        const { error } = await supabase
          .from("shelf_access_requests")
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", requestId)
          .eq("owner_id", user.id)

        if (error) throw error

        if (request) {
          const { data: userData } = await supabase.from("users").select("username, name").eq("id", user.id).single()

          const ownerName = userData?.username || userData?.name || "Ein Nutzer"

          await createNotificationIfEnabled(
            request.requester_id,
            "game_shelf_request",
            status === "approved" ? "Spielregal-Zugriff gewährt" : "Spielregal-Zugriff abgelehnt",
            status === "approved"
              ? `${ownerName} hat dir Zugriff auf das Spielregal gewährt`
              : `${ownerName} hat deine Spielregal-Anfrage abgelehnt`,
            {
              owner_id: user.id,
              owner_name: ownerName,
            },
          )
        }
      })

      await loadShelfAccessRequests()
    } catch (err: any) {
      if (err.message?.includes("Rate limited")) {
        throw new Error("Zu viele Anfragen. Bitte versuchen Sie es später erneut.")
      }
      console.error("Error responding to shelf access request:", err)
      throw new Error("Fehler beim Antworten auf die Spielregal-Anfrage")
    }
  }

  // Send game interaction request
  const sendGameInteractionRequest = async (data: {
    ownerId: string
    gameId: string
    requestType: "trade" | "buy" | "rent"
    message?: string
    offeredGameId?: string
    offeredPrice?: number
    rentalDurationDays?: number
  }) => {
    if (!user) throw new Error("User not authenticated")
    const supabase = getSupabase()

    try {
      await withRateLimit(async () => {
        const { error } = await supabase.from("game_interaction_requests").insert([
          {
            requester_id: user.id,
            owner_id: data.ownerId,
            game_id: data.gameId,
            request_type: data.requestType,
            message: data.message || null,
            offered_game_id: data.offeredGameId || null,
            offered_price: data.offeredPrice || null,
            rental_duration_days: data.rentalDurationDays || null,
          },
        ])

        if (error) throw error

        // Get requester and game info for notification
        const { data: userData } = await supabase.from("users").select("username, name").eq("id", user.id).single()
        const { data: gameData } = await supabase.from("games").select("title").eq("id", data.gameId).single()

        const requesterName = userData?.username || userData?.name || "Ein Nutzer"
        const gameTitle = gameData?.title || "ein Spiel"

        const requestTypeText =
          data.requestType === "trade" ? "tauschen" : data.requestType === "buy" ? "kaufen" : "mieten"

        await createNotificationIfEnabled(
          data.ownerId,
          "game_shelf_request", // Using existing type that maps to shelf_access_requests preference
          "Neue Spielanfrage",
          `${requesterName} möchte "${gameTitle}" ${requestTypeText}`,
          {
            requester_id: user.id,
            requester_name: requesterName,
            game_id: data.gameId,
            game_title: gameTitle,
            request_type: data.requestType,
          },
        )
      })

      await loadGameInteractionRequests()
    } catch (err: any) {
      if (
        err.message?.includes("Rate limited") ||
        err.message?.includes("Too Many R") ||
        err.message?.includes("Unexpected token") ||
        err.name === "SyntaxError"
      ) {
        throw new Error("Zu viele Anfragen. Bitte versuchen Sie es später erneut.")
      }
      console.error("Error sending game interaction request:", err)
      throw new Error("Fehler beim Senden der Spiel-Anfrage")
    }
  }

  // Respond to game interaction request
  const respondToGameInteractionRequest = async (requestId: string, status: "approved" | "denied") => {
    if (!user) throw new Error("User not authenticated")
    const supabase = getSupabase()

    try {
      await withRateLimit(async () => {
        const { data: request } = await supabase
          .from("game_interaction_requests")
          .select(`
            requester_id, 
            owner_id, 
            request_type,
            game:games!game_interaction_requests_game_id_fkey(title)
          `)
          .eq("id", requestId)
          .single()

        const { error } = await supabase
          .from("game_interaction_requests")
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", requestId)
          .eq("owner_id", user.id)

        if (error) throw error

        if (request) {
          const { data: userData } = await supabase.from("users").select("username, name").eq("id", user.id).single()
          const ownerName = userData?.username || userData?.name || "Ein Nutzer"
          const gameTitle = (request.game as any)?.title || "das Spiel"
          const requestTypeText =
            request.request_type === "trade" ? "Tausch" : request.request_type === "buy" ? "Kauf" : "Miete"

          await createNotificationIfEnabled(
            request.requester_id,
            "game_shelf_request",
            status === "approved" ? `${requestTypeText}-Anfrage angenommen` : `${requestTypeText}-Anfrage abgelehnt`,
            status === "approved"
              ? `${ownerName} hat deine Anfrage für "${gameTitle}" angenommen`
              : `${ownerName} hat deine Anfrage für "${gameTitle}" abgelehnt`,
            {
              owner_id: user.id,
              owner_name: ownerName,
              game_title: gameTitle,
              request_type: request.request_type,
              status,
            },
          )
        }
      })

      await loadGameInteractionRequests()
    } catch (err: any) {
      if (err.message?.includes("Rate limited")) {
        throw new Error("Zu viele Anfragen. Bitte versuchen Sie es später erneut.")
      }
      console.error("Error responding to game interaction request:", err)
      throw new Error("Fehler beim Antworten auf die Spiel-Anfrage")
    }
  }

  // Get shelf access status for a specific owner
  const getShelfAccessStatus = (ownerId: string): "none" | "pending" | "approved" | "denied" => {
    if (!user) return "none"

    const request = shelfAccessRequests.find((req) => req.requester_id === user.id && req.owner_id === ownerId)

    return request?.status || "none"
  }

  // Check if user can view shelf based on privacy settings and access requests
  const canViewShelf = (ownerId: string, ownerSettings?: any): boolean => {
    if (!user) return false
    if (user.id === ownerId) return true // Own shelf

    const libraryVisibility = ownerSettings?.privacy?.libraryVisibility || "private"

    if (libraryVisibility === "public") return true
    if (libraryVisibility === "private") {
      // Check if access was granted
      const accessStatus = getShelfAccessStatus(ownerId)
      return accessStatus === "approved"
    }
    if (libraryVisibility === "friends") {
      // Check if the current user is friends with the owner
      const friendshipStatus = getFriendshipStatus(ownerId)
      return friendshipStatus === "friends"
    }

    return false
  }

  // Refresh all requests
  const refreshRequests = useCallback(async () => {
    if (checkGlobalRateLimit()) {
      // removed debug Requests: Skipping refresh due to rate limiting")
      return
    }

    setLoading(true)
    setError(null)

    try {
      await Promise.all([loadShelfAccessRequests(), loadGameInteractionRequests()])
    } catch (err: any) {
      if (
        err.message?.includes("Rate limited") ||
        err.message?.includes("Too Many R") ||
        err.message?.includes("Unexpected token") ||
        err.name === "SyntaxError"
      ) {
        // removed debug Requests refresh rate limited")
        return
      }
      console.error("Error refreshing requests:", err)
      setError("Fehler beim Laden der Anfragen")
    } finally {
      setLoading(false)
    }
  }, [loadShelfAccessRequests, loadGameInteractionRequests])

  // Load data when user changes
  useEffect(() => {
    if (user) {
      refreshRequests()
    }
  }, [user, refreshRequests])

  const value: RequestsContextType = {
    shelfAccessRequests,
    gameInteractionRequests,
    loading,
    error,
    sendShelfAccessRequest,
    respondToShelfAccessRequest,
    sendGameInteractionRequest,
    respondToGameInteractionRequest,
    getShelfAccessStatus,
    canViewShelf,
    refreshRequests,
  }

  return <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>
}

const REQUESTS_FALLBACK: RequestsContextType = {
  shelfAccessRequests: [],
  gameInteractionRequests: [],
  loading: false,
  error: null,
  sendShelfAccessRequest: async () => {},
  respondToShelfAccessRequest: async () => {},
  sendGameInteractionRequest: async () => {},
  respondToGameInteractionRequest: async () => {},
  getShelfAccessStatus: () => "none",
  canViewShelf: () => false,
  refreshRequests: async () => {},
}

export function useRequests() {
  const context = useContext(RequestsContext)
  if (context === undefined) {
    return REQUESTS_FALLBACK
  }
  return context
}
