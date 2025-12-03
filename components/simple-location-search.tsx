"use client"

import type React from "react"
import { useState } from "react"
import { FaSearch } from "react-icons/fa"
import { FaLocationDot } from "react-icons/fa6"
import { FaSearchLocation } from "react-icons/fa"
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex-1 w-full sm:min-w-0">
          <div className="relative">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 z-10">
              <FaSearchLocation className="w-3.5 h-3.5" />
            </div>
            <AddressAutocomplete
              label=""
              placeholder="Location, Adresse, PLZ oder Ort eingeben..."
              value={address}
              onChange={setAddress}
              onKeyDown={handleKeyPress}
              className="border border-gray-200 focus:border-gray-400 text-xs h-9 pl-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 min-w-fit">
          <Select value={radius} onValueChange={setRadius}>
            <SelectTrigger className="w-24 h-9 border border-gray-200 text-xs">
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
            size="sm"
            className="bg-teal-500 hover:bg-teal-600 text-white h-9 px-3"
          >
            {isSearching ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <FaSearch className="h-3.5 w-3.5" />
            )}
          </Button>

          {onNearbySearch && (
            <Button
              onClick={onNearbySearch}
              variant="outline"
              size="sm"
              className="h-9 px-3 border border-gray-200 text-gray-600 hover:bg-teal-400 hover:text-black whitespace-nowrap text-xs bg-transparent"
            >
              <FaLocationDot className="h-3.5 w-3.5 mr-1.5" />
              In meiner Nähe
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
