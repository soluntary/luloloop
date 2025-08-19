"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "./auth-context"

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
}

const GamesContext = createContext<GamesContextType | undefined>(undefined)

export function GamesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [games, setGames] = useState<Game[]>([])
  const [marketplaceOffers, setMarketplaceOffers] = useState<MarketplaceOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [databaseConnected, setDatabaseConnected] = useState(false)
  const isRefreshingRef = useRef(false)

  const FALLBACK_IMAGE = "/images/ludoloop-game-placeholder.png"

  // Test database connection
  const testDatabaseConnection = async () => {
    console.log("[v0] Testing database connection...")
    try {
      const { error } = await supabase.from("games").select("count", { count: "exact", head: true })
      if (error) {
        console.error("[v0] Database connection test failed:", error)
        setError(
          `Datenbank-Verbindung fehlgeschlagen: ${error.message}. Bitte führe die SQL-Skripte aus (01-create-tables.sql, 02-create-policies.sql).`,
        )
        setDatabaseConnected(false)
        return false
      }
      console.log("[v0] Database connection successful")
      setDatabaseConnected(true)
      setError(null)
      return true
    } catch (err) {
      console.error("[v0] Database connection error:", err)
      setError("Datenbank-Verbindung fehlgeschlagen. Bitte überprüfe deine Supabase-Konfiguration.")
      setDatabaseConnected(false)
      return false
    }
  }

  // Load games from database
  const loadGames = useCallback(
    async (forceConnected = false) => {
      const isConnected = forceConnected || databaseConnected
      console.log("[v0] loadGames called - user:", user?.id, "databaseConnected:", isConnected)

      if (!user || !isConnected) {
        console.log("[v0] loadGames early return - user or database not available")
        return
      }

      try {
        console.log("[v0] Querying games for user:", user.id)
        const { data, error } = await supabase
          .from("games")
          .select("*")
          .eq("user_id", user.id)
          .order("title", { ascending: true })

        if (error) {
          console.error("[v0] Error loading games:", error)
          return
        }

        console.log("[v0] Raw games data from database:", data)
        console.log("[v0] Number of games loaded:", data?.length || 0)

        // Ensure fallback image is applied
        const gamesWithFallback = (data || []).map((game) => ({
          ...game,
          image: game.image || FALLBACK_IMAGE,
        }))

        console.log("[v0] Games with fallback images:", gamesWithFallback)
        setGames(gamesWithFallback)
        console.log("[v0] Games state updated with", gamesWithFallback.length, "games")
      } catch (err) {
        console.error("[v0] Error loading games:", err)
      }
    },
    [user, databaseConnected],
  )

  // Load marketplace offers from database
  const loadMarketplaceOffers = useCallback(
    async (forceConnected = false) => {
      const isConnected = forceConnected || databaseConnected
      if (!isConnected) {
        // Use empty array when database is not connected
        setMarketplaceOffers([])
        return
      }

      try {
        const { data, error } = await supabase
          .from("marketplace_offers")
          .select("*")
          .eq("active", true)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error loading marketplace offers:", error)
          setMarketplaceOffers([])
          return
        }

        // Ensure fallback image is applied
        const offersWithFallback = (data || []).map((offer) => ({
          ...offer,
          image: offer.image || FALLBACK_IMAGE,
        }))

        setMarketplaceOffers(offersWithFallback)
      } catch (err) {
        console.error("Error loading marketplace offers:", err)
        setMarketplaceOffers([])
      }
    },
    [databaseConnected],
  )

  // Add new game
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
        // Only include type and style if they exist in gameData
        ...(gameData.type && { type: gameData.type }),
        ...(gameData.style && { style: gameData.style }),
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

  // Update existing game
  const updateGame = async (gameId: string, gameData: Partial<Omit<Game, "id" | "user_id" | "created_at">>) => {
    if (!user || !databaseConnected) {
      throw new Error("User not authenticated or database not connected")
    }

    try {
      // First check if the game exists and belongs to the user
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
        // Only include type and style if they exist in gameData
        ...(gameData.type && { type: gameData.type }),
        ...(gameData.style && { style: gameData.style }),
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
        // Fallback: update local state manually
        setGames((prev) => prev.map((game) => (game.id === gameId ? { ...game, ...gameWithFallback } : game)))
      }
    } catch (err) {
      console.error("Error updating game:", err)
      throw err
    }
  }

  // Delete game
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

  // Add marketplace offer
  const addMarketplaceOffer = async (offerData: Omit<MarketplaceOffer, "id" | "user_id" | "created_at">) => {
    if (!user || !databaseConnected) {
      throw new Error("User not authenticated or database not connected")
    }

    try {
      const offerWithFallback = {
        ...offerData,
        image: offerData.image || FALLBACK_IMAGE,
        user_id: user.id,
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

  // Update marketplace offer
  const updateMarketplaceOffer = async (
    offerId: string,
    offerData: Partial<Omit<MarketplaceOffer, "id" | "user_id" | "created_at">>,
  ) => {
    if (!user || !databaseConnected) {
      throw new Error("User not authenticated or database not connected")
    }

    try {
      // First check if the offer exists and belongs to the user
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
        // Fallback: update local state manually
        setMarketplaceOffers((prev) =>
          prev.map((offer) => (offer.id === offerId ? { ...offer, ...offerWithFallback } : offer)),
        )
      }
    } catch (err) {
      console.error("Error updating marketplace offer:", err)
      throw err
    }
  }

  // Delete marketplace offer
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

  // Refresh all data
  const refreshData = useCallback(async () => {
    if (isRefreshingRef.current) {
      console.log("[v0] refreshData already in progress, skipping")
      return
    }

    console.log("[v0] refreshData called - user:", user?.id)
    isRefreshingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const connected = await testDatabaseConnection()
      console.log("[v0] Database connected:", connected)
      if (connected && user) {
        console.log("[v0] Loading games and marketplace offers...")
        await Promise.all([loadGames(connected), loadMarketplaceOffers(connected)])
      } else {
        console.log("[v0] Skipping data load - not connected or no user")
        setMarketplaceOffers([])
      }
    } catch (err) {
      console.error("[v0] Error refreshing data:", err)
      setError("Fehler beim Laden der Daten")
    } finally {
      setLoading(false)
      isRefreshingRef.current = false
      console.log("[v0] refreshData completed")
    }
  }, [user, loadGames, loadMarketplaceOffers])

  // Initialize data on mount and user change
  useEffect(() => {
    if (user?.id && !isRefreshingRef.current) {
      refreshData()
    }
  }, [user, refreshData])

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
  }

  return <GamesContext.Provider value={value}>{children}</GamesContext.Provider>
}

export function useGames() {
  const context = useContext(GamesContext)
  if (context === undefined) {
    throw new Error("useGames must be used within a GamesProvider")
  }
  return context
}
