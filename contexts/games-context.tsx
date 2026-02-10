"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth, type AuthUser } from "./auth-context"

interface Game {
  id: string
  title: string
  publisher?: string
  condition: string
  players?: string
  duration?: string
  age?: string
  language?: string
  available: string[]
  image?: string
  user_id?: string
  created_at?: string
  type?: string
  style?: string
  besonderheit?: string
  latitude?: number
  longitude?: number
  location?: string
  tracking_info?: {
    status: "available" | "rented" | "swapped" | "lent"
    rented_to?: string
    rented_until?: string
    swapped_with?: string
    notes?: string
  }
}

interface MarketplaceOffer {
  id?: string
  title: string
  publisher?: string
  condition: string
  type: "lend" | "trade" | "sell"
  price: string
  location: string
  distance: string
  image?: string
  game_id?: string
  user_id?: string
  description?: string
  active: boolean
  created_at?: string
  rating?: number
  latitude?: number
  longitude?: number
  avatar?: string
  owner?: string
  players?: string
  duration?: string
  age?: string
  language?: string
  category?: string
  style?: string
}

interface GamesContextType {
  games: Game[]
  marketplaceOffers: MarketplaceOffer[]
  loading: boolean
  error: string | null
  databaseConnected: boolean
  addGame: (gameData: Omit<Game, "id" | "user_id" | "created_at">) => Promise<void>
  updateGame: (gameId: string, gameData: Partial<Omit<Game, "id" | "user_id" | "created_at">>) => Promise<void>
  deleteGame: (gameId: string) => Promise<void>
  addMarketplaceOffer: (offerData: Omit<MarketplaceOffer, "id" | "user_id" | "created_at">) => Promise<void>
  updateMarketplaceOffer: (
    offerId: string,
    offerData: Partial<Omit<MarketplaceOffer, "id" | "user_id" | "created_at">>,
  ) => Promise<void>
  deleteMarketplaceOffer: (offerId: string) => Promise<void>
  refreshData: () => Promise<void>
  toggleGameAvailability: (gameId: string, isAvailable: boolean) => Promise<void>
}

const GamesContext = createContext<GamesContextType | undefined>(undefined)

