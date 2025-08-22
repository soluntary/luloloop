"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
  permission: "granted" | "denied" | "prompt" | null
}

interface GeolocationContextType extends GeolocationState {
  requestLocation: () => Promise<void>
  clearLocation: () => void
  calculateDistance: (lat2: number, lon2: number) => number | null
}

const GeolocationContext = createContext<GeolocationContextType | undefined>(undefined)

export function useGeolocation() {
  const context = useContext(GeolocationContext)
  if (context === undefined) {
    throw new Error("useGeolocation must be used within a GeolocationProvider")
  }
  return context
}

interface GeolocationProviderProps {
  children: ReactNode
}

export function GeolocationProvider({ children }: GeolocationProviderProps) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
    permission: null,
  })

  const calculateDistance = (lat2: number, lon2: number): number | null => {
    if (!state.latitude || !state.longitude) return null

    const R = 6371 // Earth's radius in kilometers
    const dLat = ((lat2 - state.latitude) * Math.PI) / 180
    const dLon = ((lon2 - state.longitude) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((state.latitude * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in kilometers
  }

  const requestLocation = async (): Promise<void> => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, error: "Geolocation wird von diesem Browser nicht unterstützt" }))
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        })
      })

      setState((prev) => ({
        ...prev,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        loading: false,
        permission: "granted",
      }))

      console.log("[v0] Location obtained:", {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        accuracy: position.coords.accuracy,
      })
    } catch (error: any) {
      let errorMessage = "Standort konnte nicht ermittelt werden"

      if (error.code === 1) {
        errorMessage = "Standortzugriff wurde verweigert"
        setState((prev) => ({ ...prev, permission: "denied" }))
      } else if (error.code === 2) {
        errorMessage = "Standort ist nicht verfügbar"
      } else if (error.code === 3) {
        errorMessage = "Zeitüberschreitung beim Abrufen des Standorts"
      }

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }))

      console.log("[v0] Geolocation error:", error)
    }
  }

  const clearLocation = () => {
    setState({
      latitude: null,
      longitude: null,
      accuracy: null,
      error: null,
      loading: false,
      permission: null,
    })
  }

  useEffect(() => {
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setState((prev) => ({ ...prev, permission: result.state as "granted" | "denied" | "prompt" }))
      })
    }
  }, [])

  const contextValue: GeolocationContextType = {
    ...state,
    requestLocation,
    clearLocation,
    calculateDistance,
  }

  return <GeolocationContext.Provider value={contextValue}>{children}</GeolocationContext.Provider>
}
