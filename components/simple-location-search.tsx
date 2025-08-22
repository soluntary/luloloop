"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { MapPin, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLocationSearch } from "@/contexts/location-search-context"

interface AddressSuggestion {
  display_name: string
  lat: string
  lon: string
  place_id: string
}

interface SimpleLocationSearchProps {
  onLocationSearch?: (results: any[]) => void
  className?: string
  disabled?: boolean
}

export function SimpleLocationSearch({ onLocationSearch, className, disabled }: SimpleLocationSearchProps) {
  const [address, setAddress] = useState("")
  const [radius, setRadius] = useState("10")
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const { searchByAddress } = useLocationSearch()

  useEffect(() => {
    if (address.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsLoadingSuggestions(true)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(address)}&countrycodes=de,at,ch`,
        )
        const data = await response.json()
        setSuggestions(data)
        setShowSuggestions(true)
        setSelectedIndex(-1)
      } catch (error) {
        console.error("Autocomplete error:", error)
        setSuggestions([])
      } finally {
        setIsLoadingSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [address])

  // Simple geocoding function using a free service
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      // Using Nominatim (OpenStreetMap) for free geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      )
      const data = await response.json()

      if (data && data.length > 0) {
        return {
          lat: Number.parseFloat(data[0].lat),
          lng: Number.parseFloat(data[0].lon),
        }
      }
      return null
    } catch (error) {
      console.error("Geocoding error:", error)
      return null
    }
  }

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    setAddress(suggestion.display_name)
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedIndex(-1)
  }

  const handleSearch = async () => {
    if (!address.trim()) return

    setIsSearching(true)
    try {
      // Convert address to coordinates
      const coordinates = await geocodeAddress(address.trim())

      if (coordinates) {
        // Perform location-based search
        const results = await searchByAddress(address.trim(), Number.parseInt(radius))
        onLocationSearch?.(results)
      } else {
        alert("Standort nicht gefunden. Bitte versuchen Sie eine andere Adresse.")
      }
    } catch (error) {
      console.error("Search error:", error)
      alert("Fehler bei der Standortsuche. Bitte versuchen Sie es erneut.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        handleSearch()
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex])
        } else {
          handleSearch()
        }
        break
      case "Escape":
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }, 200)
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 text-gray-700 min-w-fit">
          <MapPin className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-medium">Standort:</span>
        </div>

        <div className="flex-1 min-w-0 relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Stadt oder Adresse eingeben..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={handleBlur}
            onFocus={() => address.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
            className="border-orange-200 focus:border-orange-400 text-sm pr-8"
          />
          {isLoadingSuggestions && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 min-w-fit">
          <Select value={radius} onValueChange={setRadius}>
            <SelectTrigger className="w-20 h-8 border-orange-200 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 km</SelectItem>
              <SelectItem value="10">10 km</SelectItem>
              <SelectItem value="25">25 km</SelectItem>
              <SelectItem value="50">50 km</SelectItem>
              <SelectItem value="100">100 km</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleSearch}
            disabled={!address.trim() || isSearching || disabled}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white h-8 px-3"
          >
            {isSearching ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Search className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                index === selectedIndex ? "bg-orange-50 border-orange-200" : ""
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{suggestion.display_name.split(",")[0]}</p>
                  <p className="text-xs text-gray-500 truncate">{suggestion.display_name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
