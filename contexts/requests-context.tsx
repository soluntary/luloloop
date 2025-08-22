"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "./auth-context"

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
  const [shelfAccessRequests, setShelfAccessRequests] = useState<ShelfAccessRequest[]>([])
  const [gameInteractionRequests, setGameInteractionRequests] = useState<GameInteractionRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load shelf access requests
  const loadShelfAccessRequests = useCallback(async () => {
    if (!user) return

    try {
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
      setShelfAccessRequests(data || [])
    } catch (err) {
      console.error("Error loading shelf access requests:", err)
      setError("Fehler beim Laden der Spielregal-Anfragen")
    }
  }, [user])

  // Load game interaction requests
  const loadGameInteractionRequests = useCallback(async () => {
    if (!user) return

    try {
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
      setGameInteractionRequests(data || [])
    } catch (err) {
      console.error("Error loading game interaction requests:", err)
      setError("Fehler beim Laden der Spiel-Anfragen")
    }
  }, [user])

  // Send shelf access request
  const sendShelfAccessRequest = async (ownerId: string, message?: string) => {
    if (!user) throw new Error("User not authenticated")

    try {
      const { error } = await supabase.from("shelf_access_requests").insert([
        {
          requester_id: user.id,
          owner_id: ownerId,
          message: message || null,
        },
      ])

      if (error) throw error
      await loadShelfAccessRequests()
    } catch (err) {
      console.error("Error sending shelf access request:", err)
      throw new Error("Fehler beim Senden der Spielregal-Anfrage")
    }
  }

  // Respond to shelf access request
  const respondToShelfAccessRequest = async (requestId: string, status: "approved" | "denied") => {
    if (!user) throw new Error("User not authenticated")

    try {
      const { error } = await supabase
        .from("shelf_access_requests")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("owner_id", user.id)

      if (error) throw error
      await loadShelfAccessRequests()
    } catch (err) {
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

    try {
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
      await loadGameInteractionRequests()
    } catch (err) {
      console.error("Error sending game interaction request:", err)
      throw new Error("Fehler beim Senden der Spiel-Anfrage")
    }
  }

  // Respond to game interaction request
  const respondToGameInteractionRequest = async (requestId: string, status: "approved" | "denied") => {
    if (!user) throw new Error("User not authenticated")

    try {
      const { error } = await supabase
        .from("game_interaction_requests")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("owner_id", user.id)

      if (error) throw error
      await loadGameInteractionRequests()
    } catch (err) {
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
      // TODO: Check friendship status
      // For now, treat as private
      const accessStatus = getShelfAccessStatus(ownerId)
      return accessStatus === "approved"
    }

    return false
  }

  // Refresh all requests
  const refreshRequests = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      await Promise.all([loadShelfAccessRequests(), loadGameInteractionRequests()])
    } catch (err) {
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

export function useRequests() {
  const context = useContext(RequestsContext)
  if (context === undefined) {
    throw new Error("useRequests must be used within a RequestsProvider")
  }
  return context
}
