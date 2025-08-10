"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './auth-context'

interface Game {
  id: string
  user_id: string
  title: string
  publisher?: string
  description?: string
  condition: string
  players?: string
  duration?: string
  age?: string
  language?: string
  available: string[]
  image?: string
  category?: string
  min_players?: number
  max_players?: number
  play_time?: number
  age_rating?: string
  created_at: string
  updated_at: string
}

interface MarketplaceOffer {
  id: string
  user_id: string
  game_id?: string
  title: string
  publisher?: string
  condition: string
  type: 'lend' | 'trade' | 'sell'
  price?: string
  location?: string
  distance?: string
  description?: string
  image?: string
  active: boolean
  created_at: string
  updated_at: string
  owner?: string
  rating?: number
  gameId?: number
}

interface GamesContextType {
  games: Game[]
  marketplaceOffers: MarketplaceOffer[]
  loading: boolean
  error: string | null
  databaseConnected: boolean
  addGame: (gameData: Omit<Game, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateGame: (id: string, gameData: Partial<Game>) => Promise<void>
  deleteGame: (id: string) => Promise<void>
  addMarketplaceOffer: (offerData: Omit<MarketplaceOffer, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateMarketplaceOffer: (id: string, offerData: Partial<MarketplaceOffer>) => Promise<void>
  deleteMarketplaceOffer: (id: string) => Promise<void>
  refreshData: () => Promise<void>
}

const GamesContext = createContext<GamesContextType | undefined>(undefined)

export function GamesProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<Game[]>([])
  const [marketplaceOffers, setMarketplaceOffers] = useState<MarketplaceOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [databaseConnected, setDatabaseConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    loadData()
  }, [user])

  const testDatabaseConnection = async (): Promise<boolean> => {
    try {
      const { error } = await supabase.from('users').select('id').limit(1)
      if (error) {
        console.error('Database connection test failed:', error)
        return false
      }
      return true
    } catch (error) {
      console.error('Database connection test failed:', error)
      return false
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Test database connection
      const isConnected = await testDatabaseConnection()
      setDatabaseConnected(isConnected)

      if (!isConnected) {
        setError('Database tables not found. Please run the SQL setup scripts.')
        setLoading(false)
        return
      }

      // Load games and marketplace offers in parallel
      const [gamesResult, offersResult] = await Promise.all([
        loadGames(),
        loadMarketplaceOffers()
      ])

      if (!gamesResult || !offersResult) {
        setError('Failed to load data from database.')
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to connect to database. Please check your setup.')
      setDatabaseConnected(false)
    } finally {
      setLoading(false)
    }
  }

  const loadGames = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading games:', error)
        return false
      }

      setGames(data || [])
      return true
    } catch (error) {
      console.error('Error loading games:', error)
      return false
    }
  }

  const loadMarketplaceOffers = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('marketplace_offers')
        .select(`
          *,
          users!marketplace_offers_user_id_fkey(name)
        `)
        .eq('active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading marketplace offers:', error)
        // Try without the join if it fails
        const { data: simpleData, error: simpleError } = await supabase
          .from('marketplace_offers')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false })

        if (simpleError) {
          console.error('Error loading marketplace offers (simple):', simpleError)
          return false
        }

        // Transform data to match expected format
        const transformedOffers = (simpleData || []).map(offer => ({
          ...offer,
          owner: 'Unbekannt',
          rating: 5.0,
          gameId: parseInt(offer.game_id || '0') || undefined
        }))

        setMarketplaceOffers(transformedOffers)
        return true
      }

      // Transform data to match expected format
      const transformedOffers = (data || []).map(offer => ({
        ...offer,
        owner: offer.users?.name || 'Unbekannt',
        rating: 5.0,
        gameId: parseInt(offer.game_id || '0') || undefined
      }))

      setMarketplaceOffers(transformedOffers)
      return true
    } catch (error) {
      console.error('Error loading marketplace offers:', error)
      return false
    }
  }

  const addGame = async (gameData: Omit<Game, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated')
    if (!databaseConnected) throw new Error('Database not connected')

    try {
      const { data, error } = await supabase
        .from('games')
        .insert([{
          ...gameData,
          user_id: user.id
        }])
        .select()
        .single()

      if (error) throw error

      setGames(prev => [data, ...prev])
    } catch (error) {
      console.error('Error adding game:', error)
      throw error
    }
  }

  const updateGame = async (id: string, gameData: Partial<Game>) => {
    if (!user) throw new Error('User not authenticated')
    if (!databaseConnected) throw new Error('Database not connected')

    try {
      const { data, error } = await supabase
        .from('games')
        .update(gameData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      setGames(prev => prev.map(game => game.id === id ? data : game))
    } catch (error) {
      console.error('Error updating game:', error)
      throw error
    }
  }

  const deleteGame = async (id: string) => {
    if (!user) throw new Error('User not authenticated')
    if (!databaseConnected) throw new Error('Database not connected')

    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      setGames(prev => prev.filter(game => game.id !== id))
    } catch (error) {
      console.error('Error deleting game:', error)
      throw error
    }
  }

  const addMarketplaceOffer = async (offerData: Omit<MarketplaceOffer, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated')
    if (!databaseConnected) throw new Error('Database not connected')

    try {
      const { data, error } = await supabase
        .from('marketplace_offers')
        .insert([{
          title: offerData.title,
          publisher: offerData.publisher,
          condition: offerData.condition,
          type: offerData.type,
          price: offerData.price,
          location: offerData.location,
          distance: offerData.distance,
          description: offerData.description,
          image: offerData.image,
          game_id: offerData.game_id,
          user_id: user.id,
          active: true
        }])
        .select()
        .single()

      if (error) throw error

      // Transform data to match expected format
      const transformedOffer = {
        ...data,
        owner: user.name,
        rating: 5.0,
        gameId: parseInt(data.game_id || '0') || undefined
      }

      setMarketplaceOffers(prev => [transformedOffer, ...prev])
    } catch (error) {
      console.error('Error adding marketplace offer:', error)
      throw error
    }
  }

  const updateMarketplaceOffer = async (id: string, offerData: Partial<MarketplaceOffer>) => {
    if (!user) throw new Error('User not authenticated')
    if (!databaseConnected) throw new Error('Database not connected')

    try {
      const { data, error } = await supabase
        .from('marketplace_offers')
        .update(offerData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      setMarketplaceOffers(prev => prev.map(offer => offer.id === id ? data : offer))
    } catch (error) {
      console.error('Error updating marketplace offer:', error)
      throw error
    }
  }

  const deleteMarketplaceOffer = async (id: string) => {
    if (!user) throw new Error('User not authenticated')
    if (!databaseConnected) throw new Error('Database not connected')

    try {
      const { error } = await supabase
        .from('marketplace_offers')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      setMarketplaceOffers(prev => prev.filter(offer => offer.id !== id))
    } catch (error) {
      console.error('Error deleting marketplace offer:', error)
      throw error
    }
  }

  const refreshData = async () => {
    await loadData()
  }

  const value = {
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
    throw new Error('useGames must be used within a GamesProvider')
  }
  return context
}
