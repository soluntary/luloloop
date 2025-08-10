"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  PictureInPicture,
  Plus,
  Search,
  Eye,
  RefreshCw,
  ShoppingCart,
  Upload,
  Camera,
  Database,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState, Suspense, useRef } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Navigation } from "@/components/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useGames } from "@/contexts/games-context"
import { useAuth } from "@/contexts/auth-context"

function LibraryLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-teal-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce transform rotate-12">
          <BookOpen className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten">
          Bibliothek wird geladen...
        </h2>
        <p className="text-xl text-gray-600 transform rotate-1 font-handwritten">
          Deine Spiele werden aus dem Regal geholt!
        </p>
        <div className="mt-8 flex justify-center space-x-2">
          <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    </div>
  )
}

function LibraryContent() {
  const { games, addGame, addMarketplaceOffer, loading, error, databaseConnected } = useGames()
  const { user } = useAuth()
  const [selectedGame, setSelectedGame] = useState<(typeof games)[0] | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Spiel anbieten Dialog States
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false)
  const [offerGame, setOfferGame] = useState<(typeof games)[0] | null>(null)
  const [offerType, setOfferType] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")

  // Neues Spiel hinzufügen Dialog States
  const [isAddGameDialogOpen, setIsAddGameDialogOpen] = useState(false)
  const [newGameTitle, setNewGameTitle] = useState("")
  const [newGamePublisher, setNewGamePublisher] = useState("")
  const [newGameCondition, setNewGameCondition] = useState("")
  const [newGamePlayers, setNewGamePlayers] = useState("")
  const [newGameDuration, setNewGameDuration] = useState("")
  const [newGameAge, setNewGameAge] = useState("")
  const [newGameLanguage, setNewGameLanguage] = useState("")
  const [newGameImage, setNewGameImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [sortBy, setSortBy] = useState("title")
  const [filterCondition, setFilterCondition] = useState("all")
  const [filterAvailability, setFilterAvailability] = useState("all")

  const filteredGames = games
    .filter((game) => {
      // Suchfilter
      const matchesSearch =
        game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.publisher.toLowerCase().includes(searchTerm.toLowerCase())

      // Zustandsfilter
      const matchesCondition = filterCondition === "all" || game.condition === filterCondition

      // Verfügbarkeitsfilter
      const matchesAvailability = filterAvailability === "all" || game.available.includes(filterAvailability)

      return matchesSearch && matchesCondition && matchesAvailability
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title)
        case "publisher":
          return a.publisher.localeCompare(b.publisher)
        case "condition":
          const conditionOrder = ["Wie neu", "Sehr gut", "Gut", "Akzeptabel"]
          return conditionOrder.indexOf(a.condition) - conditionOrder.indexOf(b.condition)
        default:
          return 0
      }
    })

  const getAvailabilityColor = (type: string) => {
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

  const getAvailabilityText = (type: string) => {
    switch (type) {
      case "lend":
        return "Verleihen"
      case "trade":
        return "Tauschen"
      case "sell":
        return "Verkaufen"
      default:
        return type
    }
  }

  // Spiel anbieten Funktionen
  const handleOfferGame = (game: (typeof games)[0], type: string) => {
    if (!databaseConnected) {
      alert("Datenbank ist nicht verfügbar. Bitte führe zuerst die SQL-Skripte aus.")
      return
    }

    setOfferGame(game)
    setOfferType(type)
    setPrice("")
    setDescription("")
    setIsOfferDialogOpen(true)
  }

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!offerGame || !offerType || !user) {
      alert("Fehler beim Anbieten des Spiels!")
      return
    }

    if (!databaseConnected) {
      alert("Datenbank ist nicht verfügbar. Bitte führe zuerst die SQL-Skripte aus.")
      return
    }

    try {
      // Add to marketplace
      await addMarketplaceOffer({
        title: offerGame.title,
        publisher: offerGame.publisher,
        condition: offerGame.condition,
        type: offerType as "lend" | "trade" | "sell",
        price: price || (offerType === "trade" ? "Tausch angeboten" : "Preis auf Anfrage"),
        location: "Berlin Mitte", // Would come from user profile
        distance: "0.5 km",
        image: offerGame.image,
        game_id: offerGame.id,
        description: description.trim() || undefined,
        active: true,
      })

      alert(
        `${offerGame.title} wurde erfolgreich zum ${getAvailabilityText(offerType)} angeboten und erscheint jetzt im Marktplatz!`,
      )

      // Reset form
      setOfferGame(null)
      setOfferType("")
      setPrice("")
      setDescription("")
      setIsOfferDialogOpen(false)
    } catch (error) {
      console.error("Error offering game:", error)
      alert("Fehler beim Anbieten des Spiels!")
    }
  }

  // Neues Spiel hinzufügen Funktionen
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setNewGameImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newGameTitle || !newGamePublisher || !newGameCondition) {
      alert("Bitte fülle mindestens Titel, Verlag und Zustand aus!")
      return
    }

    if (!databaseConnected) {
      alert("Datenbank ist nicht verfügbar. Bitte führe zuerst die SQL-Skripte aus.")
      return
    }

    try {
      const newGameData = {
        title: newGameTitle,
        publisher: newGamePublisher,
        condition: newGameCondition,
        players: newGamePlayers || "1-4",
        duration: newGameDuration || "30-60 min",
        age: newGameAge || "8+",
        language: newGameLanguage || "Deutsch",
        available: ["lend", "trade", "sell"],
        image: newGameImage || `/placeholder.svg?height=200&width=150&text=${encodeURIComponent(newGameTitle)}`,
      }

      await addGame(newGameData)

      alert(`${newGameData.title} wurde erfolgreich zu deiner Bibliothek hinzugefügt und erscheint jetzt im Regal!`)

      // Reset form
      setNewGameTitle("")
      setNewGamePublisher("")
      setNewGameCondition("")
      setNewGamePlayers("")
      setNewGameDuration("")
      setNewGameAge("")
      setNewGameLanguage("")
      setNewGameImage(null)
      setIsAddGameDialogOpen(false)
    } catch (error) {
      console.error("Error adding game:", error)
      alert("Fehler beim Hinzufügen des Spiels!")
    }
  }

  if (loading) {
    return <LibraryLoading />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      {/* Header */}
      <Navigation currentPage="library" />

      <div className="container mx-auto px-4 py-8">
        {/* Database Error Banner */}
        {error && (
          <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-start space-x-4">
              <Database className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-red-700 font-handwritten text-xl mb-2">
                  🚨 Datenbank-Setup erforderlich
                </h3>
                <p className="text-red-600 font-body mb-4">{error}</p>
                <div className="bg-red-100 p-4 rounded-lg border border-red-200">
                  <h4 className="font-bold text-red-700 font-handwritten mb-2">Setup-Anleitung:</h4>
                  <ol className="text-red-600 font-body space-y-1 text-sm">
                    <li>1. Öffne dein Supabase-Dashboard</li>
                    <li>2. Gehe zum SQL Editor</li>
                    <li>3. Führe die Skripte in dieser Reihenfolge aus:</li>
                    <li className="ml-4">• scripts/01-create-tables.sql</li>
                    <li className="ml-4">• scripts/02-create-policies.sql</li>
                    <li className="ml-4">• scripts/03-seed-data.sql (optional)</li>
                    <li>4. Aktualisiere die Seite</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-bold text-gray-800 transform -rotate-1 font-handwritten">
            Meine Spielbibliothek
          </h2>
          <Dialog open={isAddGameDialogOpen} onOpenChange={setIsAddGameDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-teal-400 hover:bg-teal-500 text-white transform rotate-1 hover:rotate-0 transition-all font-handwritten"
                disabled={!databaseConnected}
              >
                <Plus className="w-5 h-5 mr-2" />
                Neues Spiel hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-handwritten text-2xl text-center">🎲 Neues Spiel hinzufügen</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddGameSubmit} className="space-y-4">
                {/* Bild Upload */}
                <div className="text-center">
                  <div className="w-32 h-40 mx-auto mb-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                    {newGameImage ? (
                      <img
                        src={newGameImage || "/placeholder.svg"}
                        alt="Spiel Cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 font-body">Spiel Cover</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="font-handwritten"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Bild hochladen
                  </Button>
                </div>

                {/* Grunddaten */}
                <div>
                  <Label className="font-body">Spieltitel *</Label>
                  <Input
                    value={newGameTitle}
                    onChange={(e) => setNewGameTitle(e.target.value)}
                    placeholder="z.B. Catan"
                    className="font-body"
                    required
                  />
                </div>

                <div>
                  <Label className="font-body">Verlag *</Label>
                  <Input
                    value={newGamePublisher}
                    onChange={(e) => setNewGamePublisher(e.target.value)}
                    placeholder="z.B. Kosmos"
                    className="font-body"
                    required
                  />
                </div>

                <div>
                  <Label className="font-body">Zustand *</Label>
                  <Select value={newGameCondition} onValueChange={setNewGameCondition}>
                    <SelectTrigger className="font-body">
                      <SelectValue placeholder="Zustand wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Wie neu" className="font-body">
                        Wie neu
                      </SelectItem>
                      <SelectItem value="Sehr gut" className="font-body">
                        Sehr gut
                      </SelectItem>
                      <SelectItem value="Gut" className="font-body">
                        Gut
                      </SelectItem>
                      <SelectItem value="Akzeptabel" className="font-body">
                        Akzeptabel
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Zusätzliche Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-body">Spieler</Label>
                    <Input
                      value={newGamePlayers}
                      onChange={(e) => setNewGamePlayers(e.target.value)}
                      placeholder="z.B. 2-4"
                      className="font-body"
                    />
                  </div>
                  <div>
                    <Label className="font-body">Dauer</Label>
                    <Input
                      value={newGameDuration}
                      onChange={(e) => setNewGameDuration(e.target.value)}
                      placeholder="z.B. 60 min"
                      className="font-body"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-body">Alter</Label>
                    <Input
                      value={newGameAge}
                      onChange={(e) => setNewGameAge(e.target.value)}
                      placeholder="z.B. 10+"
                      className="font-body"
                    />
                  </div>
                  <div>
                    <Label className="font-body">Sprache</Label>
                    <Input
                      value={newGameLanguage}
                      onChange={(e) => setNewGameLanguage(e.target.value)}
                      placeholder="z.B. Deutsch"
                      className="font-body"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddGameDialogOpen(false)}
                    className="flex-1 font-handwritten"
                  >
                    Abbrechen
                  </Button>
                  <Button type="submit" className="flex-1 bg-teal-400 hover:bg-teal-500 text-white font-handwritten">
                    Hinzufügen
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search, Sort and Filter */}
        <div className="space-y-4 mb-8">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Spiele durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-2 border-teal-200 focus:border-teal-400"
                disabled={!databaseConnected}
              />
            </div>
            <Button
              variant="outline"
              className="border-2 border-orange-400 text-orange-600 hover:bg-orange-400 hover:text-white font-handwritten bg-transparent"
              disabled={!databaseConnected}
            >
              <Search className="w-5 h-5 mr-2" />
              Suchen
            </Button>
          </div>

          <div className="flex gap-4 flex-wrap">
            {/* Sortierung */}
            <div className="flex items-center gap-2">
              <Label className="font-body text-sm">Sortieren:</Label>
              <Select value={sortBy} onValueChange={setSortBy} disabled={!databaseConnected}>
                <SelectTrigger className="w-40 font-body">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title" className="font-body">
                    Titel A-Z
                  </SelectItem>
                  <SelectItem value="publisher" className="font-body">
                    Verlag A-Z
                  </SelectItem>
                  <SelectItem value="condition" className="font-body">
                    Zustand
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter nach Zustand */}
            <div className="flex items-center gap-2">
              <Label className="font-body text-sm">Zustand:</Label>
              <Select value={filterCondition} onValueChange={setFilterCondition} disabled={!databaseConnected}>
                <SelectTrigger className="w-32 font-body">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-body">
                    Alle
                  </SelectItem>
                  <SelectItem value="Wie neu" className="font-body">
                    Wie neu
                  </SelectItem>
                  <SelectItem value="Sehr gut" className="font-body">
                    Sehr gut
                  </SelectItem>
                  <SelectItem value="Gut" className="font-body">
                    Gut
                  </SelectItem>
                  <SelectItem value="Akzeptabel" className="font-body">
                    Akzeptabel
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter nach Verfügbarkeit */}
            <div className="flex items-center gap-2">
              <Label className="font-body text-sm">Verfügbar für:</Label>
              <Select value={filterAvailability} onValueChange={setFilterAvailability} disabled={!databaseConnected}>
                <SelectTrigger className="w-32 font-body">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-body">
                    Alle
                  </SelectItem>
                  <SelectItem value="lend" className="font-body">
                    Verleihen
                  </SelectItem>
                  <SelectItem value="trade" className="font-body">
                    Tauschen
                  </SelectItem>
                  <SelectItem value="sell" className="font-body">
                    Verkaufen
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filter Button */}
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setSortBy("title")
                setFilterCondition("all")
                setFilterAvailability("all")
              }}
              className="border-2 border-gray-400 text-gray-600 hover:bg-gray-400 hover:text-white font-handwritten"
              disabled={!databaseConnected}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Zurücksetzen
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Library Shelf */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-b from-amber-100 to-amber-200 rounded-lg p-6 shadow-lg border-4 border-amber-300">
              {/* Library Background Illustration */}
              <div className="mb-6 text-center">
                <h3 className="text-2xl font-bold text-amber-800 transform rotate-1 font-handwritten">
                  Mein Spieleregal
                </h3>
              </div>

              {/* Shelf Rows */}
              <div className="space-y-8">
                {databaseConnected ? (
                  Array.from({ length: Math.ceil(filteredGames.length / 3) || 1 }, (_, shelfIndex) => (
                    <div key={shelfIndex} className="relative">
                      {/* Shelf Board */}
                      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-b from-amber-600 to-amber-700 rounded-lg shadow-md"></div>

                      {/* Games on Shelf */}
                      <div className="flex gap-2 pb-4 overflow-x-auto">
                        {filteredGames.slice(shelfIndex * 3, shelfIndex * 3 + 3).map((game) => (
                          <div
                            key={game.id}
                            className="flex-shrink-0 cursor-pointer transform hover:scale-105 hover:-translate-y-2 transition-all duration-300"
                            onClick={() => setSelectedGame(game)}
                          >
                            <div className="w-24 h-32 bg-white rounded-t-lg shadow-lg border-2 border-gray-300 overflow-hidden">
                              <img
                                src={game.image || "/placeholder.svg"}
                                alt={game.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="w-24 h-2 bg-gradient-to-b from-gray-300 to-gray-400 rounded-b-sm"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Database className="w-16 h-16 text-amber-600 mx-auto mb-4" />
                    <p className="text-amber-700 text-lg font-handwritten">Datenbank nicht verfügbar</p>
                    <p className="text-amber-600 text-sm font-body mt-2">
                      Führe die SQL-Skripte aus, um deine Spiele zu sehen
                    </p>
                  </div>
                )}

                {filteredGames.length === 0 && databaseConnected && (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-amber-600 mx-auto mb-4" />
                    <p className="text-amber-700 text-lg font-handwritten">Keine Spiele gefunden</p>
                    <p className="text-amber-600 text-sm font-body mt-2">Füge dein erstes Spiel hinzu!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Game Details Panel */}
          <div className="lg:col-span-1">
            {selectedGame ? (
              <Card className="sticky top-8 transform rotate-1 hover:rotate-0 transition-all border-2 border-teal-200">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <img
                      src={selectedGame.image || "/placeholder.svg"}
                      alt={selectedGame.title}
                      className="w-32 h-40 mx-auto rounded-lg shadow-lg mb-4"
                    />
                    <h3 className="text-2xl font-bold text-gray-800 mb-2 font-handwritten">{selectedGame.title}</h3>
                    <p className="text-gray-600 font-body">{selectedGame.publisher}</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="font-medium font-body">Zustand:</span>
                      <Badge variant="outline" className="font-body">
                        {selectedGame.condition}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium font-body">Spieler:</span>
                      <span className="font-body">{selectedGame.players}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium font-body">Dauer:</span>
                      <span className="font-body">{selectedGame.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium font-body">Alter:</span>
                      <span className="font-body">{selectedGame.age}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium font-body">Sprache:</span>
                      <span className="font-body">{selectedGame.language}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-bold mb-2 font-body">Anbieten als:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedGame.available.map((type) => (
                        <Badge key={type} className={`${getAvailabilityColor(type)} text-white font-body`}>
                          {getAvailabilityText(type)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={() => handleOfferGame(selectedGame, "lend")}
                      className="w-full bg-teal-400 hover:bg-teal-500 text-white font-handwritten"
                      disabled={!databaseConnected}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Verleihen
                    </Button>
                    <Button
                      onClick={() => handleOfferGame(selectedGame, "trade")}
                      className="w-full bg-orange-400 hover:bg-orange-500 text-white font-handwritten"
                      disabled={!databaseConnected}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Tauschen
                    </Button>
                    <Button
                      onClick={() => handleOfferGame(selectedGame, "sell")}
                      className="w-full bg-pink-400 hover:bg-pink-500 text-white font-handwritten"
                      disabled={!databaseConnected}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Verkaufen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="sticky top-8 transform -rotate-1 border-2 border-gray-200">
                <CardContent className="p-6 text-center">
                  <PictureInPicture className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-body">Klicke auf ein Spiel im Regal, um Details zu sehen!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Spiel anbieten Dialog */}
      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-handwritten text-2xl text-center">🎲 {offerGame?.title} anbieten</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOfferSubmit} className="space-y-4">
            <div className="text-center">
              <img
                src={offerGame?.image || "/placeholder.svg"}
                alt={offerGame?.title}
                className="w-24 h-32 mx-auto rounded-lg shadow-lg mb-4"
              />
              <p className="text-sm text-gray-600 font-body">
                {getAvailabilityText(offerType)} - {offerGame?.condition}
              </p>
            </div>

            {(offerType === "lend" || offerType === "sell") && (
              <div>
                <Label className="font-body">{offerType === "lend" ? "Preis pro Woche:" : "Verkaufspreis:"}</Label>
                <Input
                  type="text"
                  placeholder={offerType === "lend" ? "z.B. 5€/Woche" : "z.B. 25€"}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="font-body"
                />
              </div>
            )}

            <div>
              <Label className="font-body">Beschreibung (optional):</Label>
              <Textarea
                placeholder="Zusätzliche Informationen..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="font-body"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOfferDialogOpen(false)}
                className="flex-1 font-handwritten"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                className={`flex-1 ${getAvailabilityColor(offerType)} hover:opacity-90 text-white font-handwritten`}
              >
                {getAvailabilityText(offerType)}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function LibraryPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<LibraryLoading />}>
        <LibraryContent />
      </Suspense>
    </ProtectedRoute>
  )
}
