"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { useGeolocation } from "./geolocation-context"
import { geocodeAddress } from "@/lib/actions/geocoding"

interface LocationSearchFilters {
  radius: number // in kilometers
  useCurrentLocation: boolean
  customLatitude?: number
  customLongitude?: number
}

interface LocationSearchResult {
  id: string
  distance: number
  [key: string]: any
}

interface LocationSearchContextType {
  filters: LocationSearchFilters
  setFilters: (filters: Partial<LocationSearchFilters>) => void
  searchGamesNearby: (additionalFilters?: any) => Promise<LocationSearchResult[]>
  searchMarketplaceOffersNearby: (additionalFilters?: any) => Promise<LocationSearchResult[]>
  searchEventsNearby: (additionalFilters?: any) => Promise<LocationSearchResult[]>
  searchCommunitiesNearby: (additionalFilters?: any) => Promise<LocationSearchResult[]>
  searchByAddress: (address: string, radius: number) => Promise<LocationSearchResult[]>
  loading: boolean
  error: string | null
}

const LocationSearchContext = createContext<LocationSearchContextType | undefined>(undefined)

export function useLocationSearch() {
  const context = useContext(LocationSearchContext)
  if (context === undefined) {
    throw new Error("useLocationSearch must be used within a LocationSearchProvider")
  }
  return context
}

interface LocationSearchProviderProps {
  children: ReactNode
}

