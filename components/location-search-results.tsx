"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Navigation, SortAsc } from "lucide-react"
import { DistanceBadge } from "./distance-badge"

interface LocationSearchResultsProps {
  results: any[]
  onItemClick?: (item: any) => void
  onContactItem?: (item: any) => void
  showDistance?: boolean
  itemType: "games" | "marketplace" | "events" | "communities"
}

export function LocationSearchResults({
  results,
  onItemClick,
  onContactItem,
  showDistance = true,
  itemType,
}: LocationSearchResultsProps) {
  const [sortBy, setSortBy] = useState<"distance" | "newest" | "title">("distance")

  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case "distance":
        return (a.distance || 0) - (b.distance || 0)
      case "newest":
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      case "title":
        return (a.title || "").localeCompare(b.title || "")
      default:
        return 0
    }
  })

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case "lend":
        return "bg-teal-400"
      case "trade":
        return "bg-orange-400"
      case "sell":
        return "bg-pink-400"
      default:
        return "bg-gray-400"
    }
  }

  const getItemTypeText = (type: string) => {
    switch (type) {
      case "lend":
        return "Ausleihen"
      case "trade":
        return "Tauschen"
      case "sell":
        return "Kaufen"
      default:
        return type
    }
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Ergebnisse in der Nähe</h3>
        <p className="text-gray-600">Versuche einen größeren Suchradius oder einen anderen Standort.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-gray-900">
            {results.length} {results.length === 1 ? "Ergebnis" : "Ergebnisse"} in der Nähe
          </span>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <SortAsc className="h-4 w-4 text-gray-500" />
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="distance">Nach Entfernung</SelectItem>
              <SelectItem value="newest">Nach Datum</SelectItem>
              <SelectItem value="title">Nach Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid gap-3">
        {sortedResults.map((item, index) => (
          <Card
            key={`${itemType}-${item.id}-${index}`}
            className="group hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500"
            onClick={() => onItemClick?.(item)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Image */}
                <div className="relative flex-shrink-0">
                  <img
                    src={item.image || "/images/ludoloop-game-placeholder.png"}
                    alt={item.title}
                    className="w-16 h-20 object-cover rounded-lg shadow-sm"
                  />
                  {item.type && itemType === "marketplace" && (
                    <div className="absolute -top-1 -right-1">
                      <div
                        className={`w-3 h-3 ${getItemTypeColor(item.type)} rounded-full border-2 border-white`}
                      ></div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{item.title}</h3>
                      {item.publisher && <p className="text-xs text-gray-500 mt-1">{item.publisher}</p>}
                      {item.description && itemType === "events" && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                      )}
                    </div>

                    {/* Distance Badge */}
                    {showDistance && <DistanceBadge distance={item.distance} className="flex-shrink-0" />}
                  </div>

                  {/* Item Details */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      {item.type && itemType === "marketplace" && (
                        <Badge variant="outline" className="text-xs">
                          {getItemTypeText(item.type)}
                        </Badge>
                      )}
                      {item.condition && (
                        <Badge variant="outline" className="text-xs">
                          {item.condition}
                        </Badge>
                      )}
                      {item.location && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </span>
                      )}
                    </div>

                    {/* Price or Action */}
                    <div className="flex items-center gap-2">
                      {item.price && <span className="font-semibold text-orange-600 text-xs">{item.price}</span>}
                      {onContactItem && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            onContactItem(item)
                          }}
                          className="text-xs h-7 px-2"
                        >
                          Kontakt
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