export function GamesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [games, setGames] = useState<Game[]>([])
  const [marketplaceOffers, setMarketplaceOffers] = useState<MarketplaceOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [databaseConnected, setDatabaseConnected] = useState(true)
  const isRefreshingRef = useRef(false)
  const userIdRef = useRef<string | null>(null)
  const initialLoadDoneRef = useRef(false)

  const FALLBACK_IMAGE = "/images/ludoloop-game-placeholder.png"

  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)

  useEffect(() => {
    try {
      const client = createClient()
      setSupabase(client)
    } catch (error) {
      console.error("[v0] Failed to initialize Supabase client in GamesProvider:", error)
    }
  }, [])

  const testDatabaseConnection = async () => {
    if (!supabase) return false
    try {
      const { error } = await supabase.from("marketplace_offers").select("count", { count: "exact", head: true })

      if (error) {
        setError(`Datenbank-Verbindung fehlgeschlagen: ${error.message}`)
        setDatabaseConnected(false)
        return false
      }

      setDatabaseConnected(true)
      setError(null)
      return true
    } catch (err) {
      setError("Datenbank-Verbindung fehlgeschlagen. Bitte überprüfe deine Supabase-Konfiguration.")
      setDatabaseConnected(false)
      return false
    }
  }

  const loadGames = useCallback(
    async (forceConnected = false, currentUser?: AuthUser | null) => {
      const userToUse = currentUser || user
      const isConnected = forceConnected || databaseConnected

      if (!userToUse || !isConnected) {
        return
      }

      try {
        const { data, error } = await supabase
          .from("games")
          .select("*")
          .eq("user_id", userToUse.id)
          .order("title", { ascending: true })

        if (error) {
          console.error("Error loading games:", error)
          return
        }

        const gamesWithFallback = (data || []).map((game) => ({
          ...game,
          image: game.image || FALLBACK_IMAGE,
        }))

        setGames(gamesWithFallback)
      } catch (err) {
        console.error("Error loading games:", err)
      }
    },
    [user, databaseConnected, supabase],
  )

  const loadMarketplaceOffers = useCallback(
    async (forceConnected = false) => {
      if (!supabase) return
      try {
        const { data, error } = await supabase
          .from("marketplace_offers")
          .select("*, users(username, avatar), games(players, duration, age, language, category, style)")
          .eq("active", true)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error loading marketplace offers:", error)
          setMarketplaceOffers([])
          return
        }

        const offersWithFallback = (data || []).map((offer) => ({
          ...offer,
          image: offer.image || FALLBACK_IMAGE,
          avatar: offer.users?.avatar,
          owner: offer.users?.username,
          players: offer.games?.players,
          duration: offer.games?.duration,
          age: offer.games?.age,
          language: offer.games?.language,
          category: offer.games?.category,
          style: offer.games?.style,
        }))

        setMarketplaceOffers(offersWithFallback)
      } catch (err) {
        console.error("Error loading marketplace offers:", err)
        setMarketplaceOffers([])
      }
    },
    [supabase],
  )

  const addGame = async (gameData: Omit<Game, "id" | "user_id" | "created_at">) => {
    if (!user || !databaseConnected) {
      throw new Error("User not authenticated or database not connected")
    }

    try {
      const gameWithFallback = {
        ...gameData,
        condition: gameData.condition || "Gut",
        image: gameData.image || FALLBACK_IMAGE,
        user_id: user.id,
        ...(gameData.type && { type: gameData.type }),
        ...(gameData.style && { style: gameData.style }),
        ...(gameData.besonderheit && { besonderheit: gameData.besonderheit }),
        ...(gameData.latitude && { latitude: gameData.latitude }),
        ...(gameData.longitude && { longitude: gameData.longitude }),
        ...(gameData.location && { location: gameData.location }),
        ...(gameData.tracking_info && { tracking_info: gameData.tracking_info }),
      }

      const { data, error } = await supabase.from("games").insert([gameWithFallback]).select()

      if (error) {
        console.error("Error adding game:", error)
        throw new Error(`Fehler beim Hinzufügen des Spiels: ${error.message}`)
      }

      if (data && data.length > 0) {
        const newGame = {
          ...data[0],
          image: data[0].image || FALLBACK_IMAGE,
        }
        setGames((prev) => [...prev, newGame])
      }
    } catch (err) {
      console.error("Error adding game:", err)
      throw err
    }
  }

  const updateGame = async (gameId: string, gameData: Partial<Omit<Game, "id" | "user_id" | "created_at">>) => {
    if (!user || !databaseConnected) {
      throw new Error("User not authenticated or database not connected")
    }

    try {
      const { data: existingGame, error: checkError } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .eq("user_id", user.id)
        .single()

      if (checkError || !existingGame) {
        throw new Error("Spiel nicht gefunden oder keine Berechtigung")
      }

      const gameWithFallback = {
        ...gameData,
        image: gameData.image || FALLBACK_IMAGE,
        ...(gameData.type && { type: gameData.type }),
        ...(gameData.style && { style: gameData.style }),
        ...(gameData.besonderheit !== undefined && { besonderheit: gameData.besonderheit }),
        ...(gameData.latitude && { latitude: gameData.latitude }),
        ...(gameData.longitude && { longitude: gameData.longitude }),
        ...(gameData.location && { location: gameData.location }),
        ...(gameData.tracking_info && { tracking_info: gameData.tracking_info }),
      }

      const { data, error } = await supabase
        .from("games")
        .update(gameWithFallback)
        .eq("id", gameId)
        .eq("user_id", user.id)
        .select()

      if (error) {
        console.error("Error updating game:", error)
        throw new Error(`Fehler beim Aktualisieren des Spiels: ${error.message}`)
      }

      if (data && data.length > 0) {
        const updatedGame = {
          ...data[0],
          image: data[0].image || FALLBACK_IMAGE,
        }
        setGames((prev) => prev.map((game) => (game.id === gameId ? updatedGame : game)))
      } else {
        setGames((prev) => prev.map((game) => (game.id === gameId ? { ...game, ...gameWithFallback } : game)))
      }
    } catch (err) {
      console.error("Error updating game:", err)
      throw err
    }
  }

  const deleteGame = async (gameId: string) => {
    if (!user || !databaseConnected) {
      throw new Error("User not authenticated or database not connected")
    }

    try {
      const { error } = await supabase.from("games").delete().eq("id", gameId).eq("user_id", user.id)

      if (error) {
        console.error("Error deleting game:", error)
        throw new Error(`Fehler beim Löschen des Spiels: ${error.message}`)
      }

      setGames((prev) => prev.filter((game) => game.id !== gameId))
    } catch (err) {
      console.error("Error deleting game:", err)
      throw err
    }
  }

  const addMarketplaceOffer = async (offerData: Omit<MarketplaceOffer, "id" | "user_id" | "created_at">) => {
    if (!user || !databaseConnected) {
      throw new Error("User not authenticated or database not connected")
    }

    try {
      const offerWithFallback = {
        ...offerData,
        image: offerData.image || FALLBACK_IMAGE,
        user_id: user.id,
        ...(offerData.latitude && { latitude: offerData.latitude }),
        ...(offerData.longitude && { longitude: offerData.longitude }),
      }

      const { data, error } = await supabase.from("marketplace_offers").insert([offerWithFallback]).select()

      if (error) {
        console.error("Error adding marketplace offer:", error)
        throw new Error(`Fehler beim Hinzufügen des Angebots: ${error.message}`)
      }

      if (data && data.length > 0) {
        const newOffer = {
          ...data[0],
          image: data[0].image || FALLBACK_IMAGE,
        }
        setMarketplaceOffers((prev) => [newOffer, ...prev])
      }
    } catch (err) {
      console.error("Error adding marketplace offer:", err)
      throw err
    }
  }

  const updateMarketplaceOffer = async (
    offerId: string,
    offerData: Partial<Omit<MarketplaceOffer, "id" | "user_id" | "created_at">>,
  ) => {
    if (!user || !databaseConnected) {
      throw new Error("User not authenticated or database not connected")
    }

    try {
      const { data: existingOffer, error: checkError } = await supabase
        .from("marketplace_offers")
        .select("*")
        .eq("id", offerId)
        .eq("user_id", user.id)
        .single()

      if (checkError || !existingOffer) {
        throw new Error("Angebot nicht gefunden oder keine Berechtigung")
      }

      const offerWithFallback = {
        ...offerData,
        image: offerData.image || FALLBACK_IMAGE,
        ...(offerData.latitude && { latitude: offerData.latitude }),
        ...(offerData.longitude && { longitude: offerData.longitude }),
      }

      const { data, error } = await supabase
        .from("marketplace_offers")
        .update(offerWithFallback)
        .eq("id", offerId)
        .eq("user_id", user.id)
        .select()

      if (error) {
        console.error("Error updating marketplace offer:", error)
        throw new Error(`Fehler beim Aktualisieren des Angebots: ${error.message}`)
      }

      if (data && data.length > 0) {
        const updatedOffer = {
          ...data[0],
          image: data[0].image || FALLBACK_IMAGE,
        }
        setMarketplaceOffers((prev) => prev.map((offer) => (offer.id === offerId ? updatedOffer : offer)))
      } else {
        setMarketplaceOffers((prev) =>
          prev.map((offer) => (offer.id === offerId ? { ...offer, ...offerWithFallback } : offer)),
        )
      }
    } catch (err) {
      console.error("Error updating marketplace offer:", err)
      throw err
    }
  }

  const deleteMarketplaceOffer = async (offerId: string) => {
    if (!user || !databaseConnected) {
      throw new Error("User not authenticated or database not connected")
    }

    try {
      const { error } = await supabase.from("marketplace_offers").delete().eq("id", offerId).eq("user_id", user.id)

      if (error) {
        console.error("Error deleting marketplace offer:", error)
        throw new Error(`Fehler beim Löschen des Angebots: ${error.message}`)
      }

      setMarketplaceOffers((prev) => prev.filter((offer) => offer.id !== offerId))
    } catch (err) {
      console.error("Error deleting marketplace offer:", err)
      throw err
    }
  }

  const toggleGameAvailability = async (gameId: string, isAvailable: boolean) => {
    if (!user || !databaseConnected) {
      throw new Error("User not authenticated or database not connected")
    }

    try {
      const availabilityStatus = isAvailable ? ["available"] : ["not_available"]
      const trackingStatus = isAvailable ? "available" : "rented"

      const { data, error } = await supabase
        .from("games")
        .update({
          available: availabilityStatus,
          tracking_info: {
            status: trackingStatus,
          },
        })
        .eq("id", gameId)
        .eq("user_id", user.id)
        .select()

      if (error) {
        console.error("Error toggling game availability:", error)
        throw new Error(`Fehler beim Aktualisieren der Verfügbarkeit: ${error.message}`)
      }

      if (data && data.length > 0) {
        const updatedGame = {
          ...data[0],
          image: data[0].image || FALLBACK_IMAGE,
        }
        setGames((prev) => prev.map((game) => (game.id === gameId ? updatedGame : game)))
      }
    } catch (err) {
      console.error("Error toggling game availability:", err)
      throw err
    }
  }

  const refreshData = useCallback(async () => {
    if (isRefreshingRef.current) {
      return
    }

    isRefreshingRef.current = true
    setLoading(true)
    setError(null)

    try {
      await loadMarketplaceOffers(true)

      const connected = await testDatabaseConnection()

      const currentUser = user

      if (currentUser && connected) {
        await loadGames(connected, currentUser)
        userIdRef.current = currentUser.id
        initialLoadDoneRef.current = true
      } else if (currentUser === null && !authLoading) {
        setGames([])
        userIdRef.current = null
        initialLoadDoneRef.current = false
      }
    } catch (err) {
      console.error("Error refreshing data:", err)
      setError("Fehler beim Laden der Daten")
      setMarketplaceOffers([])
      if (user === null && !authLoading) {
        setGames([])
      }
    } finally {
      setLoading(false)
      isRefreshingRef.current = false
    }
  }, [user, authLoading, loadGames, loadMarketplaceOffers])

  useEffect(() => {
    if (authLoading || !supabase) {
      return
    }

    if (!isRefreshingRef.current) {
      refreshData()
    }
  }, [user, authLoading, supabase, refreshData])

  const value: GamesContextType = {
    games,
    marketplaceOffers,
    loading,
    error,
    databaseConnected,
    addGame,
    updateGame,
    deleteGame,
    addMarketplaceOffer,
    updateMarketplaceOffer,
    deleteMarketplaceOffer,
    refreshData,
    toggleGameAvailability,
  }

  return <GamesContext.Provider value={value}>{children}</GamesContext.Provider>
}

const GAMES_FALLBACK: GamesContextType = {
  games: [],
  marketplaceOffers: [],
  loading: false,
  error: null,
  databaseConnected: false,
  addGame: async () => {},
  updateGame: async () => {},
  deleteGame: async () => {},
  addMarketplaceOffer: async () => {},
  updateMarketplaceOffer: async () => {},
  deleteMarketplaceOffer: async () => {},
  refreshData: async () => {},
  toggleGameAvailability: async () => {},
}

export function useGames() {
  const context = useContext(GamesContext)
  if (context === undefined) {
    return GAMES_FALLBACK
  }
  return context
}