export function LocationSearchProvider({ children }: LocationSearchProviderProps) {
  const { latitude, longitude } = useGeolocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<LocationSearchFilters>({
    radius: 10, // Default 10km radius
    useCurrentLocation: true,
  })
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)

  useEffect(() => {
    try {
      const client = createClient()
      setSupabase(client)
    } catch (error) {
      console.error("[v0] Failed to initialize Supabase client in LocationSearchProvider:", error)
    }
  }, [])

  const setFilters = useCallback((newFilters: Partial<LocationSearchFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const getSearchCoordinates = useCallback(() => {
    if (filters.useCurrentLocation) {
      return { lat: latitude, lon: longitude }
    }
    return { lat: filters.customLatitude, lon: filters.customLongitude }
  }, [filters, latitude, longitude])

  const searchGamesNearby = useCallback(
    async (additionalFilters?: any): Promise<LocationSearchResult[]> => {
      if (!supabase) {
        throw new Error("Datenbank-Verbindung nicht verfügbar.")
      }

      const { lat, lon } = getSearchCoordinates()

      if (!lat || !lon) {
        throw new Error("Standort nicht verfügbar. Bitte aktiviere die Standortfreigabe.")
      }

      setLoading(true)
      setError(null)

      try {
        console.log("[v0] Searching games nearby:", { lat, lon, radius: filters.radius })

        // Use the PostgreSQL function to find games within radius
        const { data, error } = await supabase.rpc("items_within_radius", {
          center_lat: lat,
          center_lon: lon,
          radius_km: filters.radius,
          table_name: "games",
        })

        if (error) {
          console.error("Error searching games nearby:", error)
          throw new Error(`Fehler bei der Standortsuche: ${error.message}`)
        }

        // Get full game details for the found IDs
        if (data && data.length > 0) {
          const gameIds = data.map((item: any) => item.id)
          const { data: gamesData, error: gamesError } = await supabase.from("games").select("*").in("id", gameIds)

          if (gamesError) {
            throw new Error(`Fehler beim Laden der Spiele: ${gamesError.message}`)
          }

          // Combine game data with distance information
          const gamesWithDistance =
            gamesData?.map((game) => {
              const distanceInfo = data.find((item: any) => item.id === game.id)
              return {
                ...game,
                distance: distanceInfo?.distance_km || 0,
              }
            }) || []

          console.log("[v0] Found games nearby:", gamesWithDistance.length)
          return gamesWithDistance
        }

        return []
      } catch (err: any) {
        console.error("Error in searchGamesNearby:", err)
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [filters, getSearchCoordinates, supabase],
  )

  const searchMarketplaceOffersNearby = useCallback(
    async (additionalFilters?: any): Promise<LocationSearchResult[]> => {
      const { lat, lon } = getSearchCoordinates()

      if (!lat || !lon) {
        throw new Error("Standort nicht verfügbar. Bitte aktiviere die Standortfreigabe.")
      }

      setLoading(true)
      setError(null)

      try {
        console.log("[v0] Searching marketplace offers nearby:", { lat, lon, radius: filters.radius })

        const { data, error } = await supabase.rpc("items_within_radius", {
          center_lat: lat,
          center_lon: lon,
          radius_km: filters.radius,
          table_name: "marketplace_offers",
        })

        if (error) {
          console.error("Error searching marketplace offers nearby:", error)
          throw new Error(`Fehler bei der Standortsuche: ${error.message}`)
        }

        if (data && data.length > 0) {
          const offerIds = data.map((item: any) => item.id)
          const { data: offersData, error: offersError } = await supabase
            .from("marketplace_offers")
            .select("*")
            .in("id", offerIds)
            .eq("active", true)

          if (offersError) {
            throw new Error(`Fehler beim Laden der Angebote: ${offersError.message}`)
          }

          const offersWithDistance =
            offersData?.map((offer) => {
              const distanceInfo = data.find((item: any) => item.id === offer.id)
              return {
                ...offer,
                distance: distanceInfo?.distance_km || 0,
              }
            }) || []

          console.log("[v0] Found marketplace offers nearby:", offersWithDistance.length)
          return offersWithDistance
        }

        return []
      } catch (err: any) {
        console.error("Error in searchMarketplaceOffersNearby:", err)
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [filters, getSearchCoordinates, supabase],
  )

  const searchEventsNearby = useCallback(
    async (additionalFilters?: any): Promise<LocationSearchResult[]> => {
      const { lat, lon } = getSearchCoordinates()

      if (!lat || !lon) {
        throw new Error("Standort nicht verfügbar. Bitte aktiviere die Standortfreigabe.")
      }

      setLoading(true)
      setError(null)

      try {
        console.log("[v0] Searching events nearby:", { lat, lon, radius: filters.radius })

        const { data, error } = await supabase.rpc("items_within_radius", {
          center_lat: lat,
          center_lon: lon,
          radius_km: filters.radius,
          table_name: "community_events",
        })

        if (error) {
          console.error("Error searching events nearby:", error)
          throw new Error(`Fehler bei der Standortsuche: ${error.message}`)
        }

        if (data && data.length > 0) {
          const eventIds = data.map((item: any) => item.id)
          const { data: eventsData, error: eventsError } = await supabase
            .from("community_events")
            .select("*")
            .in("id", eventIds)
            .eq("active", true)

          if (eventsError) {
            throw new Error(`Fehler beim Laden der Events: ${eventsError.message}`)
          }

          const eventsWithDistance =
            eventsData?.map((event) => {
              const distanceInfo = data.find((item: any) => item.id === event.id)
              return {
                ...event,
                distance: distanceInfo?.distance_km || 0,
              }
            }) || []

          console.log("[v0] Found events nearby:", eventsWithDistance.length)
          return eventsWithDistance
        }

        return []
      } catch (err: any) {
        console.error("Error in searchEventsNearby:", err)
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [filters, getSearchCoordinates, supabase],
  )

  const searchCommunitiesNearby = useCallback(
    async (additionalFilters?: any): Promise<LocationSearchResult[]> => {
      const { lat, lon } = getSearchCoordinates()

      if (!lat || !lon) {
        throw new Error("Standort nicht verfügbar. Bitte aktiviere die Standortfreigabe.")
      }

      setLoading(true)
      setError(null)

      try {
        console.log("[v0] Searching communities nearby:", { lat, lon, radius: filters.radius })

        const { data, error } = await supabase.rpc("items_within_radius", {
          center_lat: lat,
          center_lon: lon,
          radius_km: filters.radius,
          table_name: "communities",
        })

        if (error) {
          console.error("Error searching communities nearby:", error)
          throw new Error(`Fehler bei der Standortsuche: ${error.message}`)
        }

        if (data && data.length > 0) {
          const communityIds = data.map((item: any) => item.id)
          const { data: communitiesData, error: communitiesError } = await supabase
            .from("communities")
            .select("*")
            .in("id", communityIds)
            .eq("active", true)

          if (communitiesError) {
            throw new Error(`Fehler beim Laden der Communities: ${communitiesError.message}`)
          }

          const communitiesWithDistance =
            communitiesData?.map((community) => {
              const distanceInfo = data.find((item: any) => item.id === community.id)
              return {
                ...community,
                distance: distanceInfo?.distance_km || 0,
              }
            }) || []

          console.log("[v0] Found communities nearby:", communitiesWithDistance.length)
          return communitiesWithDistance
        }

        return []
      } catch (err: any) {
        console.error("Error in searchCommunitiesNearby:", err)
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [filters, getSearchCoordinates, supabase],
  )

  const searchByAddress = useCallback(
    async (address: string, radius: number): Promise<LocationSearchResult[]> => {
      setLoading(true)
      setError(null)

      try {
        console.log("[v0] Searching by address:", address, "radius:", radius)

        const coordinates = await geocodeAddress(address)
        if (!coordinates) {
          throw new Error("Standort nicht gefunden. Bitte versuchen Sie eine andere Adresse.")
        }

        console.log("[v0] Address geocoded to:", coordinates)

        const tempFilters = {
          radius,
          useCurrentLocation: false,
          customLatitude: coordinates.lat,
          customLongitude: coordinates.lng,
        }

        const { data, error } = await supabase.rpc("items_within_radius", {
          center_lat: coordinates.lat,
          center_lon: coordinates.lng,
          radius_km: radius,
          table_name: "marketplace_offers",
        })

        if (error) {
          console.error("Error searching marketplace offers by address:", error)
          throw new Error(`Fehler bei der Standortsuche: ${error.message}`)
        }

        if (data && data.length > 0) {
          const offerIds = data.map((item: any) => item.id)
          const { data: offersData, error: offersError } = await supabase
            .from("marketplace_offers")
            .select("*")
            .in("id", offerIds)
            .eq("active", true)

          if (offersError) {
            throw new Error(`Fehler beim Laden der Angebote: ${offersError.message}`)
          }

          const offersWithDistance =
            offersData?.map((offer) => {
              const distanceInfo = data.find((item: any) => item.id === offer.id)
              return {
                ...offer,
                distance: distanceInfo?.distance_km || 0,
              }
            }) || []

          console.log("[v0] Location search results received:", offersWithDistance.length)
          return offersWithDistance
        }

        console.log("[v0] Location search results received:", 0)
        return []
      } catch (err: any) {
        console.error("Error in searchByAddress:", err)
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [supabase], // Added supabase dependency
  )

  const contextValue: LocationSearchContextType = {
    filters,
    setFilters,
    searchGamesNearby,
    searchMarketplaceOffersNearby,
    searchEventsNearby,
    searchCommunitiesNearby,
    searchByAddress,
    loading,
    error,
  }

  return <LocationSearchContext.Provider value={contextValue}>{children}</LocationSearchContext.Provider>
}
