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
  Edit,
  Trash2,
  ChevronDown,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState, Suspense, useRef } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Navigation } from "@/components/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useGames } from "@/contexts/games-context"
import { useAuth } from "@/contexts/auth-context"

const AGE_OPTIONS = [
  "bis 4 Jahren",
  "ab 4 bis 5 Jahren",
  "ab 6 bis 7 Jahren",
  "ab 8 bis 9 Jahren",
  "ab 10 bis 11 Jahren",
  "ab 12 bis 13 Jahren",
  "ab 14 bis 17 Jahren",
  "ab 18 Jahren",
]

const GAME_TYPE_OPTIONS = [
  "Aktions- und Reaktionsspiel",
  "Brettspiel",
  "Detektiv- & Escapespiel",
  "Erweiterung",
  "Escape-Spiel",
  "Geschicklichkeitsspiel",
  "Glücksspiel",
  "Kartenspiel",
  "Legespiel",
  "Merkspiel",
  "Outdoor-Spiel",
  "Partyspiel",
  "Quiz-Spiel",
  "Roll-and-Write-Spiel",
  "Rollenspiel",
  "Trinkspiel",
  "Würfelspiel",
]

const PUBLISHER_OPTIONS = [
  "Abacusspiele",
  "Amigo",
  "Asmodée",
  "Cocktail Games",
  "Feuerland",
  "Game Factory",
  "Haba",
  "HCM Kinzel",
  "Hasbro",
  "Hans im Glück",
  "HeidelBÄR Games",
  "Huch!",
  "Kosmos",
  "Mattel",
  "Noris Spiele",
  "Pegasus Spiele",
  "Piatnik",
  "Queen Games",
  "Ravensburger",
  "Schmidt",
  "SmartGames",
  "Zoch Verlag",
]

const LANGUAGE_OPTIONS = ["Deutsch", "Französisch", "Englisch", "Italienisch"]

const GAME_STYLE_OPTIONS = ["Kompetitiv", "Strategisch", "Kooperativ", "Solospiel", "One vs. All"]

const DURATION_OPTIONS = [
  "< 10 Min.",
  "10-20 Min.",
  "20-30 Min.",
  "30-45 Min.",
  "45-60 Min.",
  "60-90 Min.",
  "> 90 Min.",
]

