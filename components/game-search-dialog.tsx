"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, Users, Clock, Calendar } from "lucide-react"

interface GameSearchResult {
  id: string
  name: string
  yearPublished: number | null
  minPlayers: number | null
  maxPlayers: number | null
  playingTime: number | null
  minAge: number | null
  image: string | null
  publishers: string[]
  categories: string[]
  mechanics: string[]
}

interface GameSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGameSelect: (game: GameSearchResult) => void
}

export function GameSearchDialog({ open, onOpenChange, onGameSelect }: GameSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<GameSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    console.log("[v0] Starting search for:", searchQuery)
    setIsSearching(true)
    setHasSearched(true)
    try {
      const url = `/api/boardgamegeek/search?q=${encodeURIComponent(searchQuery)}`
      console.log("[v0] Fetching from:", url)

      const response = await fetch(url)
      console.log("[v0] Response status:", response.status)

      const data = await response.json()
      console.log("[v0] Response data:", data)

      if (data.games) {
        console.log("[v0] Setting search results:", data.games.length, "games")
        setSearchResults(data.games)
      } else if (data.error) {
        console.error("[v0] API returned error:", data.error)
      }
    } catch (error) {
      console.error("[v0] Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const formatPlayerCount = (min: number | null, max: number | null) => {
    if (!min && !max) return "Unbekannt"
    if (min === max) return `${min} Spieler`
    if (!min) return `bis ${max} Spieler`
    if (!max) return `ab ${min} Spieler`
    return `${min}-${max} Spieler`
  }

  const formatPlayingTime = (time: number | null) => {
    if (!time) return "Unbekannt"
    if (time < 60) return `${time} Min.`
    const hours = Math.floor(time / 60)
    const minutes = time % 60
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}min`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-handwritten text-xl text-teal-700 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Spiel in der Datenbank suchen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Spielname eingeben..."
              className="font-body border-2 border-teal-200 focus:border-teal-400"
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-teal-400 hover:bg-teal-500 text-white"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto space-y-3">
            {searchResults.map((game) => (
              <div
                key={game.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  onGameSelect(game)
                  onOpenChange(false)
                }}
              >
                <div className="flex gap-4">
                  {/* Game Image */}
                  <div className="w-16 h-20 flex-shrink-0">
                    {game.image ? (
                      <img
                        src={game.image || "/placeholder.svg"}
                        alt={game.name}
                        className="w-full h-full object-cover rounded border"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded border flex items-center justify-center">
                        <span className="text-xs text-gray-500">Kein Bild</span>
                      </div>
                    )}
                  </div>

                  {/* Game Details */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-handwritten text-lg text-gray-800">
                        {game.name}
                        {game.yearPublished && (
                          <span className="text-sm text-gray-500 ml-2">({game.yearPublished})</span>
                        )}
                      </h3>
                      {game.publishers.length > 0 && (
                        <p className="text-sm text-gray-600 font-body">{game.publishers.join(", ")}</p>
                      )}
                    </div>

                    {/* Game Stats */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {formatPlayerCount(game.minPlayers, game.maxPlayers)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatPlayingTime(game.playingTime)}
                      </div>
                      {game.minAge && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          ab {game.minAge} Jahren
                        </div>
                      )}
                    </div>

                    {/* Categories */}
                    {game.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {game.categories.slice(0, 3).map((category) => (
                          <Badge key={category} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                        {game.categories.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{game.categories.length - 3} mehr
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {!hasSearched && searchQuery && (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="font-body">Enter klicken zum Suchen</p>
              </div>
            )}

            {hasSearched && searchResults.length === 0 && searchQuery && !isSearching && (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="font-body">Keine Spiele gefunden für "{searchQuery}"</p>
                <p className="text-sm">Versuche einen anderen Suchbegriff oder gib gerne das Spiel selber ein.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
