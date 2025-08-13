"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
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

  const FALLBACK_IMAGE = "/images/ludoloop-game-placeholder.png"

  // Mock marketplace data for when database is not connected
  const mockMarketplaceOffers: MarketplaceOffer[] = [
    {
      id: "1",
      title: "Catan - Die Siedler von Catan",
      publisher: "Kosmos",
      condition: "Sehr gut",
      type: "lend",
      price: "Kostenlos",
      location: "München, Bayern",
      distance: "2.3 km",
      image: "/images/ludoloop-game-placeholder.png",
      rating: 4.8,
      active: true,
      created_at: "2024-01-15T10:00:00Z",
    },
    {
      id: "2",
      title: "Ticket to Ride Europa",
      publisher: "Days of Wonder",
      condition: "Wie neu",
      type: "trade",
      price: "Tausch gegen ähnliches Spiel",
      location: "München, Bayern",
      distance: "1.8 km",
      image: "/images/ludoloop-game-placeholder.png",
      rating: 4.6,
      active: true,
      created_at: "2024-01-14T15:30:00Z",
    },
    {
      id: "3",
      title: "Azul",
      publisher: "Plan B Games",
      condition: "Gut",
      type: "sell",
      price: "25,00 €",
      location: "München, Bayern",
      distance: "3.1 km",
      image: "/images/ludoloop-game-placeholder.png",
      rating: 4.9,
      active: true,
      created_at: "2024-01-13T09:15:00Z",
    },
    {
      id: "4",
      title: "Wingspan",
      publisher: "Stonemaier Games",
      condition: "Sehr gut",
      type: "lend",
      price: "Kostenlos",
      location: "München, Bayern",
      distance: "0.9 km",
      image: "/images/ludoloop-game-placeholder.png",
      rating: 4.7,
      active: true,
      created_at: "2024-01-12T14:20:00Z",
    },
    {
      id: "5",
      title: "Splendor",
      publisher: "Space Cowboys",
      condition: "Wie neu",
      type: "sell",
      price: "20,00 €",
      location: "München, Bayern",
      distance: "4.2 km",
      image: "/images/ludoloop-game-placeholder.png",
      rating: 4.5,
      active: true,
      created_at: "2024-01-11T11:45:00Z",
    },
    {
      id: "6",
      title: "7 Wonders",
      publisher: "Repos Production",
      condition: "Gut",
      type: "trade",
      price: "Tausch gegen Strategiespiel",
      location: "München, Bayern",
      distance: "2.7 km",
      image: "/images/ludoloop-game-placeholder.png",
      rating: 4.4,
      active: true,
      created_at: "2024-01-10T16:30:00Z",
    },
  ]

  // Test database connection
  const testDatabaseConnection = async () => {
    try {
      const { error } = await supabase.from("games").select("count", { count: "exact", head: true })
      if (error) {
        console.error("Database connection test failed:", error)
        setError(
          `Datenbank-Verbindung fehlgeschlagen: ${error.message}. Bitte führe die SQL-Skripte aus (01-create-tables.sql, 02-create-policies.sql).`,
        )
        setDatabaseConnected(false)
        return false
      }
      setDatabaseConnected(true)
      setError(null)
      return true
    } catch (err) {
      console.error("Database connection error:", err)
      setError("Datenbank-Verbindung fehlgeschlagen. Bitte überprüfe deine Supabase-Konfiguration.")
      setDatabaseConnected(false)
      return false
    }
  }

  // Load games from database
  const loadGames = async () => {
    if (!user || !databaseConnected) return

    try {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("user_id", user.id)
        .order("title", { ascending: true })

      if (error) {
        console.error("Error loading games:", error)
        return
      }

      // Ensure fallback image is applied
      const gamesWithFallback = (data || []).map((game) => ({
        ...game,
        image: game.image || FALLBACK_IMAGE,
      }))

      setGames(gamesWithFallback)
    } catch (err) {
      console.error("Error loading games:", err)
    }
  }

  // Load marketplace offers from database
  const loadMarketplaceOffers = async () => {
    if (!databaseConnected) {
      // Use mock data when database is not connected
      setMarketplaceOffers(mockMarketplaceOffers)
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
        // Fallback to mock data on error
        setMarketplaceOffers(mockMarketplaceOffers)
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
      // Fallback to mock data on error
      setMarketplaceOffers(mockMarketplaceOffers)
    }
  }

  // Add new game
  const addGame = async (gameData: Omit<Game, "id" | "user_id" | "created_at">) => {
    if (!user || !databaseConnected) {
      throw new Error("User not authenticated or database not connected")
    }

    try {
      const gameWithFallback = {
        ...gameData,
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
  const refreshData = async () => {
    setLoading(true)
    setError(null)

    try {
      const connected = await testDatabaseConnection()
      if (connected && user) {
        await Promise.all([loadGames(), loadMarketplaceOffers()])
      } else {
        // Load mock data when database is not connected or user not available
        await loadMarketplaceOffers()
      }
    } catch (err) {
      console.error("Error refreshing data:", err)
      setError("Fehler beim Laden der Daten")
    } finally {
      setLoading(false)
    }
  }

  // Initialize data on mount and user change
  useEffect(() => {
    if (user !== undefined) {
      refreshData()
    }
  }, [user])

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