const PLAYER_COUNT_OPTIONS = [
  "1 bis 2 Personen",
  "1 bis 4 Personen",
  "2 bis 4 Personen",
  "1 bis 5 Personen",
  "2 bis 5 Personen",
  "3 bis 5 Personen",
  "1 bis 6 Personen",
  "2 bis 6 Personen",
  "3 bis 6 Personen",
  "4 bis 6 Personen",
]

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
  const { games, addGame, updateGame, deleteGame, addMarketplaceOffer, loading, error, databaseConnected } = useGames()
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
  const [newGameCustomPublisher, setNewGameCustomPublisher] = useState("")
  const [newGameCondition, setNewGameCondition] = useState("")
  const [newGamePlayerCount, setNewGamePlayerCount] = useState("")
  const [newGameDuration, setNewGameDuration] = useState("")
  const [newGameAge, setNewGameAge] = useState("")
  const [newGameLanguage, setNewGameLanguage] = useState("")
  const [newGameCustomLanguage, setNewGameCustomLanguage] = useState("")
  const [newGameStyle, setNewGameStyle] = useState<string[]>([])
  const [newGameCustomStyle, setNewGameCustomStyle] = useState("")
  const [newGameType, setNewGameType] = useState<string[]>([])
  const [newGameCustomType, setNewGameCustomType] = useState("")
  const [newGameImage, setNewGameImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Spiel bearbeiten Dialog States
  const [isEditGameDialogOpen, setIsEditGameDialogOpen] = useState(false)
  const [editGame, setEditGame] = useState<(typeof games)[0] | null>(null)
  const [editGameTitle, setEditGameTitle] = useState("")
  const [editGamePublisher, setEditGamePublisher] = useState("")
  const [editGameCustomPublisher, setEditGameCustomPublisher] = useState("")
  const [editGameCondition, setEditGameCondition] = useState("")
  const [editGamePlayerCount, setEditGamePlayerCount] = useState("")
  const [editGameDuration, setEditGameDuration] = useState("")
  const [editGameAge, setEditGameAge] = useState("")
  const [editGameLanguage, setEditGameLanguage] = useState("")
  const [editGameCustomLanguage, setEditGameCustomLanguage] = useState("")
  const [editGameStyle, setEditGameStyle] = useState<string[]>([])
  const [editGameCustomStyle, setEditGameCustomStyle] = useState("")
  const [editGameType, setEditGameType] = useState<string[]>([])
  const [editGameCustomType, setEditGameCustomType] = useState("")
  const [editGameImage, setEditGameImage] = useState<string | null>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  // Spiel löschen Dialog States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [gameToDelete, setGameToDelete] = useState<(typeof games)[0] | null>(null)

  const [sortBy, setSortBy] = useState("title")
  const [filterCondition, setFilterCondition] = useState("all")
  const [filterAvailability, setFilterAvailability] = useState("all")

  const filteredGames = games
    .filter((game) => {
      // Suchfilter
      const matchesSearch =
        game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.publisher?.toLowerCase().includes(searchTerm.toLowerCase())

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
          return (a.publisher || "").localeCompare(b.publisher || "")
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

  // Multi-select functions for Kategorie and Spielart
  const handleNewGameTypeToggle = (type: string) => {
    setNewGameType((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const handleEditGameTypeToggle = (type: string) => {
    setEditGameType((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const handleNewGameStyleToggle = (style: string) => {
    setNewGameStyle((prev) => (prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]))
  }

  const handleEditGameStyleToggle = (style: string) => {
    setEditGameStyle((prev) => (prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]))
  }

  // Custom input handlers
  const handleAddCustomPublisher = () => {
    if (newGameCustomPublisher.trim()) {
      setNewGamePublisher(newGameCustomPublisher.trim())
      setNewGameCustomPublisher("")
    }
  }

  const handleEditAddCustomPublisher = () => {
    if (editGameCustomPublisher.trim()) {
      setEditGamePublisher(editGameCustomPublisher.trim())
      setEditGameCustomPublisher("")
    }
  }

  const handleAddCustomType = () => {
    if (newGameCustomType.trim() && !newGameType.includes(newGameCustomType.trim())) {
      setNewGameType((prev) => [...prev, newGameCustomType.trim()])
      setNewGameCustomType("")
    }
  }

  const handleEditAddCustomType = () => {
    if (editGameCustomType.trim() && !editGameType.includes(editGameCustomType.trim())) {
      setEditGameType((prev) => [...prev, editGameCustomType.trim()])
      setEditGameCustomType("")
    }
  }

  const handleAddCustomLanguage = () => {
    if (newGameCustomLanguage.trim()) {
      setNewGameLanguage(newGameCustomLanguage.trim())
      setNewGameCustomLanguage("")
    }
  }

  const handleEditAddCustomLanguage = () => {
    if (editGameCustomLanguage.trim()) {
      setEditGameLanguage(editGameCustomLanguage.trim())
      setEditGameCustomLanguage("")
    }
  }

  const handleAddCustomStyle = () => {
    if (newGameCustomStyle.trim() && !newGameStyle.includes(newGameCustomStyle.trim())) {
      setNewGameStyle((prev) => [...prev, newGameCustomStyle.trim()])
      setNewGameCustomStyle("")
    }
  }

  const handleEditAddCustomStyle = () => {
    if (editGameCustomStyle.trim() && !editGameStyle.includes(editGameCustomStyle.trim())) {
      setEditGameStyle((prev) => [...prev, editGameCustomStyle.trim()])
      setEditGameCustomStyle("")
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
        image: offerGame.image || "/images/ludoloop-game-placeholder.png",
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

    if (
      !newGameTitle ||
      !newGamePublisher ||
      newGamePublisher === "custom" ||
      !newGameCondition ||
      !newGamePlayerCount ||
      !newGameDuration ||
      !newGameAge ||
      !newGameLanguage ||
      newGameLanguage === "custom" ||
      newGameType.length === 0 ||
      newGameStyle.length === 0
    ) {
      alert("Bitte fülle alle Pflichtfelder aus!")
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
        players: newGamePlayerCount,
        duration: newGameDuration,
        age: newGameAge,
        language: newGameLanguage,
        type: newGameType.join(", "),
        style: newGameStyle.join(", "),
        available: ["lend", "trade", "sell"],
        image: newGameImage || "/images/ludoloop-game-placeholder.png",
      }

      await addGame(newGameData)

      alert(`${newGameData.title} wurde erfolgreich zu deiner Bibliothek hinzugefügt und erscheint jetzt im Regal!`)

      // Reset form
      setNewGameTitle("")
      setNewGamePublisher("")
      setNewGameCustomPublisher("")
      setNewGameCondition("")
      setNewGamePlayerCount("")
      setNewGameDuration("")
      setNewGameAge("")
      setNewGameLanguage("")
      setNewGameCustomLanguage("")
      setNewGameType([])
      setNewGameCustomType("")
      setNewGameStyle([])
      setNewGameCustomStyle("")
      setNewGameImage(null)
      setIsAddGameDialogOpen(false)
    } catch (error) {
      console.error("Error adding game:", error)
      alert("Fehler beim Hinzufügen des Spiels!")
    }
  }

  // Spiel bearbeiten Funktionen
  const handleEditGame = (game: (typeof games)[0]) => {
    setEditGame(game)
    setEditGameTitle(game.title)
    setEditGamePublisher(game.publisher || "")
    setEditGameCondition(game.condition)
    setEditGamePlayerCount(game.players || "")
    setEditGameDuration(game.duration || "")
    setEditGameAge(game.age || "")
    setEditGameLanguage(game.language || "")

    // Parse existing type string back to array
    const existingTypes = game.type ? game.type.split(", ").filter((type) => GAME_TYPE_OPTIONS.includes(type)) : []
    setEditGameType(existingTypes)

    // Parse existing style string back to array
    const existingStyles = game.style
      ? game.style.split(", ").filter((style) => GAME_STYLE_OPTIONS.includes(style))
      : []
    setEditGameStyle(existingStyles)

    setEditGameImage(game.image)
    setIsEditGameDialogOpen(true)
  }

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setEditGameImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEditGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !editGame ||
      !editGameTitle ||
      !editGamePublisher ||
      editGamePublisher === "custom" ||
      !editGameCondition ||
      !editGamePlayerCount ||
      !editGameDuration ||
      !editGameAge ||
      !editGameLanguage ||
      editGameLanguage === "custom" ||
      editGameType.length === 0 ||
      editGameStyle.length === 0
    ) {
      alert("Bitte fülle alle Pflichtfelder aus!")
      return
    }

    if (!databaseConnected) {
      alert("Datenbank ist nicht verfügbar. Bitte führe zuerst die SQL-Skripte aus.")
      return
    }

    try {
      const updatedGameData = {
        title: editGameTitle,
        publisher: editGamePublisher,
        condition: editGameCondition,
        players: editGamePlayerCount,
        duration: editGameDuration,
        age: editGameAge,
        language: editGameLanguage,
        type: editGameType.join(", "),
        style: editGameStyle.join(", "),
        image: editGameImage || "/images/ludoloop-game-placeholder.png",
      }

      await updateGame(editGame.id, updatedGameData)

      alert(`${updatedGameData.title} wurde erfolgreich aktualisiert!`)

      // Reset form
      setEditGame(null)
      setEditGameTitle("")
      setEditGamePublisher("")
      setEditGameCustomPublisher("")
      setEditGameCondition("")
      setEditGamePlayerCount("")
      setEditGameDuration("")
      setEditGameAge("")
      setEditGameLanguage("")
      setEditGameCustomLanguage("")
      setEditGameType([])
      setEditGameCustomType("")
      setEditGameStyle([])
      setEditGameCustomStyle("")
      setEditGameImage(null)
      setIsEditGameDialogOpen(false)

      // Update selected game if it was the one being edited
      if (selectedGame?.id === editGame.id) {
        setSelectedGame({ ...editGame, ...updatedGameData })
      }
    } catch (error) {
      console.error("Error updating game:", error)
      alert("Fehler beim Aktualisieren des Spiels!")
    }
  }

  // Spiel löschen Funktionen
  const handleDeleteGame = (game: (typeof games)[0]) => {
    setGameToDelete(game)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!gameToDelete || !databaseConnected) {
      alert("Fehler beim Löschen des Spiels!")
      return
    }

    try {
      await deleteGame(gameToDelete.id)
      alert(`${gameToDelete.title} wurde erfolgreich aus deiner Bibliothek entfernt!`)

      // Clear selected game if it was the one being deleted
      if (selectedGame?.id === gameToDelete.id) {
        setSelectedGame(null)
      }

      setGameToDelete(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting game:", error)
      alert("Fehler beim Löschen des Spiels!")
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
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten">
            Meine Spielbibliothek
          </h1>
          <p className="text-xl text-gray-600 transform rotate-1 font-body">
            Verwalte deine Spiele und biete sie anderen an!
          </p>
          <div className="mt-6">
            <Dialog open={isAddGameDialogOpen} onOpenChange={setIsAddGameDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-teal-400 hover:bg-teal-500 text-white font-handwritten transform hover:scale-105 transition-all duration-200">
                  <Plus className="w-5 h-5 mr-2" />
                  Neues Spiel hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-handwritten text-2xl text-center">Neues Spiel hinzufügen</DialogTitle>
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
                    <Label className="font-body">Spielname *</Label>
                    <Input
                      value={newGameTitle}
                      onChange={(e) => setNewGameTitle(e.target.value)}
                      placeholder="z.B. Catan"
                      className="font-body"
                      required
                    />
                  </div>

                  <div>
                    <Label className="font-body">Verlag * (Einfachauswahl)</Label>
                    <Select value={newGamePublisher} onValueChange={setNewGamePublisher} required>
                      <SelectTrigger className="font-body">
                        <SelectValue placeholder="Verlag wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PUBLISHER_OPTIONS.map((publisher) => (
                          <SelectItem key={publisher} value={publisher} className="font-body">
                            {publisher}
                          </SelectItem>
                        ))}
                        {/* Show custom publisher if it exists and is not in the default options */}
                        {newGamePublisher &&
                          !PUBLISHER_OPTIONS.includes(newGamePublisher) &&
                          newGamePublisher !== "custom" && (
                            <SelectItem key={newGamePublisher} value={newGamePublisher} className="font-body font-bold">
                              {newGamePublisher} (Benutzerdefiniert)
                            </SelectItem>
                          )}
                        <SelectItem value="custom" className="font-body font-bold">
                          Eigenen Verlag eingeben...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {newGamePublisher === "custom" && (
                      <div className="mt-2 flex gap-2">
                        <Input
                          value={newGameCustomPublisher}
                          onChange={(e) => setNewGameCustomPublisher(e.target.value)}
                          placeholder="Verlag eingeben..."
                          className="font-body"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleAddCustomPublisher()
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddCustomPublisher}
                          className="bg-teal-400 hover:bg-teal-500 text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="font-body">Kategorie * (Mehrfachauswahl)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between font-body bg-transparent"
                          type="button"
                        >
                          {newGameType.length > 0 ? `${newGameType.length} ausgewählt` : "Kategorie wählen..."}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-0">
                        <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                          <h4 className="font-medium text-sm font-body">Kategorie auswählen:</h4>
                          {GAME_TYPE_OPTIONS.map((type) => (
                            <div key={type} className="flex items-center space-x-2">
                              <Checkbox
                                id={`new-type-${type}`}
                                checked={newGameType.includes(type)}
                                onCheckedChange={() => handleNewGameTypeToggle(type)}
                              />
                              <Label htmlFor={`new-type-${type}`} className="text-sm font-body cursor-pointer">
                                {type}
                              </Label>
                            </div>
                          ))}

                          {/* Custom Type Input */}
                          <div className="border-t pt-2 mt-2">
                            <h5 className="font-medium text-xs font-body text-gray-600 mb-2">
                              Eigenen Kategorie hinzufügen:
                            </h5>
                            <div className="flex gap-2">
                              <Input
                                value={newGameCustomType}
                                onChange={(e) => setNewGameCustomType(e.target.value)}
                                placeholder="Kategorie eingeben..."
                                className="text-xs font-body"
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    handleAddCustomType()
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleAddCustomType}
                                className="bg-teal-400 hover:bg-teal-500 text-white px-2"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Selected Types */}
                          {newGameType.length > 0 && (
                            <div className="border-t pt-2 mt-2">
                              <h5 className="font-medium text-xs font-body text-gray-600 mb-2">Ausgewählt:</h5>
                              <div className="flex flex-wrap gap-1">
                                {newGameType.map((type) => (
                                  <Badge
                                    key={type}
                                    variant="secondary"
                                    className="text-xs cursor-pointer"
                                    onClick={() => handleNewGameTypeToggle(type)}
                                  >
                                    {type} ×
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label className="font-body">Spielart * (Mehrfachauswahl)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between font-body bg-transparent"
                          type="button"
                        >
                          {newGameStyle.length > 0 ? `${newGameStyle.length} ausgewählt` : "Spielart wählen..."}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-0">
                        <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                          <h4 className="font-medium text-sm font-body">Spielart auswählen:</h4>
                          {GAME_STYLE_OPTIONS.map((style) => (
                            <div key={style} className="flex items-center space-x-2">
                              <Checkbox
                                id={`new-style-${style}`}
                                checked={newGameStyle.includes(style)}
                                onCheckedChange={() => handleNewGameStyleToggle(style)}
                              />
                              <Label htmlFor={`new-style-${style}`} className="text-sm font-body cursor-pointer">
                                {style}
                              </Label>
                            </div>
                          ))}

                          {/* Custom Style Input */}
                          <div className="border-t pt-2 mt-2">
                            <h5 className="font-medium text-xs font-body text-gray-600 mb-2">
                              Eigene Spielart hinzufügen:
                            </h5>
                            <div className="flex gap-2">
                              <Input
                                value={newGameCustomStyle}
                                onChange={(e) => setNewGameCustomStyle(e.target.value)}
                                placeholder="Spielart eingeben..."
                                className="text-xs font-body"
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    handleAddCustomStyle()
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleAddCustomStyle}
                                className="bg-teal-400 hover:bg-teal-500 text-white px-2"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Selected Styles */}
                          {newGameStyle.length > 0 && (
                            <div className="border-t pt-2 mt-2">
                              <h5 className="font-medium text-xs font-body text-gray-600 mb-2">Ausgewählt:</h5>
                              <div className="flex flex-wrap gap-1">
                                {newGameStyle.map((style) => (
                                  <Badge
                                    key={style}
                                    variant="secondary"
                                    className="text-xs cursor-pointer"
                                    onClick={() => handleNewGameStyleToggle(style)}
                                  >
                                    {style} ×
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label className="font-body">Zustand *</Label>
                    <Select value={newGameCondition} onValueChange={setNewGameCondition} required>
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
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label className="font-body">Spieleranzahl * (Einfachauswahl)</Label>
                      <Select value={newGamePlayerCount} onValueChange={setNewGamePlayerCount} required>
                        <SelectTrigger className="font-body">
                          <SelectValue placeholder="Spieleranzahl wählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PLAYER_COUNT_OPTIONS.map((count) => (
                            <SelectItem key={count} value={count} className="font-body">
                              {count}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="font-body">Spieldauer * (Einfachauswahl)</Label>
                      <Select value={newGameDuration} onValueChange={setNewGameDuration} required>
                        <SelectTrigger className="font-body">
                          <SelectValue placeholder="Spieldauer wählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          {DURATION_OPTIONS.map((duration) => (
                            <SelectItem key={duration} value={duration} className="font-body">
                              {duration}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label className="font-body">Altersempfehlung * (Einfachauswahl)</Label>
                      <Select value={newGameAge} onValueChange={setNewGameAge} required>
                        <SelectTrigger className="font-body">
                          <SelectValue placeholder="Altersempfehlung wählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          {AGE_OPTIONS.map((age) => (
                            <SelectItem key={age} value={age} className="font-body">
                              {age}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="font-body">Sprache * (Einfachauswahl)</Label>
                    <Select value={newGameLanguage} onValueChange={setNewGameLanguage} required>
                      <SelectTrigger className="font-body">
                        <SelectValue placeholder="Sprache wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map((language) => (
                          <SelectItem key={language} value={language} className="font-body">
                            {language}
                          </SelectItem>
                        ))}
                        {/* Show custom language if it exists and is not in the default options */}
                        {newGameLanguage &&
                          !LANGUAGE_OPTIONS.includes(newGameLanguage) &&
                          newGameLanguage !== "custom" && (
                            <SelectItem key={newGameLanguage} value={newGameLanguage} className="font-body font-bold">
                              {newGameLanguage} (Benutzerdefiniert)
                            </SelectItem>
                          )}
                        <SelectItem value="custom" className="font-body font-bold">
                          Eigene Sprache eingeben...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {newGameLanguage === "custom" && (
                      <div className="mt-2 flex gap-2">
                        <Input
                          value={newGameCustomLanguage}
                          onChange={(e) => setNewGameCustomLanguage(e.target.value)}
                          placeholder="Sprache eingeben..."
                          className="font-body"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleAddCustomLanguage()
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddCustomLanguage}
                          className="bg-teal-400 hover:bg-teal-500 text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
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
                  <>
                    {/* Add Game Cover and First Row */}
                    {filteredGames.length > 0 && (
                      <div className="relative">
                        {/* Shelf Board */}
                        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-b from-amber-600 to-amber-700 rounded-lg shadow-md"></div>

                        {/* First row with Add Game Cover and up to 5 games */}
                        <div className="flex gap-2 pb-4 overflow-x-auto">
                          {/* Add Game Cover - always first */}
                          <div
                            className="flex-shrink-0 cursor-pointer transform hover:scale-105 hover:-translate-y-2 transition-all duration-300"
                            onClick={() => setIsAddGameDialogOpen(true)}
                          >
                            <div className="w-24 h-32 bg-gradient-to-br from-teal-100 to-teal-200 rounded-t-lg shadow-lg border-2 border-dashed border-teal-400 overflow-hidden relative flex items-center justify-center">
                              <div className="text-center">
                                <Plus className="w-8 h-8 text-teal-600 mx-auto mb-1" />
                                <p className="text-xs text-teal-700 font-bold font-handwritten">Spiel hinzufügen</p>
                              </div>
                            </div>
                            <div className="w-24 h-2 bg-gradient-to-b from-gray-300 to-gray-400 rounded-b-sm"></div>
                          </div>

                          {/* First 5 games in the same row */}
                          {filteredGames.slice(0, 5).map((game) => (
                            <div
                              key={game.id}
                              className="flex-shrink-0 cursor-pointer transform hover:scale-105 hover:-translate-y-2 transition-all duration-300"
                              onClick={() => setSelectedGame(game)}
                            >
                              <div className="w-24 h-32 bg-white rounded-t-lg shadow-lg border-2 border-gray-300 overflow-hidden relative">
                                <img
                                  src={game.image || "/images/ludoloop-game-placeholder.png"}
                                  alt={game.title}
                                  className="w-full h-full object-cover"
                                />
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
                      </div>
                    )}

                    {/* Remaining games in subsequent rows */}
                    {filteredGames.length > 5 &&
                      Array.from({ length: Math.ceil((filteredGames.length - 5) / 6) }, (_, shelfIndex) => (
                        <div key={shelfIndex + 1} className="relative">
                          {/* Shelf Board */}
                          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-b from-amber-600 to-amber-700 rounded-lg shadow-md"></div>

                          {/* Games on Shelf - 6 per row */}
                          <div className="flex gap-2 pb-4 overflow-x-auto">
                            {filteredGames.slice(5 + shelfIndex * 6, 5 + shelfIndex * 6 + 6).map((game) => (
                              <div
                                key={game.id}
                                className="flex-shrink-0 cursor-pointer transform hover:scale-105 hover:-translate-y-2 transition-all duration-300"
                                onClick={() => setSelectedGame(game)}
                              >
                                <div className="w-24 h-32 bg-white rounded-t-lg shadow-lg border-2 border-gray-300 overflow-hidden relative">
                                  <img
                                    src={game.image || "/images/ludoloop-game-placeholder.png"}
                                    alt={game.title}
                                    className="w-full h-full object-cover"
                                  />
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
                        </div>
                      ))}

                    {/* Show Add Game Cover alone if no games */}
                    {filteredGames.length === 0 && (
                      <div className="relative">
                        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-b from-amber-600 to-amber-700 rounded-lg shadow-md"></div>
                        <div className="flex gap-2 pb-4">
                          <div
                            className="flex-shrink-0 cursor-pointer transform hover:scale-105 hover:-translate-y-2 transition-all duration-300"
                            onClick={() => setIsAddGameDialogOpen(true)}
                          >
                            <div className="w-24 h-32 bg-gradient-to-br from-teal-100 to-teal-200 rounded-t-lg shadow-lg border-2 border-dashed border-teal-400 overflow-hidden relative flex items-center justify-center">
                              <div className="text-center">
                                <Plus className="w-8 h-8 text-teal-600 mx-auto mb-1" />
                                <p className="text-xs text-teal-700 font-bold font-handwritten">Spiel hinzufügen</p>
                              </div>
                            </div>
                            <div className="w-24 h-2 bg-gradient-to-b from-gray-300 to-gray-400 rounded-b-sm"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Database className="w-16 h-16 text-amber-600 mx-auto mb-4" />
                    <p className="text-amber-700 text-lg font-handwritten">Datenbank nicht verfügbar</p>
                    <p className="text-amber-600 text-sm font-body mt-2">
                      Führe die SQL-Skripte aus, um deine Spiele zu sehen
                    </p>
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
                    <div className="relative w-32 h-40 mx-auto rounded-lg shadow-lg mb-4 overflow-hidden">
                      <img
                        src={selectedGame.image || "/images/ludoloop-game-placeholder.png"}
                        alt={selectedGame.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Game Title Overlay for Detail View */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-2">
                        <p className="text-white text-sm font-bold text-center leading-tight font-handwritten">
                          {selectedGame.title}
                        </p>
                      </div>
                    </div>
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
                      <span className="font-medium font-body">Spieleranzahl:</span>
                      <span className="font-body">{selectedGame.players}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium font-body">Spieldauer:</span>
                      <span className="font-body">{selectedGame.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium font-body">Altersempfehlung:</span>
                      <span className="font-body">{selectedGame.age}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium font-body">Sprache:</span>
                      <span className="font-body">{selectedGame.language}</span>
                    </div>
                    {selectedGame.type && (
                      <div className="flex justify-between">
                        <span className="font-medium font-body">Kategorie:</span>
                        <span className="font-body">{selectedGame.type}</span>
                      </div>
                    )}
                    {selectedGame.style && (
                      <div className="flex justify-between">
                        <span className="font-medium font-body">Spielart:</span>
                        <span className="font-body">{selectedGame.style}</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <h4 className="font-bold mb-2 font-body">Anbieten zum:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedGame.available.map((type) => (
                        <Badge key={type} className={`${getAvailabilityColor(type)} text-white font-body`}>
                          {getAvailabilityText(type)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Edit and Delete Buttons */}
                  <div className="space-y-2 mb-4">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditGame(selectedGame)}
                        className="flex-1 bg-blue-400 hover:bg-blue-500 text-white font-handwritten"
                        disabled={!databaseConnected}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Bearbeiten
                      </Button>
                      <Button
                        onClick={() => handleDeleteGame(selectedGame)}
                        className="flex-1 bg-red-400 hover:bg-red-500 text-white font-handwritten"
                        disabled={!databaseConnected}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Löschen
                      </Button>
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
              <div className="relative w-24 h-32 mx-auto rounded-lg shadow-lg mb-4 overflow-hidden">
                <img
                  src={offerGame?.image || "/images/ludoloop-game-placeholder.png"}
                  alt={offerGame?.title}
                  className="w-full h-full object-cover"
                />
                {/* Game Title Overlay for Dialog */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-1">
                  <p className="text-white text-xs font-bold text-center leading-tight font-handwritten truncate">
                    {offerGame?.title}
                  </p>
                </div>
              </div>
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

      {/* Spiel bearbeiten Dialog */}
      <Dialog open={isEditGameDialogOpen} onOpenChange={setIsEditGameDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-handwritten text-2xl text-center">✏️ Spiel bearbeiten</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditGameSubmit} className="space-y-4">
            {/* Bild Upload */}
            <div className="text-center">
              <div className="w-32 h-40 mx-auto mb-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden relative">
                {editGameImage ? (
                  <>
                    <img
                      src={editGameImage || "/placeholder.svg"}
                      alt="Spiel Cover"
                      className="w-full h-full object-cover"
                    />
                    {/* Game Title Overlay for Edit Dialog */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-1">
                      <p className="text-white text-xs font-bold text-center leading-tight font-handwritten truncate">
                        {editGameTitle || "Spielname"}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 font-body">Spiel Cover</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={editFileInputRef}
                onChange={handleEditImageUpload}
                accept="image/*"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => editFileInputRef.current?.click()}
                className="font-handwritten"
              >
                <Upload className="w-4 h-4 mr-2" />
                Bild ändern
              </Button>
            </div>

            {/* Grunddaten */}
            <div>
              <Label className="font-body">Spielname *</Label>
              <Input
                value={editGameTitle}
                onChange={(e) => setEditGameTitle(e.target.value)}
                placeholder="z.B. Catan"
                className="font-body"
                required
              />
            </div>

            <div>
              <Label className="font-body">Verlag * (Einfachauswahl)</Label>
              <Select value={editGamePublisher} onValueChange={setEditGamePublisher} required>
                <SelectTrigger className="font-body">
                  <SelectValue placeholder="Verlag wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {PUBLISHER_OPTIONS.map((publisher) => (
                    <SelectItem key={publisher} value={publisher} className="font-body">
                      {publisher}
                    </SelectItem>
                  ))}
                  {/* Show custom publisher if it exists and is not in the default options */}
                  {editGamePublisher &&
                    !PUBLISHER_OPTIONS.includes(editGamePublisher) &&
                    editGamePublisher !== "custom" && (
                      <SelectItem key={editGamePublisher} value={editGamePublisher} className="font-body font-bold">
                        {editGamePublisher} (Benutzerdefiniert)
                      </SelectItem>
                    )}
                  <SelectItem value="custom" className="font-body font-bold">
                    Eigenen Verlag eingeben...
                  </SelectItem>
                </SelectContent>
              </Select>
              {editGamePublisher === "custom" && (
                <div className="mt-2 flex gap-2">
                  <Input
                    value={editGameCustomPublisher}
                    onChange={(e) => setEditGameCustomPublisher(e.target.value)}
                    placeholder="Verlag eingeben..."
                    className="font-body"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleEditAddCustomPublisher()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleEditAddCustomPublisher}
                    className="bg-teal-400 hover:bg-teal-500 text-white"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label className="font-body">Kategorie * (Mehrfachauswahl)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-body bg-transparent" type="button">
                    {editGameType.length > 0 ? `${editGameType.length} ausgewählt` : "Kategorie wählen..."}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0">
                  <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                    <h4 className="font-medium text-sm font-body">Kategorie auswählen:</h4>
                    {GAME_TYPE_OPTIONS.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-type-${type}`}
                          checked={editGameType.includes(type)}
                          onCheckedChange={() => handleEditGameTypeToggle(type)}
                        />
                        <Label htmlFor={`edit-type-${type}`} className="text-sm font-body cursor-pointer">
                          {type}
                        </Label>
                      </div>
                    ))}

                    {/* Custom Type Input */}
                    <div className="border-t pt-2 mt-2">
                      <h5 className="font-medium text-xs font-body text-gray-600 mb-2">
                        Eigenen Kategorie hinzufügen:
                      </h5>
                      <div className="flex gap-2">
                        <Input
                          value={editGameCustomType}
                          onChange={(e) => setEditGameCustomType(e.target.value)}
                          placeholder="Kategorie eingeben..."
                          className="text-xs font-body"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleEditAddCustomType()
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleEditAddCustomType}
                          className="bg-teal-400 hover:bg-teal-500 text-white px-2"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Selected Types */}
                    {editGameType.length > 0 && (
                      <div className="border-t pt-2 mt-2">
                        <h5 className="font-medium text-xs font-body text-gray-600 mb-2">Ausgewählt:</h5>
                        <div className="flex flex-wrap gap-1">
                          {editGameType.map((type) => (
                            <Badge
                              key={type}
                              variant="secondary"
                              className="text-xs cursor-pointer"
                              onClick={() => handleEditGameTypeToggle(type)}
                            >
                              {type} ×
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="font-body">Spielart * (Mehrfachauswahl)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-body bg-transparent" type="button">
                    {editGameStyle.length > 0 ? `${editGameStyle.length} ausgewählt` : "Spielart wählen..."}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0">
                  <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                    <h4 className="font-medium text-sm font-body">Spielart auswählen:</h4>
                    {GAME_STYLE_OPTIONS.map((style) => (
                      <div key={style} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-style-${style}`}
                          checked={editGameStyle.includes(style)}
                          onCheckedChange={() => handleEditGameStyleToggle(style)}
                        />
                        <Label htmlFor={`edit-style-${style}`} className="text-sm font-body cursor-pointer">
                          {style}
                        </Label>
                      </div>
                    ))}

                    {/* Custom Style Input */}
                    <div className="border-t pt-2 mt-2">
                      <h5 className="font-medium text-xs font-body text-gray-600 mb-2">Eigene Spielart hinzufügen:</h5>
                      <div className="flex gap-2">
                        <Input
                          value={editGameCustomStyle}
                          onChange={(e) => setEditGameCustomStyle(e.target.value)}
                          placeholder="Spielart eingeben..."
                          className="text-xs font-body"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleEditAddCustomStyle()
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleEditAddCustomStyle}
                          className="bg-teal-400 hover:bg-teal-500 text-white px-2"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Selected Styles */}
                    {editGameStyle.length > 0 && (
                      <div className="border-t pt-2 mt-2">
                        <h5 className="font-medium text-xs font-body text-gray-600 mb-2">Ausgewählt:</h5>
                        <div className="flex flex-wrap gap-1">
                          {editGameStyle.map((style) => (
                            <Badge
                              key={style}
                              variant="secondary"
                              className="text-xs cursor-pointer"
                              onClick={() => handleEditGameStyleToggle(style)}
                            >
                              {style} ×
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="font-body">Zustand *</Label>
              <Select value={editGameCondition} onValueChange={setEditGameCondition} required>
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
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label className="font-body">Spieleranzahl * (Einfachauswahl)</Label>
                <Select value={editGamePlayerCount} onValueChange={setEditGamePlayerCount} required>
                  <SelectTrigger className="font-body">
                    <SelectValue placeholder="Spieleranzahl wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAYER_COUNT_OPTIONS.map((count) => (
                      <SelectItem key={count} value={count} className="font-body">
                        {count}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-body">Spieldauer * (Einfachauswahl)</Label>
                <Select value={editGameDuration} onValueChange={setEditGameDuration} required>
                  <SelectTrigger className="font-body">
                    <SelectValue placeholder="Spieldauer wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((duration) => (
                      <SelectItem key={duration} value={duration} className="font-body">
                        {duration}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-body">Altersempfehlung * (Einfachauswahl)</Label>
                <Select value={editGameAge} onValueChange={setEditGameAge} required>
                  <SelectTrigger className="font-body">
                    <SelectValue placeholder="Altersempfehlung wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_OPTIONS.map((age) => (
                      <SelectItem key={age} value={age} className="font-body">
                        {age}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-body">Sprache * (Einfachauswahl)</Label>
                <Select value={editGameLanguage} onValueChange={setEditGameLanguage} required>
                  <SelectTrigger className="font-body">
                    <SelectValue placeholder="Sprache wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((language) => (
                      <SelectItem key={language} value={language} className="font-body">
                        {language}
                      </SelectItem>
                    ))}
                    {/* Show custom language if it exists and is not in the default options */}
                    {editGameLanguage &&
                      !LANGUAGE_OPTIONS.includes(editGameLanguage) &&
                      editGameLanguage !== "custom" && (
                        <SelectItem key={editGameLanguage} value={editGameLanguage} className="font-body font-bold">
                          {editGameLanguage} (Benutzerdefiniert)
                        </SelectItem>
                      )}
                    <SelectItem value="custom" className="font-body font-bold">
                      Eigene Sprache eingeben...
                    </SelectItem>
                  </SelectContent>
                </Select>
                {editGameLanguage === "custom" && (
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={editGameCustomLanguage}
                      onChange={(e) => setEditGameCustomLanguage(e.target.value)}
                      placeholder="Sprache eingeben..."
                      className="font-body"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleEditAddCustomLanguage}
                      className="bg-teal-400 hover:bg-teal-500 text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditGameDialogOpen(false)}
                className="flex-1 font-handwritten"
              >
                Abbrechen
              </Button>
              <Button type="submit" className="flex-1 bg-blue-400 hover:bg-blue-500 text-white font-handwritten">
                Speichern
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Spiel löschen Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-handwritten text-2xl text-center">🗑️ Spiel löschen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="relative w-24 h-32 mx-auto rounded-lg shadow-lg mb-4 overflow-hidden">
                <img
                  src={gameToDelete?.image || "/images/ludoloop-game-placeholder.png"}
                  alt={gameToDelete?.title}
                  className="w-full h-full object-cover"
                />
                {/* Game Title Overlay for Delete Dialog */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-1">
                  <p className="text-white text-xs font-bold text-center leading-tight font-handwritten truncate">
                    {gameToDelete?.title}
                  </p>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2 font-handwritten">{gameToDelete?.title}</h3>
              <p className="text-gray-600 font-body">{gameToDelete?.publisher}</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-body text-center">
                Möchtest du dieses Spiel wirklich aus deiner Bibliothek entfernen? Diese Aktion kann nicht rückgängig
                gemacht werden.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="flex-1 font-handwritten"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-400 hover:bg-red-500 text-white font-handwritten"
              >
                Löschen
              </Button>
            </div>
          </div>
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
