"use client"

import type React from "react"
import { useState } from "react"
import { MapPin, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLocationSearch } from "@/contexts/location-search-context"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { geocodeAddress } from "@/lib/actions/geocoding"

interface SimpleLocationSearchProps {
  onLocationSearch?: (location: string, radius: number) => void
  className?: string
  onNearbySearch?: () => void
}

export function SimpleLocationSearch({ onLocationSearch, className, onNearbySearch }: SimpleLocationSearchProps) {
  const [address, setAddress] = useState("")
  const [radius, setRadius] = useState("10")
  const [isSearching, setIsSearching] = useState(false)
  const { searchByAddress } = useLocationSearch()

  const handleSearch = async () => {
    if (!address.trim()) return

    setIsSearching(true)
    try {
      const coordinates = await geocodeAddress(address.trim())

      if (coordinates) {
        // Perform location-based search
        await searchByAddress(address.trim(), Number.parseInt(radius))
        onLocationSearch?.(address.trim(), Number.parseInt(radius))
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
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 text-gray-700 min-w-fit">
          <MapPin className="h-5 w-5 text-orange-500" />
          <span className="text-sm font-medium">Standort:</span>
        </div>

        <div className="flex-1 w-full sm:min-w-0">
          <AddressAutocomplete
            label=""
            placeholder="Stadt oder Adresse eingeben..."
            value={address}
            onChange={setAddress}
            onKeyDown={handleKeyPress}
            className="border-orange-200 focus:border-orange-400 text-base h-10"
          />
        </div>

        <div className="flex items-center gap-3 min-w-fit">
          <Select value={radius} onValueChange={setRadius}>
            <SelectTrigger className="w-24 h-10 border-orange-200 text-sm">
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
            disabled={!address.trim() || isSearching}
            size="default"
            className="bg-orange-500 hover:bg-orange-600 text-white h-10 px-4"
          >
            {isSearching ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>

          {onNearbySearch && (
            <Button
              onClick={onNearbySearch}
              variant="outline"
              size="default"
              className="h-10 px-4 bg-white border-teal-500 text-teal-600 hover:bg-teal-50 whitespace-nowrap"
            >
              <MapPin className="h-4 w-4 mr-2" />
              In meiner Nähe
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
