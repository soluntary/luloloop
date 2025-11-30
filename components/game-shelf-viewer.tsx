"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Library, Repeat, ShoppingCart, Calendar, Gamepad2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { useRequests } from "@/contexts/requests-context"

interface Game {
  id: string
  title: string
  publisher?: string
  condition: string
  players?: string
  duration?: string
  age?: string
  language?: string
  available: string[]
  image?: string
  user_id?: string
  created_at?: string
  type?: string
  style?: string
  besonderheit?: string
  latitude?: number
  longitude?: number
  location?: string
}

interface GameShelfViewerProps {
  userId: string
  userName: string
  isOpen: boolean
  onClose: () => void
  onBack: () => void
}

export function GameShelfViewer({ userId, userName, isOpen, onClose, onBack }: GameShelfViewerProps) {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [requestType, setRequestType] = useState<"trade" | "buy" | "rent" | null>(null)
  const { user: currentUser } = useAuth()
  const { sendGameInteractionRequest } = useRequests()

  const FALLBACK_IMAGE = "/images/ludoloop-game-placeholder.png"

  const supabase = createClient()

  useEffect(() => {
    if (userId && isOpen) {
      loadUserGames()
    }
  }, [userId, isOpen])

  const loadUserGames = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("user_id", userId)
        .order("title", { ascending: true })

      if (error) throw error

      const gamesWithFallback = (data || []).map((game) => ({
        ...game,
        image: game.image || FALLBACK_IMAGE,
      }))

      setGames(gamesWithFallback)
    } catch (err) {
      console.error("Error loading user games:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleGameClick = (game: Game) => {
    setSelectedGame(game)
  }

  const handleRequestClick = (type: "trade" | "buy" | "rent") => {
    setRequestType(type)
    setShowRequestDialog(true)
  }

  const handleSendRequest = async (message: string) => {
    if (!selectedGame || !requestType || !currentUser) return

    try {
      await sendGameInteractionRequest({
        ownerId: userId,
        gameId: selectedGame.id,
        requestType,
        message,
      })
      setShowRequestDialog(false)
      setRequestType(null)
      // Show success message or update UI
    } catch (error) {
      console.error("Error sending game request:", error)
    }
  }

  const renderShelfRows = () => {
    if (games.length === 0) {
      return (
        <div className="text-center py-12">
          <Gamepad2 className="w-16 h-16 text-amber-600 mx-auto mb-4" />
          <p className="text-amber-700 text-lg font-handwritten">Keine Spiele im Regal</p>
        </div>
      )
    }

    const rows = []
    const gamesPerRow = 8

    for (let i = 0; i < games.length; i += gamesPerRow) {
      const rowGames = games.slice(i, i + gamesPerRow)
      rows.push(
        <div key={i} className="relative">
          {/* Shelf Board */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-b from-amber-600 to-amber-700 rounded-lg shadow-md"></div>

          {/* Games on Shelf */}
          <div className="flex gap-2 pb-4 overflow-x-auto">
            {rowGames.map((game) => (
              <div
                key={game.id}
                className="flex-shrink-0 cursor-pointer transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 relative"
                onClick={() => handleGameClick(game)}
              >
                {/* Availability indicator */}
                <div className="absolute top-1 left-1 z-10">
                  <div
                    className={`w-4 h-4 rounded-full border border-white shadow-sm ${
                      game.available?.includes("available") ? "bg-green-500" : "bg-red-500"
                    }`}
                    title={game.available?.includes("available") ? "Verfügbar" : "Nicht verfügbar"}
                  />
                </div>

                <div className="w-24 h-32 bg-white rounded-t-lg shadow-lg border-2 border-gray-300 overflow-hidden relative">
                  <img src={game.image || "/placeholder.svg"} alt={game.title} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-1">
                    <p className="text-white text-xs font-bold text-center leading-tight font-handwritten truncate">
                      {game.title}
                    </p>
                  </div>
                </div>
                <div className="w-24 h-2 bg-gradient-to-b from-gray-300 to-gray-400 rounded-b-sm"></div>
              </div>
            ))}
          </div>
        </div>,
      )
    }

    return rows
  }

  return (
    <>
      <Dialog open={isOpen && !showRequestDialog} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Library className="h-5 w-5 mr-2" />
              {userName}'s Spielregal
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Shelf Display */}
              <div className="bg-gradient-to-b from-amber-100 to-amber-200 rounded-lg p-6 shadow-lg border-4 border-amber-300">
                <div className="mb-6 text-center">
                  <h3 className="text-2xl font-bold text-amber-800 transform rotate-1 font-handwritten">
                    {userName}'s Spielregal
                  </h3>
                  <p className="text-amber-700 text-xs mt-2">{games.length} Spiele</p>
                </div>

                <div className="space-y-8">{renderShelfRows()}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Game Detail Modal */}
      {selectedGame && (
        <Dialog open={!!selectedGame && !showRequestDialog} onOpenChange={() => setSelectedGame(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Button variant="ghost" size="sm" onClick={() => setSelectedGame(null)} className="mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {selectedGame.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Game Image */}
              <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={selectedGame.image || "/placeholder.svg"}
                  alt={selectedGame.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Game Details */}
              <div className="space-y-3">
                <div className="flex items-center text-xs text-gray-600">
                  {selectedGame.available?.includes("available") ? (
                    <Badge className="bg-green-100 text-green-800">Verfügbar</Badge>
                  ) : (
                    <Badge variant="destructive">Nicht verfügbar</Badge>
                  )}
                </div>

                {selectedGame.publisher && (
                  <div className="flex items-center text-xs text-gray-600">
                    <span className="text-xs text-gray-900 font-semibold mr-1">Verlag:</span>
                    <span>{selectedGame.publisher}</span>
                  </div>
                )}

                {selectedGame.players && (
                  <div className="flex items-center text-xs text-gray-600">
                    <span className="text-xs text-gray-900 font-semibold mr-1">Spieleranzahl:</span>
                    <span>{selectedGame.players}</span>
                  </div>
                )}

                {selectedGame.duration && (
                  <div className="flex items-center text-xs text-gray-600">
                    <span className="text-xs text-gray-900 font-semibold mr-1">Spieldauer:</span>
                    <span>{selectedGame.duration}</span>
                  </div>
                )}

                {selectedGame.age && (
                  <div className="flex items-center text-xs text-gray-600">
                    <span className="text-xs text-gray-900 font-semibold mr-1">Altersempfehlung:</span>
                    <span>{selectedGame.age}</span>
                  </div>
                )}

                {selectedGame.language && (
                  <div className="flex items-center text-xs text-gray-600">
                    <span className="text-xs text-gray-900 font-semibold mr-1">Sprache:</span>
                    <span>{selectedGame.language}</span>
                  </div>
                )}

                {selectedGame.type && (
                  <div className="flex items-center text-xs text-gray-600">
                    <span className="text-xs text-gray-900 font-semibold mr-1">Kategorie:</span>
                    <span>{selectedGame.type}</span>
                  </div>
                )}

                {selectedGame.style && (
                  <div className="flex items-center text-xs text-gray-600">
                    <div className="flex items-start">
                      <span className="text-xs text-gray-900 font-semibold mr-1">Typus:</span>
                      <span>{selectedGame.style}</span>
                    </div>
                  </div>
                )}

                {selectedGame.location && (
                  <div className="flex items-center text-xs text-gray-600">
                    <span className="text-xs text-gray-900 font-semibold mr-1">Standort:</span>
                    <span>{selectedGame.location}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedGame.available?.includes("available") && currentUser && (
                <div className="space-y-2 pt-4 border-t">
                  <p className="text-xs text-gray-900 mb-3 font-semibold">Interesse an diesem Spiel?</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={() => handleRequestClick("trade")}
                      variant="outline"
                      size="sm"
                      className="flex flex-col items-center p-3 h-auto"
                    >
                      <Repeat className="h-4 w-4 mb-1" />
                      <span className="text-xs">Tauschanfrage</span>
                      <span className="text-xs">senden</span>
                    </Button>
                    <Button
                      onClick={() => handleRequestClick("buy")}
                      variant="outline"
                      size="sm"
                      className="flex flex-col items-center p-3 h-auto"
                    >
                      <ShoppingCart className="h-4 w-4 mb-1" />
                      <span className="text-xs">Kaufanfrage</span>
                      <span className="text-xs">senden</span>
                    </Button>
                    <Button
                      onClick={() => handleRequestClick("rent")}
                      variant="outline"
                      size="sm"
                      className="flex flex-col items-center p-3 h-auto"
                    >
                      <Calendar className="h-4 w-4 mb-1" />
                      <span className="text-xs">Mietanfrage</span>
                      <span className="text-xs">senden</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Request Dialog */}
      {showRequestDialog && selectedGame && requestType && (
        <GameRequestDialog
          game={selectedGame}
          requestType={requestType}
          ownerName={userName}
          isOpen={showRequestDialog}
          onClose={() => {
            setShowRequestDialog(false)
            setRequestType(null)
          }}
          onSend={handleSendRequest}
        />
      )}
    </>
  )
}

function GameRequestDialog({
  game,
  requestType,
  ownerName,
  isOpen,
  onClose,
  onSend,
}: {
  game: Game
  requestType: "trade" | "buy" | "rent"
  ownerName: string
  isOpen: boolean
  onClose: () => void
  onSend: (message: string) => void
}) {
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const getRequestTypeText = () => {
    switch (requestType) {
      case "trade":
        return "Tausch"
      case "buy":
        return "Kauf"
      case "rent":
        return "Leih"
      default:
        return ""
    }
  }

  const handleSend = async () => {
    setLoading(true)
    try {
      await onSend(message)
      onClose()
    } catch (error) {
      console.error("Error sending request:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {getRequestTypeText()}anfrage für "{game.title}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs text-gray-600">
            Du möchtest "{game.title}" von {ownerName}{" "}
            {requestType === "trade" ? "tauschen" : requestType === "buy" ? "kaufen" : "mieten"}.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nachricht (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hallo ${ownerName}, ich interessiere mich für "${game.title}"...`}
              className="w-full p-3 border border-gray-300 rounded-md resize-none h-24"
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Abbrechen
            </Button>
            <Button onClick={handleSend} disabled={loading} className="flex-1 bg-teal-600 hover:bg-teal-700">
              {loading ? "Wird gesendet..." : "Anfrage senden"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
