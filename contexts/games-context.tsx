"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"

export interface Game {
  id: string
  title: string
  description: string
  image_url?: string
  min_players: number
  max_players: number
  playing_time: number
  age_rating: string
  category: string
  style?: string
  type?: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface MarketplaceOffer {
  id: string
  game_id: string
  user_id: string
  offer_type: "sell" | "trade" | "lend"
  price?: number
  description: string
  condition: string
  availability: boolean
  created_at: string
  updated_at: string
  games: Game
}

interface GamesContextType {
  games: Game[]
  marketplaceOffers: MarketplaceOffer[]
  loading: boolean
  error: string | null
  addGame: (game: Omit<Game, "id" | "created_at" | "updated_at">) => Promise<void>
  updateGame: (id: string, game: Partial<Game>) => Promise<void>
  deleteGame: (id: string) => Promise<void>
  refreshData: () => Promise<void>
}

const GamesContext = createContext<GamesContextType | undefined>(undefined)

export function GamesProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<Game[]>([])
  const [marketplaceOffers, setMarketplaceOffers] = useState<MarketplaceOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadGames = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setGames(data || [])
    } catch (err) {
      console.error("Error loading games:", err)
      setError(err instanceof Error ? err.message : "Failed to load games")
    }
  }

  const loadMarketplaceOffers = async () => {
    try {
      const { data, error } = await supabase
        .from("marketplace_offers")
        .select(`
          *,
          games (*)
        `)
        .eq("availability", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      setMarketplaceOffers(data || [])
    } catch (err) {
      console.error("Error loading marketplace offers:", err)
      setError(err instanceof Error ? err.message : "Failed to load marketplace offers")
    }
  }

  const refreshData = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([loadGames(), loadMarketplaceOffers()])
    } finally {
      setLoading(false)
    }
  }

  const addGame = async (gameData: Omit<Game, "id" | "created_at" | "updated_at">) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Only include style and type if they have values
      const gameToInsert: any = {
        ...gameData,
        user_id: user.id,
      }

      if (gameData.style) {
        gameToInsert.style = gameData.style
      }

      if (gameData.type) {
        gameToInsert.type = gameData.type
      }

      const { data, error } = await supabase.from("games").insert([gameToInsert]).select().single()

      if (error) throw error
      setGames((prev) => [data, ...prev])
    } catch (err) {
      console.error("Error adding game:", err)
      setError(err instanceof Error ? err.message : "Failed to add game")
      throw err
    }
  }

  const updateGame = async (id: string, gameData: Partial<Game>) => {
    try {
      // Only include style and type if they have values
      const gameToUpdate: any = { ...gameData }

      if (gameData.style) {
        gameToUpdate.style = gameData.style
      }

      if (gameData.type) {
        gameToUpdate.type = gameData.type
      }

      const { data, error } = await supabase.from("games").update(gameToUpdate).eq("id", id).select().single()

      if (error) throw error
      setGames((prev) => prev.map((game) => (game.id === id ? data : game)))
    } catch (err) {
      console.error("Error updating game:", err)
      setError(err instanceof Error ? err.message : "Failed to update game")
      throw err
    }
  }

  const deleteGame = async (id: string) => {
    try {
      const { error } = await supabase.from("games").delete().eq("id", id)

      if (error) throw error
      setGames((prev) => prev.filter((game) => game.id !== id))
    } catch (err) {
      console.error("Error deleting game:", err)
      setError(err instanceof Error ? err.message : "Failed to delete game")
      throw err
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  const value: GamesContextType = {
    games,
    marketplaceOffers,
    loading,
    error,
    addGame,
    updateGame,
    deleteGame,
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
