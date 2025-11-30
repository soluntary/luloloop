"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { MapPin, Navigation, ChevronDown } from "lucide-react"
import { useGeolocation } from "@/contexts/geolocation-context"
import { useLocationSearch } from "@/contexts/location-search-context"

interface LocationFilterProps {
  onLocationSearch?: (results: any[]) => void
  searchType: "games" | "marketplace" | "events" | "communities"
  disabled?: boolean
}

export function LocationFilter({ onLocationSearch, searchType, disabled = false }: LocationFilterProps) {
  const { latitude, longitude, requestLocation, loading: geoLoading, error: geoError } = useGeolocation()
  const {
    filters,
    setFilters,
    searchGamesNearby,
    searchMarketplaceOffersNearby,
    searchEventsNearby,
    searchCommunitiesNearby,
    loading: searchLoading,
  } = useLocationSearch()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const radiusOptions = [
    { value: 1, label: "1 km" },
    { value: 5, label: "5 km" },
    { value: 10, label: "10 km" },
    { value: 25, label: "25 km" },
    { value: 50, label: "50 km" },
  ]

  const handleLocationSearch = async () => {
    if (!onLocationSearch) return

    try {
      let results: any[] = []

      switch (searchType) {
        case "games":
          results = await searchGamesNearby()
          break
        case "marketplace":
          results = await searchMarketplaceOffersNearby()
          break
        case "events":
          results = await searchEventsNearby()
          break
        case "communities":
          results = await searchCommunitiesNearby()
          break
      }

      onLocationSearch(results)
    } catch (error) {
      console.error("Location search error:", error)
    }
  }

  const hasLocation = latitude && longitude
  const isLoading = geoLoading || searchLoading

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-600" />
            <span className="text-xs font-medium text-gray-900">Standortsuche</span>
          </div>

          {!hasLocation && (
            <Button
              variant="outline"
              size="sm"
              onClick={requestLocation}
              disabled={isLoading || disabled}
              className="text-xs bg-transparent"
            >
              <Navigation className="h-3 w-3 mr-1" />
              {isLoading ? "..." : "Aktivieren"}
            </Button>
          )}
        </div>

        {geoError && (
          <div className="mb-3 p-2 text-xs text-red-600 bg-red-50 rounded border border-red-100">{geoError}</div>
        )}

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={filters.useCurrentLocation}
              onCheckedChange={(checked) => setFilters({ useCurrentLocation: checked })}
              disabled={!hasLocation || disabled}
              className="scale-75"
            />
            <Label className="text-xs text-gray-600">Mein Standort</Label>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs text-gray-600">Umkreis:</Label>
            <Select
              value={filters.radius.toString()}
              onValueChange={(value) => setFilters({ radius: Number.parseInt(value) })}
              disabled={disabled}
            >
              <SelectTrigger className="w-20 h-7 text-xs border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {radiusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!filters.useCurrentLocation && (
          <div className="mb-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-2"
            >
              <ChevronDown className={`h-3 w-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
              Koordinaten eingeben
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.000001"
                  placeholder="Breitengrad"
                  value={filters.customLatitude || ""}
                  onChange={(e) => setFilters({ customLatitude: Number.parseFloat(e.target.value) || undefined })}
                  className="h-7 px-2 text-xs border border-gray-300 rounded focus:border-gray-400 focus:outline-none"
                  disabled={disabled}
                />
                <input
                  type="number"
                  step="0.000001"
                  placeholder="Längengrad"
                  value={filters.customLongitude || ""}
                  onChange={(e) => setFilters({ customLongitude: Number.parseFloat(e.target.value) || undefined })}
                  className="h-7 px-2 text-xs border border-gray-300 rounded focus:border-gray-400 focus:outline-none"
                  disabled={disabled}
                />
              </div>
            )}
          </div>
        )}

        <Button
          onClick={handleLocationSearch}
          disabled={!hasLocation || isLoading || disabled}
          className="w-full h-8 text-xs bg-gray-900 hover:bg-gray-800 text-white"
        >
          {isLoading ? "Suche..." : `In der Nähe suchen`}
        </Button>
      </div>
    </div>
  )
}
