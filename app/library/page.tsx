"use client"

import { Suspense, useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FaBook,
  FaImage,
  FaPlus,
  FaUpload,
  FaDice,
  FaCamera,
  FaInfoCircle,
  FaDatabase,
  FaEdit,
  FaTrash,
  FaChevronDown,
  FaTag,
  FaUsers,
  FaEyeSlash,
  FaCheck,
  FaTags,
} from "react-icons/fa"
import { MdOutlineManageSearch } from "react-icons/md"
import { GiReceiveMoney, GiBackForth } from "react-icons/gi"
import { TbExchange } from "react-icons/tb"
import { GrSelect } from "react-icons/gr"
import { Input } from "@/components/ui/input"
import { Navigation } from "@/components/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useGames } from "@/contexts/games-context"
import { useAuth } from "@/contexts/auth-context"
import { GameSearchDialog } from "@/components/game-search-dialog"
import { CreateMarketplaceOfferForm } from "@/components/create-marketplace-offer-form"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { FiFilter } from "react-icons/fi" // Import FiFilter

function GameTrackingDialog({
  isOpen,
  onClose,
  game,
  onUpdate,
}: {
  isOpen: boolean
  onClose: () => void
  game: any
  onUpdate: (gameId: string, trackingInfo: any) => void
}) {
  const [status, setStatus] = useState<"available" | "rented" | "swapped" | "lent">(
    game?.tracking_info?.status || "available",
  )
  const [rentedTo, setRentedTo] = useState(game?.tracking_info?.rented_to || "")
  const [rentedUntil, setRentedUntil] = useState<Date | undefined>(
    game?.tracking_info?.rented_until ? new Date(game.tracking_info.rented_until) : undefined,
  )
  const [swappedWith, setSwappedWith] = useState(game?.tracking_info?.swapped_with || "")
  const [notes, setNotes] = useState(game?.tracking_info?.notes || "")

  useEffect(() => {
    if (isOpen && game) {
      setStatus(game.tracking_info?.status || "available")
      setRentedTo(game.tracking_info?.rented_to || "")
      setRentedUntil(game.tracking_info?.rented_until ? new Date(game.tracking_info.rented_until) : undefined)
      setSwappedWith(game.tracking_info?.swapped_with || "")
      setNotes(game.tracking_info?.notes || "")
    }
  }, [isOpen, game])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(game.id, {
      status,
      rented_to: rentedTo,
      rented_until: rentedUntil ? rentedUntil.toISOString() : null,
      swapped_with: swappedWith,
      notes,
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-handwritten text-sm text-teal-600">Spiel-Status aktualisieren</DialogTitle>
          <DialogDescription>Hier kannst du festhalten, wo sich dein Spiel gerade befindet.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Aktueller Status</Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Im Regal (Verfügbar)</SelectItem>
                <SelectItem value="rented">Vermietet / Verliehen</SelectItem>
                <SelectItem value="swapped">Getauscht</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === "rented" && (
            <>
              <div className="space-y-2">
                <Label>An wen vermieten / verliehen?</Label>
                <Input
                  placeholder="Name des Ausleihers"
                  value={rentedTo}
                  onChange={(e) => setRentedTo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Bis wann?</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !rentedUntil && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {rentedUntil ? format(rentedUntil, "PPP", { locale: de }) : <span>Datum wählen</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={rentedUntil} onSelect={setRentedUntil} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}

          {status === "swapped" && (
            <div className="space-y-2">
              <Label>Mit wem getauscht?</Label>
              <Input
                placeholder="Name des Tauschpartners"
                value={swappedWith}
                onChange={(e) => setSwappedWith(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Notizen</Label>
            <Input placeholder="Zusätzliche Infos..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white">
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const GAME_TYPE_OPTIONS = [
  "Aktions- und Reaktionsspiel",
  "Brettspiel",
  "Erweiterung",
  "Escape-Spiel",
  "Geschicklichkeitsspiel",
  "Glücksspiel",
  "Kartenspiel",
  "Krimi- und Detektivspiel",
  "Legespiel",
  "Merkspiel",
  "Outdoor-Spiel",
  "Partyspiel",
  "Wissens- und Quizspiel",
  "Rollenspiel",
  "Trinkspiel",
  "Würfelspiel",
]

const publisherOptionsInit = [
  "Abacusspiele",
  "Amigo",
  "Asmodée",
  "Cocktail Games",
  "Feuerland",
  "Game Factory",
  "Gamewright",
  "Gigamic",
  "Haba",
  "Hans im Glück",
  "Hasbro",
  "HCM Kinzel",
  "Huch!",
  "Kosmos",
  "Lookout Games",
  "Mattel",
  "Noris Spiele",
  "Pegasus Spiele",
  "Piatnik",
  "Ravensburger",
  "Schmidt Spiele",
  "Stonemaier Games",
]

const LANGUAGE_OPTIONS = ["Deutsch", "Englisch", "Französisch", "Italienisch", "Andere"]

const GAME_STYLE_OPTIONS = [
  "Kooperativ",
  "Kompetitiv",
  "Semi-Kooperativ",
  "Strategisch",
  "Solospiel",
  "One vs. All",
  "Team vs. Team",
]

const PLAYER_COUNT_MIN_OPTIONS = [
  { value: "1", label: "Ab 1 Spieler" },
  { value: "2", label: "Ab 2 Spieler" },
  { value: "3", label: "Ab 3 Spieler" },
  { value: "4", label: "Ab 4 Spieler" },
  { value: "5", label: "Ab 5 Spieler" },
  { value: "6", label: "Ab 6 Spieler" },
  { value: "7", label: "Ab 7 Spieler" },
  { value: "8", label: "Ab 8 Spieler" },
  { value: "10", label: "Ab 10+ Spieler" },
]

const PLAYER_COUNT_MAX_OPTIONS = [
  { value: "2", label: "Bis 2 Spieler" },
  { value: "3", label: "Bis 3 Spieler" },
  { value: "4", label: "Bis 4 Spieler" },
  { value: "5", label: "Bis 5 Spieler" },
  { value: "6", label: "Bis 6 Spieler" },
  { value: "7", label: "Bis 7 Spieler" },
  { value: "8", label: "Bis 8 Spieler" },
  { value: "9", label: "Bis 9 Spieler" },
]

const AGE_OPTIONS = [
  "Ab 2 Jahren",
  "Ab 3 Jahren",
  "Ab 4 Jahren",
  "Ab 5 Jahren",
  "Ab 6 Jahren",
  "Ab 7 Jahren",
  "Ab 8 Jahren",
  "Ab 9 Jahren",
  "Ab 10 Jahren",
  "Ab 11 Jahren",
  "Ab 12 Jahren",
  "Ab 13 Jahren",
  "Ab 14 Jahren",
  "Ab 15 Jahren",
  "Ab 16 Jahren",
  "Ab 17 Jahren",
  "Ab 18 Jahren",
]

const durationOptionsInit = [
  "< 10 Min.",
  "10-20 Min.",
  "20-30 Min.",
  "30-45 Min.",
  "45-60 Min.",
  "45-90 Min.",
  "60-90 Min.",
  "60-120 Min.",
  "90-120 Min.",
]

const playerCountOptionsInit = [
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

// Placeholder for CATEGORY_OPTIONS and TYPE_OPTIONS as they were not provided in the existing code
const CATEGORY_OPTIONS = [
  "Aktions- und Reaktionsspiel",
  "Brettspiel",
  "Erweiterung",
  "Escape-Spiel",
  "Geschicklichkeitsspiel",
  "Glücksspiel",
  "Kartenspiel",
  "Krimi- und Detektivspiel",
  "Legespiel",
  "Merkspiel",
  "Outdoor-Spiel",
  "Partyspiel",
  "Wissens- und Quizspiel",
  "Rollenspiel",
  "Trinkspiel",
  "Würfelspiel",
]

const TYPE_OPTIONS = [
  "Kooperativ",
  "Kompetitiv",
  "Semi-Kooperativ",
  "Strategisch",
  "Solospiel",
  "One vs. All",
  "Team vs. Team",
]

function LibraryLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-teal-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce transform rotate-12">
          <FaBook className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten">
          Spieleregal wird geladen...
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
  const {
    games,
    addGame,
    updateGame,
    deleteGame,
    addMarketplaceOffer,
    loading,
    error,
    databaseConnected,
    toggleGameAvailability,
  } = useGames()
  const { user } = useAuth()

  const [selectedGame, setSelectedGame] = useState<(typeof games)[0] | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filters, setFilters] = useState({
    playerCountMin: "",
    playerCountMax: "",
    duration: "",
    age: "",
    language: "",
    category: "",
    type: "",
  })

  const [isCreateGameOpen, setIsCreateGameOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [isGameSearchDialogOpen, setIsGameSearchDialogOpen] = useState(false)

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
  const [publisherOptions, setPublisherOptions] = useState(publisherOptionsInit)
  const [playerCountOptions, setPlayerCountOptions] = useState(playerCountOptionsInit)
  const [durationOptions, setDurationOptions] = useState<string[]>(durationOptionsInit)
  const [gameTypeOptions, setGameTypeOptions] = useState(GAME_TYPE_OPTIONS) // Added state for game types
  const [gameStyleOptions, setGameStyleOptions] = useState(GAME_STYLE_OPTIONS) // Added state for game styles

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
  // const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false) // Removed, handled by isDeleteDialogOpen
  const [gameToDelete, setGameToDelete] = useState<(typeof games)[0] | null>(null)

  const [sortBy, setSortBy] = useState("title-asc")

  const [isCreateOfferOpen, setIsCreateOfferOpen] = useState(false)
  const [selectedOfferGame, setSelectedOfferGame] = useState<(typeof games)[0] | null>(null)
  const [selectedOfferType, setSelectedOfferType] = useState<string>("")
  const { toast } = useToast()

  const [fieldErrors, setFieldErrors] = useState({
    image: "",
    title: "",
    publisher: "",
    language: "",
    type: "",
    style: "",
    playerCount: "",
    duration: "",
    age: "",
  })

  // const [isGameSearchDialogOpen, setIsGameSearchDialogOpen] = useState(false) // Removed, handled by isGameSearchDialogOpen
  const [showGameSearch, setShowGameSearch] = useState(false)

  const [inputMode, setInputMode] = useState<"auto" | "manual">("auto")

  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  // const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false) // Removed, handled by isBulkDeleteDialogOpen

  const [isToggling, setIsToggling] = useState(false)

  const [localToggleState, setLocalToggleState] = useState<Record<string, boolean>>({})

  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false)

  useEffect(() => {
    if (selectedGame) {
      setLocalToggleState((prev) => {
        // Only initialize if not already set
        if (prev[selectedGame.id] === undefined) {
          return {
            ...prev,
            [selectedGame.id]: selectedGame.tracking_info?.status === "available" || false,
          }
        }
        return prev
      })
    }
  }, [selectedGame])

  const toggleGameSelection = (gameId: string) => {
    const newSelected = new Set(selectedGames)
    if (newSelected.has(gameId)) {
      newSelected.delete(gameId)
    } else {
      newSelected.add(gameId)
    }
    setSelectedGames(newSelected)
  }

  const selectAllGames = () => {
    if (selectedGames.size === filteredGames.length) {
      setSelectedGames(new Set())
    } else {
      setSelectedGames(new Set(filteredGames.map((game) => game.id)))
    }
  }

  const handleBulkDelete = () => {
    if (selectedGames.size === 0) return
    setIsBulkDeleteDialogOpen(true)
  }

  const handleConfirmBulkDelete = async () => {
    if (!databaseConnected || selectedGames.size === 0) {
      toast({ title: "Fehler", description: "Fehler beim Löschen der Spiele!", variant: "destructive" })
      return
    }

    try {
      const deletePromises = Array.from(selectedGames).map((gameId) => deleteGame(gameId))
      await Promise.all(deletePromises)

      toast({ title: "Spiele gelöscht", description: `${selectedGames.size} Spiele wurden erfolgreich aus deiner Bibliothek entfernt!` })

      // Clear selections and exit selection mode
      setSelectedGames(new Set())
      setIsSelectionMode(false)
      setSelectedGame(null)
      setIsBulkDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting games:", error)
      toast({ title: "Fehler", description: "Fehler beim Löschen der Spiele!", variant: "destructive" })
    }
  }

  const handleUpdateTracking = async (gameId: string, trackingInfo: any) => {
    try {
      const isAvailable = trackingInfo.status === "available"

      // Update tracking_info and set availability based on status
      await updateGame(gameId, {
        tracking_info: trackingInfo,
      })

      // Also update the game availability via toggleGameAvailability
      await toggleGameAvailability(gameId, isAvailable)

      // Update local toggle state based on new status
      setLocalToggleState((prev) => ({
        ...prev,
        [gameId]: isAvailable,
      }))

      // Update local state immediately for better UX
      if (selectedGame && selectedGame.id === gameId) {
        setSelectedGame({
          ...selectedGame,
          tracking_info: trackingInfo,
        })
      }

      toast({
        title: "Status aktualisiert",
        description: isAvailable
          ? "Das Spiel ist jetzt als verfügbar markiert."
          : "Das Spiel ist jetzt als nicht verfügbar markiert.",
      })
    } catch (error) {
      console.error("Error updating tracking info:", error)
      toast({
        title: "Fehler",
        description: "Status konnte nicht gespeichert werden.",
        variant: "destructive",
      })
    }
  }

  const filteredGames = games
    .filter((game) => {
      // Suchfilter
      const matchesSearch =
        game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.publisher?.toLowerCase().includes(searchTerm.toLowerCase())

      // Spieleranzahl Filter
      const matchesPlayerCount = (() => {
        const minFilter = filters.playerCountMin ? Number.parseInt(filters.playerCountMin) : null
        const maxFilter = filters.playerCountMax ? Number.parseInt(filters.playerCountMax) : null

        if (!minFilter && !maxFilter) return true

        const gameMinPlayers = game.min_players || 1
        const gameMaxPlayers = game.max_players || 99

        if (minFilter && maxFilter) {
          // Game range must overlap with filter range
          return gameMaxPlayers >= minFilter && gameMinPlayers <= maxFilter
        } else if (minFilter) {
          return gameMaxPlayers >= minFilter
        } else if (maxFilter) {
          return gameMinPlayers <= maxFilter
        }
        return true
      })()

      // Spieldauer Filter
      const matchesDuration = !filters.duration || game.duration === filters.duration

      const matchesAge = !filters.age || game.age === filters.age

      const matchesLanguage = !filters.language || game.language === filters.language

      const matchesCategory = !filters.category || game.category === filters.category

      const matchesType = !filters.type || game.type === filters.type

      return (
        matchesSearch &&
        matchesPlayerCount &&
        matchesDuration &&
        matchesAge &&
        matchesLanguage &&
        matchesCategory &&
        matchesType
      )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "title-asc":
          return a.title.localeCompare(b.title)
        case "title-desc":
          return b.title.localeCompare(a.title)
        case "publisher-asc":
          return (a.publisher || "").localeCompare(b.publisher || "")
        case "publisher-desc":
          return (b.publisher || "").localeCompare(a.publisher || "")
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
        return "Vermieten"
      case "trade":
        return "Tauschen"
      case "sell":
        return "Verkaufen"
      default:
        return type
    }
  }

  // Multi-select functions for Kategorie and Typus
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

  const handleOfferGame = (game: (typeof games)[0], type: string) => {
    if (!databaseConnected) {
      toast({ title: "Fehler", description: "Datenbank ist nicht verfügbar. Bitte führe zuerst die SQL-Skripte aus.", variant: "destructive" })
      return
    }

    setOfferGame(game)
    setOfferType(type)
    setIsOfferDialogOpen(true)
  }

  // Spiel anbieten Funktionen
  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!offerGame || !offerType || !user) {
      toast({ title: "Fehler", description: "Fehler beim Anbieten des Spiels!", variant: "destructive" })
      return
    }

    if (!databaseConnected) {
      toast({ title: "Fehler", description: "Datenbank ist nicht verfügbar. Bitte führe zuerst die SQL-Skripte aus.", variant: "destructive" })
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

      toast({ title: "Angebot erstellt", description: `${offerGame.title} wurde erfolgreich zum ${getAvailabilityText(offerType)} angeboten!` })

      // Reset form
      setOfferGame(null)
      setOfferType("")
      setPrice("")
      setDescription("")
      setIsOfferDialogOpen(false)
    } catch (error) {
      console.error("Error offering game:", error)
      toast({ title: "Fehler", description: "Fehler beim Anbieten des Spiels!", variant: "destructive" })
    }
  }

  const handleAddGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errors = {
      image: "",
      title: "",
      publisher: "",
      language: "",
      type: "",
      style: "",
      playerCount: "",
      duration: "",
      age: "",
    }

    if (!newGameTitle.trim()) {
      errors.title = "Bitte gib einen Spielnamen ein."
    }
    if (!newGamePublisher.trim() || newGamePublisher === "custom") {
      errors.publisher = "Verlag ist erforderlich"
    }
    if (!newGameLanguage || newGameLanguage === "custom") {
      errors.language = "Sprache ist erforderlich"
    }
    if (newGameType.length === 0) {
      errors.type = "Bitte wähle mindestens eine Kategorie."
    }
    if (newGameStyle.length === 0) {
      errors.style = "Bitte wähle mindestens einen Typus."
    }
    if (!newGamePlayerCount) {
      errors.playerCount = "Spieleranzahl ist erforderlich"
    }
    if (!newGameDuration) {
      errors.duration = "Spieldauer ist erforderlich"
    }
    if (!newGameAge) {
      errors.age = "Altersempfehlung ist erforderlich"
    }

    setFieldErrors(errors)

    // Check if any errors exist
    if (Object.values(errors).some((error) => error !== "")) {
      return
    }

    if (!user) {
      toast({ title: "Anmeldung erforderlich", description: "Du musst angemeldet sein, um Spiele hinzuzufügen.", variant: "destructive" })
      return
    }

    if (!databaseConnected) {
      toast({ title: "Fehler", description: "Datenbank ist nicht verfügbar. Bitte überprüfe deine Supabase-Konfiguration.", variant: "destructive" })
      return
    }

    try {
      let minPlayers = 1
      let maxPlayers = 1
      const playerMatch = newGamePlayerCount.match(/(\d+)\s*bis\s*(\d+)/)
      if (playerMatch) {
        minPlayers = Number.parseInt(playerMatch[1])
        maxPlayers = Number.parseInt(playerMatch[2])
      }

      let playTime = 30 // Default 30 minutes
      if (newGameDuration) {
        if (newGameDuration.includes("< 10")) playTime = 5
        else if (newGameDuration.includes("10-20")) playTime = 15
        else if (newGameDuration.includes("20-30")) playTime = 25
        else if (newGameDuration.includes("30-45")) playTime = 37
        else if (newGameDuration.includes("45-60")) playTime = 52
        else if (newGameDuration.includes("45-90")) playTime = 67
        else if (newGameDuration.includes("60-90")) playTime = 75
        else if (newGameDuration.includes("> 90")) playTime = 120
      }

      const gameData = {
        title: newGameTitle.trim(),
        publisher: newGamePublisher === "custom" ? newGameCustomPublisher.trim() : newGamePublisher.trim(),
        language: newGameLanguage === "custom" ? newGameCustomLanguage.trim() : newGameLanguage,
        available: ["lend", "trade", "sell"],
        image: newGameImage || "/images/ludoloop-game-placeholder.png",
        type: newGameType.length > 0 ? newGameType.join(", ") : "",
        style: newGameStyle.length > 0 ? newGameStyle.join(", ") : "",
        players: newGamePlayerCount,
        duration: newGameDuration,
        age: newGameAge,
        min_players: minPlayers,
        max_players: maxPlayers,
        play_time: playTime,
        condition: newGameCondition || "Gut", // Default condition
        description: "", // Can be filled later
        category: newGameType.length > 0 ? newGameType[0] : "Brettspiel", // Use first type as category
        age_rating: newGameAge,
      }

      await addGame(gameData)

      toast({ title: "Spiel hinzugefügt", description: `${gameData.title} wurde erfolgreich zu deiner Bibliothek hinzugefügt!` })

      // Reset form
      resetAddGameForm()
      setIsAddGameDialogOpen(false)
    } catch (error) {
      console.error("Error adding game:", error)
      const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler"
      toast({ title: "Fehler", description: `Fehler beim Hinzufügen des Spiels: ${errorMessage}`, variant: "destructive" })
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
      editGameLanguage === "custom"
    ) {
      toast({ title: "Pflichtfelder fehlen", description: "Bitte fülle alle Pflichtfelder aus!", variant: "destructive" })
      return
    }

    if (!databaseConnected) {
      toast({ title: "Fehler", description: "Datenbank ist nicht verfügbar.", variant: "destructive" })
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
        image: editGameImage || "/images/ludoloop-game-placeholder.png",
        // Only include type and style if they have values
        ...(editGameType.length > 0 && { type: editGameType.join(", ") }),
        ...(editGameStyle.length > 0 && { style: editGameStyle.join(", ") }),
      }

      await updateGame(editGame.id, updatedGameData)

      toast({ title: "Spiel aktualisiert", description: `${updatedGameData.title} wurde erfolgreich aktualisiert!` })

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
      toast({ title: "Fehler", description: "Fehler beim Aktualisieren des Spiels!", variant: "destructive" })
    }
  }

  // Spiel löschen Funktionen
  const handleDeleteGame = (game: (typeof games)[0]) => {
    setGameToDelete(game)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!gameToDelete || !databaseConnected) {
      toast({ title: "Fehler", description: "Fehler beim Löschen des Spiels!", variant: "destructive" })
      return
    }

    try {
      await deleteGame(gameToDelete.id)
      toast({ title: "Spiel gelöscht", description: `${gameToDelete.title} wurde erfolgreich aus deiner Bibliothek entfernt!` })

      // Clear selected game if it was the one being deleted
      if (selectedGame?.id === gameToDelete.id) {
        setSelectedGame(null)
      }

      setGameToDelete(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting game:", error)
      toast({ title: "Fehler", description: "Fehler beim Löschen des Spiels!", variant: "destructive" })
    }
  }

  // The loading state was causing the page to be stuck on the loading screen
  // Now the page will show even if loading is true, with disabled states for buttons

  const resetAddGameForm = () => {
    setNewGameTitle("")
    setNewGamePublisher("")
    setNewGameCustomPublisher("")
    setNewGameCondition("")
    setNewGamePlayerCount("")
    setNewGameDuration("")
    setNewGameAge("")
    setNewGameLanguage("")
    setNewGameCustomLanguage("")
    setNewGameStyle([])
    setNewGameCustomStyle("")
    setNewGameType([])
    setNewGameCustomType("")
    setNewGameImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = "" // Reset file input
    }
  }

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

  const validateForm = () => {
    const errors: any = {}

    if (!newGameTitle.trim()) {
      errors.title = "Spielname ist erforderlich"
    }

    if (!newGamePublisher.trim() || (newGamePublisher === "custom" && !newGameCustomPublisher.trim())) {
      errors.publisher = "Verlag ist erforderlich"
    }

    if (newGameType.length === 0) {
      errors.type = "Kategorie ist erforderlich"
    }

    if (newGameStyle.length === 0) {
      errors.style = "Typus ist erforderlich"
    }

    if (!newGamePlayerCount) {
      errors.playerCount = "Spieleranzahl ist erforderlich"
    }

    if (!newGameDuration) {
      errors.duration = "Spieldauer ist erforderlich"
    }

    if (!newGameAge) {
      errors.age = "Altersempfehlung ist erforderlich"
    }

    return errors
  }

  const handleGameSelect = (game: any) => {
    console.log("[v0] handleGameSelect called with game:", game)

    setNewGameTitle(game.name)

    if (game.image) {
      setNewGameImage(game.image)
    }

    if (game.publishers && game.publishers.length > 0) {
      const publisher = game.publishers[0]
      if (publisherOptions.includes(publisher)) {
        setNewGamePublisher(publisher)
      } else {
        setPublisherOptions((prev) => [...prev, publisher])
        setNewGamePublisher(publisher)
      }
    }

    if (game.minPlayers && game.maxPlayers) {
      const playerCount = `${game.minPlayers} bis ${game.maxPlayers} Personen`
      const matchingOption = playerCountOptions.find(
        (option) => option.includes(game.minPlayers.toString()) && option.includes(game.maxPlayers.toString()),
      )
      if (matchingOption) {
        setNewGamePlayerCount(matchingOption)
      } else {
        setPlayerCountOptions((prev) => [...prev, playerCount])
        setNewGamePlayerCount(playerCount)
      }
    }

    if (game.minPlayTime || game.maxPlayTime || game.playingTime) {
      const minTime = game.minPlayTime || game.playingTime
      const maxTime = game.maxPlayTime || game.playingTime
      let duration = ""

      if (minTime && maxTime && minTime !== maxTime) {
        duration = `${minTime} - ${maxTime} Min.`
      } else if (minTime || maxTime) {
        duration = `${minTime || maxTime} Min.`
      }

      if (duration) {
        const matchingOption = durationOptions.find(
          (option) => option.includes(minTime?.toString() || "") || option.includes(maxTime?.toString() || ""),
        )
        if (matchingOption) {
          setNewGameDuration(matchingOption)
        } else {
          setDurationOptions((prev) => [...prev, duration])
          setNewGameDuration(duration)
        }
      }
    }

    if (game.minAge) {
      const ageValue = `Ab ${game.minAge} Jahren`
      const matchingAge = AGE_OPTIONS.find((option) => option === ageValue)
      if (matchingAge) {
        setNewGameAge(matchingAge)
      } else {
        // Find closest higher age option
        const closestAge = AGE_OPTIONS.find((option) => {
          const optionAge = Number.parseInt(option.replace(/\D/g, ""))
          return optionAge >= game.minAge
        })
        if (closestAge) {
          setNewGameAge(closestAge)
        }
      }
    }

    if (game.categories && game.categories.length > 0) {
      const matchingCategories: string[] = []
      const newCategories: string[] = []

      game.categories.forEach((category: string) => {
        if (GAME_TYPE_OPTIONS.includes(category)) {
          matchingCategories.push(category)
        } else {
          newCategories.push(category)
        }
      })

      // Set matching categories
      if (matchingCategories.length > 0) {
        setNewGameType(matchingCategories)
      }

      // Add new categories to options and select them
      if (newCategories.length > 0) {
        const limitedNewCategories = newCategories.slice(0, 3) // Limit to 3 new categories
        setGameTypeOptions((prev) => [...new Set([...prev, ...limitedNewCategories])])
        setNewGameType((prev) => [...new Set([...prev, ...limitedNewCategories])])
      }
    }

    if (game.mechanics && game.mechanics.length > 0) {
      const matchingStyles: string[] = []
      const newStyles: string[] = []

      game.mechanics.forEach((mechanic: string) => {
        if (GAME_STYLE_OPTIONS.includes(mechanic)) {
          matchingStyles.push(mechanic)
        } else {
          newStyles.push(mechanic)
        }
      })

      // Set matching styles
      if (matchingStyles.length > 0) {
        setNewGameStyle(matchingStyles)
      }

      // Add new styles to options and select them
      if (newStyles.length > 0) {
        const limitedNewStyles = newStyles.slice(0, 3) // Limit to 3 new styles
        setGameStyleOptions((prev) => [...new Set([...prev, ...limitedNewStyles])])
        setNewGameStyle((prev) => [...new Set([...prev, ...limitedNewStyles])])
      }
    }

    // Close the search dialog
    setIsGameSearchDialogOpen(false)
  }

  const resetFilters = () => {
    setSearchTerm("")
    setSortBy("title-asc")
    setFilters({
      playerCountMin: "",
      playerCountMax: "",
      duration: "",
      age: "",
      language: "",
      category: "",
      type: "",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Header */}
      <Navigation currentPage="library" />

      <div className="container mx-auto px-4 py-8">
        {/* Database Error Banner */}
        {error && (
          <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-start space-x-4">
              <FaDatabase className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
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
          <h1 className="text-5xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten flex items-center justify-center gap-4">
            Mein Spieleregal
          </h1>
          <p className="text-gray-600 transform rotate-1 font-body text-base">Verwalte deine Spielesammlung</p>
        </div>

        {/* Add Game Dialog */}
        <Dialog open={isAddGameDialogOpen} onOpenChange={setIsAddGameDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-handwritten text-2xl text-center flex items-center justify-center gap-2 text-teal-700">
                <FaPlus className="w-6 h-6 text-teal-500" />
                Neues Spiel hinzufügen
              </DialogTitle>
              <p className="text-gray-500 text-center font-body text-xs">
                Füge ein neues Spiel zu deiner Spielesammlung hinzu
              </p>
            </DialogHeader>
            <form onSubmit={handleAddGameSubmit} className="space-y-6">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setInputMode("auto")}
                  className={`flex-1 py-2 px-4 rounded-md font-handwritten transition-all duration-200 text-sm ${
                    inputMode === "auto" ? "bg-green-400 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <MdOutlineManageSearch className="w-4 h-4 inline mr-2" />
                  Automatisch suchen
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("manual")}
                  className={`flex-1 py-2 px-4 rounded-md font-handwritten transition-all duration-200 text-sm ${
                    inputMode === "manual" ? "bg-blue-400 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <FaEdit className="w-4 h-4 inline mr-2" />
                  Manuell eingeben
                </button>
              </div>

              {inputMode === "auto" && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                  <h3 className="font-handwritten text-green-700 mb-3 flex items-center gap-2 text-sm">
                    <MdOutlineManageSearch className="w-5 h-5" />
                    Spiel automatisch suchen
                  </h3>
                  <p className="text-green-600 font-body mb-3 text-xs">
                    Suche dein Spiel in der Datenbank und lass die Details automatisch ausfüllen.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setIsGameSearchDialogOpen(true)}
                    className="bg-green-400 hover:bg-green-500 text-white font-handwritten"
                  >
                    <MdOutlineManageSearch className="w-4 h-4 mr-2" />
                    Spiel suchen
                  </Button>
                </div>
              )}

              {(inputMode === "manual" || newGameTitle) && (
                <>
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-xl border border-teal-200">
                    <h3 className="font-handwritten text-sm text-teal-700 mb-3 flex items-center gap-2">
                      <FaImage className="w-5 h-5" />
                      Spiel Cover
                    </h3>
                    <div className="text-center">
                      <div className="w-36 h-48 mx-auto mb-4 border-2 border-dashed border-teal-300 rounded-xl flex items-center justify-center bg-white/70 overflow-hidden hover:border-teal-400 transition-all duration-300 shadow-sm">
                        {newGameImage ? (
                          <img
                            src={newGameImage || "/placeholder.svg"}
                            alt="Spiel Cover"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-center">
                            <FaCamera className="w-10 h-10 text-teal-400 mx-auto mb-2" />
                            <p className="text-xs text-teal-600 font-body">Cover hochladen</p>
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
                        className="font-handwritten border-2 border-teal-400 text-teal-600 hover:bg-teal-400 hover:text-white transition-all duration-200"
                      >
                        <FaUpload className="w-4 h-4 mr-2" />
                        Bild hochladen
                      </Button>
                      {fieldErrors.image && <p className="text-red-500 text-xs mt-1 font-body">{fieldErrors.image}</p>}
                    </div>
                  </div>

                  {/* Grundinformationen Sektion */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                    <h3 className="font-handwritten text-sm text-blue-700 mb-4 flex items-center gap-2">
                      <FaInfoCircle className="w-5 h-5" />
                      Grundinformationen
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs text-gray-700 font-medium">Spielname *</Label>
                        <Input
                          value={newGameTitle}
                          onChange={(e) => setNewGameTitle(e.target.value)}
                          placeholder="z.B. Die Siedler von Catan"
                          className="font-body border-2 border-blue-200 focus:border-blue-400 bg-white/80 text-xs"
                          required
                        />
                        {fieldErrors.title && (
                          <p className="text-red-500 text-xs mt-1 font-body">{fieldErrors.title}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs text-gray-700 font-medium">Verlag *</Label>
                        <Select value={newGamePublisher} onValueChange={setNewGamePublisher} required>
                          <SelectTrigger className="font-body border-2 border-blue-200 bg-white/80 text-xs">
                            <SelectValue placeholder="Verlag wählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            {publisherOptions.map((publisher) => (
                              <SelectItem key={publisher} value={publisher} className="font-body text-xs">
                                {publisher}
                              </SelectItem>
                            ))}
                            {newGamePublisher &&
                              !publisherOptions.includes(newGamePublisher) &&
                              newGamePublisher !== "custom" && (
                                <SelectItem
                                  key={newGamePublisher}
                                  value={newGamePublisher}
                                  className="font-body font-bold text-xs"
                                >
                                  {newGamePublisher} (Benutzerdefiniert)
                                </SelectItem>
                              )}
                            <SelectItem value="custom" className="font-body font-bold text-blue-600 text-xs">
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
                              className="font-body border-2 border-blue-200 bg-white/80 text-xs"
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
                              className="bg-blue-400 hover:bg-blue-500 text-white"
                            >
                              <FaPlus className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        {fieldErrors.publisher && (
                          <p className="text-red-500 text-xs mt-1 font-body">{fieldErrors.publisher}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs text-gray-700 font-medium">Sprache *</Label>
                        <Select value={newGameLanguage} onValueChange={setNewGameLanguage} required>
                          <SelectTrigger className="font-body border-2 border-blue-200 bg-white/80 text-xs">
                            <SelectValue placeholder="Sprache wählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            {LANGUAGE_OPTIONS.map((language) => (
                              <SelectItem
                                key={language}
                                value={language === "Andere" ? "custom" : language}
                                className="font-body text-xs"
                              >
                                {language}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {newGameLanguage === "custom" && (
                          <div className="mt-2 flex gap-2">
                            <Input
                              value={newGameCustomLanguage}
                              onChange={(e) => setNewGameCustomLanguage(e.target.value)}
                              placeholder="Sprache eingeben..."
                              className="font-body border-2 border-blue-200 bg-white/80 text-xs"
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
                              className="bg-blue-400 hover:bg-blue-500 text-white"
                            >
                              <FaPlus className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        {fieldErrors.language && (
                          <p className="text-red-500 text-xs mt-1 font-body">{fieldErrors.language}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Spieldetails Sektion */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                    <h3 className="font-handwritten text-sm text-orange-700 mb-4 flex items-center gap-2">
                      <FaUsers className="w-5 h-5" />
                      Spieldetails
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label className="text-xs text-gray-700 font-medium">Spieleranzahl *</Label>
                        <Select value={newGamePlayerCount} onValueChange={setNewGamePlayerCount} required>
                          <SelectTrigger className="font-body border-2 border-orange-200 focus:border-orange-400 bg-white/80 text-xs">
                            <SelectValue placeholder="Spieleranzahl wählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            {playerCountOptions.map((count) => (
                              <SelectItem key={count} value={count} className="font-body text-xs">
                                {count}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldErrors.playerCount && (
                          <p className="text-red-500 text-xs mt-1 font-body">{fieldErrors.playerCount}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-gray-700 font-medium">Spieldauer *</Label>
                        <Select value={newGameDuration} onValueChange={setNewGameDuration} required>
                          <SelectTrigger className="font-body border-2 border-orange-200 focus:border-orange-400 bg-white/80 text-xs">
                            <SelectValue placeholder="Spieldauer wählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            {durationOptions.map((duration) => (
                              <SelectItem key={duration} value={duration} className="font-body text-xs">
                                {duration}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldErrors.duration && (
                          <p className="text-red-500 text-xs mt-1 font-body">{fieldErrors.duration}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-gray-700 font-medium">Altersempfehlung *</Label>
                        <Select value={newGameAge} onValueChange={setNewGameAge} required>
                          <SelectTrigger className="font-body border-2 border-orange-200 focus:border-orange-400 bg-white/80 text-xs">
                            <SelectValue placeholder="Altersempfehlung wählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            {AGE_OPTIONS.map((age) => (
                              <SelectItem key={age} value={age} className="font-body text-xs">
                                {age}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldErrors.age && <p className="text-red-500 text-xs mt-1 font-body">{fieldErrors.age}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Kategorien Sektion */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                    <h3 className="font-handwritten text-sm text-purple-700 mb-4 flex items-center gap-2">
                      <FaTag className="w-5 h-5" />
                      Kategorien & Typus
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs text-gray-700 font-medium">Kategorie * (Mehrfachauswahl)</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between font-body bg-white/80 border-2 border-purple-200 hover:border-purple-300 text-xs"
                              type="button"
                            >
                              {newGameType.length > 0 ? (
                                <span className="text-purple-600 font-medium text-xs">
                                  {newGameType.length} Kategorie{newGameType.length > 1 ? "n" : ""} ausgewählt
                                </span>
                              ) : (
                                "Kategorie wählen..."
                              )}
                              <FaChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-0">
                            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                              <h4 className="font-medium text-xs font-body text-purple-700">Kategorie auswählen:</h4>
                              {gameTypeOptions.map((type) => (
                                <div key={type} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`new-type-${type}`}
                                    checked={newGameType.includes(type)}
                                    onCheckedChange={() => handleNewGameTypeToggle(type)}
                                    className="border-purple-300 data-[state=checked]:bg-purple-400"
                                  />
                                  <Label htmlFor={`new-type-${type}`} className="text-xs font-body cursor-pointer">
                                    {type}
                                  </Label>
                                </div>
                              ))}
                              <div className="border-t pt-2 mt-2">
                                <h5 className="font-medium text-xs font-body text-gray-600 mb-2">
                                  Eigene Kategorie hinzufügen:
                                </h5>
                                <div className="flex gap-2">
                                  <Input
                                    value={newGameCustomType}
                                    onChange={(e) => setNewGameCustomType(e.target.value)}
                                    placeholder="Kategorie eingeben..."
                                    className="text-xs font-body border-purple-200"
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
                                    className="bg-purple-400 hover:bg-purple-500 text-white px-2"
                                  >
                                    <FaPlus className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              {newGameType.length > 0 && (
                                <div className="border-t pt-2 mt-2">
                                  <h5 className="font-medium text-xs font-body text-gray-600 mb-2">Ausgewählt:</h5>
                                  <div className="flex flex-wrap gap-1">
                                    {newGameType.map((type) => (
                                      <Badge
                                        key={type}
                                        className="text-xs cursor-pointer bg-purple-100 text-purple-700 hover:bg-purple-200"
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
                        {fieldErrors.type && <p className="text-red-500 text-xs mt-1 font-body">{fieldErrors.type}</p>}
                      </div>

                      <div>
                        <Label className="text-xs text-gray-700 font-medium">Typus * (Mehrfachauswahl)</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between font-body bg-white/80 border-2 border-purple-200 hover:border-purple-300 text-xs"
                              type="button"
                            >
                              {newGameStyle.length > 0 ? (
                                <span className="text-purple-600 font-medium text-xs">
                                  {newGameStyle.length} Typus {newGameStyle.length > 1 ? "en" : ""} ausgewählt
                                </span>
                              ) : (
                                "Typus wählen..."
                              )}
                              <FaChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-0">
                            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                              <h4 className="font-medium text-xs font-body text-purple-700">Typus auswählen:</h4>
                              {gameStyleOptions.map((style) => (
                                <div key={style} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`new-style-${style}`}
                                    checked={newGameStyle.includes(style)}
                                    onCheckedChange={() => handleNewGameStyleToggle(style)}
                                    className="border-purple-300 data-[state=checked]:bg-purple-400"
                                  />
                                  <Label htmlFor={`new-style-${style}`} className="text-xs font-body cursor-pointer">
                                    {style}
                                  </Label>
                                </div>
                              ))}
                              <div className="border-t pt-2 mt-2">
                                <h5 className="font-medium text-xs font-body text-gray-600 mb-2">
                                  Eigene Typus hinzufügen:
                                </h5>
                                <div className="flex gap-2">
                                  <Input
                                    value={newGameCustomStyle}
                                    onChange={(e) => setNewGameCustomStyle(e.target.value)}
                                    placeholder="Typus eingeben..."
                                    className="text-xs font-body border-purple-200"
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
                                    className="bg-purple-400 hover:bg-purple-500 text-white px-2"
                                  >
                                    <FaPlus className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              {newGameStyle.length > 0 && (
                                <div className="border-t pt-2 mt-2">
                                  <h5 className="font-medium text-xs font-body text-gray-600 mb-2">Ausgewählt:</h5>
                                  <div className="flex flex-wrap gap-1">
                                    {newGameStyle.map((style) => (
                                      <Badge
                                        key={style}
                                        className="text-xs cursor-pointer bg-purple-100 text-purple-700 hover:bg-purple-200"
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
                        {fieldErrors.style && (
                          <p className="text-red-500 text-xs mt-1 font-body">{fieldErrors.style}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddGameDialogOpen(false)}
                  className="flex-1 font-handwritten border-2 border-gray-300 hover:bg-gray-100 transition-all duration-200"
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-teal-400 hover:bg-teal-500 text-white font-handwritten transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <FaPlus className="w-4 h-4 mr-2" />
                  Hinzufügen
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Search, Sort and Filter */}
        <div className="space-y-4 mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 relative">
                <MdOutlineManageSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Spiele durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-xs h-9 pl-9 bg-white/80"
                  disabled={!databaseConnected}
                />
              </div>
              <Button
                onClick={() => setIsAddGameDialogOpen(true)}
                className="bg-teal-500 hover:bg-teal-600 text-white whitespace-nowrap h-9 text-xs px-4"
                disabled={!databaseConnected}
              >
                <FaPlus className="w-3 h-3 mr-2" />
                <span className="hidden sm:inline">Spiel hinzufügen</span>
                <span className="sm:hidden">Hinzufügen</span>
              </Button>
            </div>

            {/* Hauptfilter */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6 sm:gap-3 items-end">
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block font-medium">Sortieren nach</Label>
                <Select value={sortBy} onValueChange={setSortBy} disabled={!databaseConnected}>
                  <SelectTrigger className="h-9 text-xs border-gray-200 bg-white/80 focus:border-teal-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title-asc" className="text-xs">
                      Spielname A-Z
                    </SelectItem>
                    <SelectItem value="title-desc" className="text-xs">
                      Spielname Z-A
                    </SelectItem>
                    <SelectItem value="publisher-asc" className="text-xs">
                      Verlag A-Z
                    </SelectItem>
                    <SelectItem value="publisher-desc" className="text-xs">
                      Verlag Z-A
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Spieleranzahl Filter */}
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block font-medium">Spieler (ab)</Label>
                <Select
                  value={filters.playerCountMin}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, playerCountMin: value === "all" ? "" : value }))
                  }
                  disabled={!databaseConnected}
                >
                  <SelectTrigger className="h-9 text-xs border-gray-200 bg-white/80 focus:border-teal-400">
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {PLAYER_COUNT_MIN_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-xs">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block font-medium">Spieler (bis)</Label>
                <Select
                  value={filters.playerCountMax}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, playerCountMax: value === "all" ? "" : value }))
                  }
                  disabled={!databaseConnected}
                >
                  <SelectTrigger className="h-9 text-xs border-gray-200 bg-white/80 focus:border-teal-400">
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {PLAYER_COUNT_MAX_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-xs">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Kategorie Filter */}
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block font-medium">Kategorie</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, category: value === "all" ? "" : value }))}
                  disabled={!databaseConnected}
                >
                  <SelectTrigger className="h-9 text-xs border-gray-200 bg-white/80 focus:border-teal-400">
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option} className="text-xs">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="h-9 flex-1 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 text-xs whitespace-nowrap"
                >
                  <FiFilter className="w-3 h-3 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Mehr Filter</span>
                  <span className="sm:hidden">Filter</span>
                  <FaChevronDown
                    className={`w-3 h-3 ml-1 sm:ml-2 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`}
                  />
                </Button>
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="h-9 flex-1 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 text-xs whitespace-nowrap bg-transparent"
                >
                  <span className="hidden sm:inline">Filter zurücksetzen</span>
                  <span className="sm:hidden">Reset</span>
                </Button>
              </div>
            </div>

            {showAdvancedFilters && (
              <div className="pt-4 mt-4 border-t border-gray-100 space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 flex items-center">
                  <FiFilter className="w-3 h-3 mr-2" />
                  Mehr Filter
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Spieldauer Filter */}
                  <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block font-medium">Spieldauer</Label>
                    <Select
                      value={filters.duration}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, duration: value === "all" ? "" : value }))
                      }
                      disabled={!databaseConnected}
                    >
                      <SelectTrigger className="h-9 text-xs border-gray-200 bg-white/80 focus:border-teal-400">
                        <SelectValue placeholder="Alle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle</SelectItem>
                        {durationOptions.map((option) => (
                          <SelectItem key={option} value={option} className="text-xs">
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Altersempfehlung Filter */}
                  <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block font-medium">Altersempfehlung</Label>
                    <Select
                      value={filters.age}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, age: value === "all" ? "" : value }))}
                      disabled={!databaseConnected}
                    >
                      <SelectTrigger className="h-9 text-xs border-gray-200 bg-white/80 focus:border-teal-400">
                        <SelectValue placeholder="Alle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle</SelectItem>
                        {AGE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option} className="text-xs">
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sprache Filter */}
                  <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block font-medium">Sprache</Label>
                    <Select
                      value={filters.language}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, language: value === "all" ? "" : value }))
                      }
                      disabled={!databaseConnected}
                    >
                      <SelectTrigger className="h-9 text-xs border-gray-200 bg-white/80 focus:border-teal-400">
                        <SelectValue placeholder="Alle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle</SelectItem>
                        {LANGUAGE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option} className="text-xs">
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Library Shelf */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-b from-amber-100 to-amber-200 rounded-lg p-3 md:p-6 shadow-lg border-4 border-amber-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2 ml-0">
                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                  <Button
                    onClick={() => {
                      setIsSelectionMode(!isSelectionMode)
                      setSelectedGames(new Set())
                    }}
                    variant={isSelectionMode ? "outline" : "outline"}
                    className="border-amber-400 text-white-600 hover:bg-white font-handwritten bg-transparent text-xs"
                  >
                    {isSelectionMode ? "Auswahl beenden" : "Spiele auswählen"}
                  </Button>

                  {isSelectionMode && (
                    <>
                      <Button
                        onClick={selectAllGames}
                        variant="outline"
                        className="font-handwritten bg-orange/80 hover:bg-white border-amber-400 text-xs"
                      >
                        <span className="hidden sm:inline">
                          {selectedGames.size === filteredGames.length ? "Alle abwählen" : "Alle auswählen"}
                        </span>
                        <span className="sm:hidden">
                          {selectedGames.size === filteredGames.length ? "Abwählen" : "Auswählen"}
                        </span>
                      </Button>

                      {selectedGames.size > 0 && (
                        <Button
                          onClick={handleBulkDelete}
                          className="bg-red-400 hover:bg-white-500 text-white font-handwritten text-xs"
                        >
                          <FaTrash className="w-4 h-4 mr-2" />
                          {selectedGames.size} Spiel(e) löschen
                        </Button>
                      )}
                    </>
                  )}
                </div>

                {isSelectionMode && (
                  <span className="text-xs text-amber-700 font-body bg-white/60 px-2 py-1 rounded">
                    {selectedGames.size} von {filteredGames.length} ausgewählt
                  </span>
                )}
              </div>

              {/* Library Background Illustration */}
              {/* Shelf Rows */}
              <div className="space-y-8">
                {databaseConnected ? (
                  <>
                    {/* Add Game Cover and First Row */}
                    {filteredGames.length > 0 && (
                      <div className="relative">
                        {/* Shelf Board */}
                        <div className="absolute bottom-3 left-0 right-0 bg-gradient-to-b from-amber-600 to-amber-700 rounded-lg shadow-md px-2 h-2.5 py-1.5"></div>

                        {/* First row with Add Game Cover and up to 8 games */}
                        <div className="flex gap-1 md:gap-2 overflow-x-auto pt-3 pl-1.5 pb-6 pr-1.5">
                          {/* Add Game Cover - always first */}
                          <div
                            className="flex-shrink-0 cursor-pointer transform hover:scale-105 hover:-translate-y-2 transition-all duration-300"
                            onClick={() => setIsAddGameDialogOpen(true)}
                          >
                            <div className="w-20 h-28 md:w-24 md:h-32 bg-gradient-to-br from-teal-100 to-teal-200 rounded-t-lg shadow-lg border-2 border-dashed border-teal-400 overflow-hidden relative flex items-center justify-center">
                              <div className="text-center">
                                <FaPlus className="w-6 md:w-8 md:h-8 text-teal-600 mx-auto mb-1" />
                                <p className="text-xs text-teal-700 font-bold font-handwritten px-1">
                                  <span className="hidden sm:inline text-xs font-normal">Spiel hinzufügen</span>
                                  <span className="sm:hidden">Hinzufügen</span>
                                </p>
                              </div>
                            </div>
                            <div className="w-20 h-2 md:w-24 md:h-2 bg-gradient-to-b from-gray-300 to-gray-400 rounded-b-sm"></div>
                          </div>

                          {/* First 8 games in the same row */}
                          {filteredGames.slice(0, 8).map((game) => (
                            <div
                              key={game.id}
                              className="flex-shrink-0 cursor-pointer transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 relative"
                              onClick={() => (isSelectionMode ? toggleGameSelection(game.id) : setSelectedGame(game))}
                            >
                              {isSelectionMode && (
                                <div className="absolute top-1 right-1 z-10">
                                  <div
                                    className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center ${
                                      selectedGames.has(game.id)
                                        ? "bg-teal-500 border-teal-500"
                                        : "bg-white border-gray-300"
                                    }`}
                                  >
                                    {selectedGames.has(game.id) && (
                                      <FaCheck className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Fix availability dot logic - use tracking_info.status instead of available array */}
                              {!isSelectionMode && (
                                <div className="absolute top-1 left-1 z-10">
                                  <div
                                    className={`w-3 h-3 md:w-4 md:h-4 rounded-full border border-white shadow-sm ${
                                      !game.tracking_info?.status || game.tracking_info.status === "available"
                                        ? "bg-green-500"
                                        : "bg-red-500"
                                    }`}
                                    title={
                                      !game.tracking_info?.status || game.tracking_info.status === "available"
                                        ? "Verfügbar"
                                        : game.tracking_info.status === "rented"
                                          ? "Vermietet / Verliehen"
                                          : "Getauscht"
                                    }
                                  />
                                </div>
                              )}

                              <div
                                className={`w-20 h-28 md:w-24 md:h-32 bg-white rounded-t-lg shadow-lg border-2 overflow-hidden relative ${
                                  selectedGames.has(game.id) ? "border-teal-500" : "border-gray-300"
                                }`}
                              >
                                <img
                                  src={game.image || "/images/ludoloop-game-placeholder.png"}
                                  alt={game.title}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-1">
                                  <p className="text-white text-xs text-center leading-tight font-handwritten font-normal">
                                    {game.title}
                                  </p>
                                </div>
                              </div>
                              <div className="w-20 h-2 md:w-24 md:h-2 bg-gradient-to-b from-gray-300 to-gray-400 rounded-b-sm"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Remaining games in subsequent rows */}
                    {filteredGames.length > 8 &&
                      Array.from({ length: Math.ceil((filteredGames.length - 8) / 9) }, (_, shelfIndex) => (
                        <div key={shelfIndex + 1} className="relative">
                          {/* Shelf Board */}
                          <div className="absolute bottom-3 left-0 right-0 bg-gradient-to-b from-amber-600 to-amber-700 rounded-lg shadow-md mx-2 px-1.5 h-2.5 my-1.5"></div>

                          {/* Games on Shelf - 9 per row */}
                          <div className="flex overflow-x-auto pl-1.5 pt-2.5 pb-7 gap-[3px]">
                            {filteredGames.slice(8 + shelfIndex * 9, 8 + shelfIndex * 9 + 9).map((game) => (
                              <div
                                key={game.id}
                                className="flex-shrink-0 cursor-pointer transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 mx-0.5 px-0 relative"
                                onClick={() => (isSelectionMode ? toggleGameSelection(game.id) : setSelectedGame(game))}
                              >
                                {isSelectionMode && (
                                  <div className="absolute top-1 right-1 z-10">
                                    <div
                                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                        selectedGames.has(game.id)
                                          ? "bg-teal-500 border-teal-500"
                                          : "bg-white border-gray-300"
                                      }`}
                                    >
                                      {selectedGames.has(game.id) && <FaCheck className="w-4 h-4 text-white" />}
                                    </div>
                                  </div>
                                )}

                                {!isSelectionMode && (
                                  <div className="absolute top-1 left-1 z-10">
                                    <div
                                      className={`w-3 h-3 md:w-4 md:h-4 rounded-full border border-white shadow-sm ${
                                        !game.tracking_info?.status || game.tracking_info.status === "available"
                                          ? "bg-green-500"
                                          : "bg-red-500"
                                      }`}
                                      title={
                                        !game.tracking_info?.status || game.tracking_info.status === "available"
                                          ? "Verfügbar"
                                          : game.tracking_info.status === "rented"
                                            ? "Vermietet / Verliehen"
                                            : "Getauscht"
                                      }
                                    />
                                  </div>
                                )}

                                <div
                                  className={`w-24 h-32 bg-white rounded-t-lg shadow-lg border-2 overflow-hidden relative ${
                                    selectedGames.has(game.id) ? "border-teal-500" : "border-gray-300"
                                  }`}
                                >
                                  <img
                                    src={game.image || "/images/ludoloop-game-placeholder.png"}
                                    alt={game.title}
                                    className="w-full h-full object-cover mx-0 px-0"
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
                        <div className="absolute bottom-3 left-0 right-0 h-4 bg-gradient-to-b from-amber-600 to-amber-700 rounded-lg shadow-md"></div>
                        <div className="flex gap-2 pb-7 pt-2.5">
                          <div
                            className="flex-shrink-0 cursor-pointer transform hover:scale-105 hover:-translate-y-2 transition-all duration-300"
                            onClick={() => setIsAddGameDialogOpen(true)}
                          >
                            <div className="w-24 h-32 bg-gradient-to-br from-teal-100 to-teal-200 rounded-t-lg shadow-lg border-2 border-dashed border-teal-400 overflow-hidden relative flex items-center justify-center">
                              <div className="text-center">
                                <FaPlus className="w-8 h-8 text-teal-600 mx-auto mb-1" />
                                <p className="text-xs text-teal-700 font-handwritten font-normal">Spiel hinzufügen</p>
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
                    <FaDatabase className="w-16 h-16 text-amber-600 mx-auto mb-4" />
                    <p className="text-amber-700 text-lg font-handwritten">Datenbank nicht verfügbar</p>
                    <p className="text-amber-600 text-xs font-body mt-2">
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
              <Card className="sticky top-4 lg:top-8 transform rotate-0 lg:rotate-1 hover:rotate-0 transition-all border-2 border-teal-200">
                <CardContent className="p-4 md:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-600">
                        {localToggleState[selectedGame.id] ? "Verfügbar" : "Nicht verfügbar"}
                      </span>
                      <button
                        onClick={async () => {
                          if (isToggling) return

                          try {
                            setIsToggling(true)
                            const isCurrentlyAvailable = localToggleState[selectedGame.id]
                            const newState = !isCurrentlyAvailable

                            console.log(
                              "[v0] Toggle clicked - current state:",
                              isCurrentlyAvailable,
                              "will set to:",
                              newState,
                            )

                            setLocalToggleState((prev) => ({
                              ...prev,
                              [selectedGame.id]: newState,
                            }))

                            await toggleGameAvailability(selectedGame.id, newState)

                            console.log("[v0] Toggle completed successfully")
                          } catch (error) {
                            console.error("Error toggling availability:", error)
                            const newState = !localToggleState[selectedGame.id]
                            setLocalToggleState((prev) => ({
                              ...prev,
                              [selectedGame.id]: !newState,
                            }))
                          } finally {
                            setIsToggling(false)
                          }
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${
                          localToggleState[selectedGame.id] ? "bg-green-500" : "bg-red-500"
                        } ${isToggling ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={!databaseConnected || isToggling}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            localToggleState[selectedGame.id] ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="text-center mb-4">
                    <div className="relative w-24 h-32 md:w-32 md:h-40 mx-auto rounded-lg shadow-lg mb-4 overflow-hidden">
                      <img
                        src={selectedGame.image || "/images/ludoloop-game-placeholder.png"}
                        alt={selectedGame.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Game Title Overlay for Detail View */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-2">
                        <p className="text-white text-xs font-bold text-center leading-tight font-handwritten">
                          {selectedGame.title}
                        </p>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-gray-800 mb-2 font-handwritten md:text-xs">
                      {selectedGame.title}
                    </h3>
                    <p className="text-xs text-gray-600 font-body md:text-xs">{selectedGame.publisher}</p>
                  </div>

                  {/* CHANGE: Moved status display to after title and publisher */}
                  {selectedGame.tracking_info && selectedGame.tracking_info.status !== "available" && (
                    <div className="mb-4 rounded-lg overflow-hidden border border-amber-200">
                      <div
                        className={cn(
                          "px-3 py-1.5 text-xs font-semibold text-orange-800",
                          selectedGame.tracking_info.status === "rented"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-orange-100 text-orange-800",
                        )}
                      >
                        {selectedGame.tracking_info.status === "rented" ? "Vermietet / Verliehen" : "Getauscht"}
                      </div>
                      <div className="bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        {selectedGame.tracking_info.status === "rented" && (
                          <div className="space-y-1">
                            <p>
                              <span className="font-medium">an:</span>{" "}
                              <span className="font-semibold text-orange-800 text-xs">
                                {selectedGame.tracking_info.rented_to || "Unbekannt"}
                              </span>
                            </p>
                            {selectedGame.tracking_info.rented_until && (
                              <p>
                                <span className="font-medium">Bis:</span>{" "}
                                <span className="text-orange-800 font-semibold">
                                  {format(new Date(selectedGame.tracking_info.rented_until), "PPP", { locale: de })}
                                </span>
                              </p>
                            )}
                          </div>
                        )}
                        {selectedGame.tracking_info.status === "swapped" && (
                          <p>
                            <span className="font-medium">mit:</span>{" "}
                            <span className="font-semibold text-orange-800">
                              {selectedGame.tracking_info.swapped_with || "Unbekannt"}
                            </span>
                          </p>
                        )}
                        {selectedGame.tracking_info.notes && (
                          <p className="italic mt-2 pt-2 border-t border-amber-200 text-[11px] text-amber-700">
                            Notiz: "{selectedGame.tracking_info.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-3 pb-6 space-y-2.5">
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="font-body text-xs font-semibold">Spieleranzahl:</span>
                      <span className="font-body text-xs">{selectedGame.players}</span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="font-body text-xs font-bold">Spieldauer:</span>
                      <span className="font-body text-xs">{selectedGame.duration}</span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="flex justify-between text-xs md:text-xs font-bold">Altersempfehlung:</span>
                      <span className="font-body text-xs">{selectedGame.age || "Keine Angabe"}</span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="font-body text-xs font-bold">Sprache:</span>
                      <span className="font-body text-xs">{selectedGame.language}</span>
                    </div>
                    {selectedGame.type && (
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="font-body text-xs font-bold">Kategorie:</span>
                        <span className="font-body text-xs">{selectedGame.type}</span>
                      </div>
                    )}
                    {selectedGame.style && (
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="font-body text-xs font-bold">Typus:</span>
                        <span className="font-body text-xs">{selectedGame.style}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditGame(selectedGame)}
                        className="flex-1 h-8 text-xs bg-blue-400 hover:bg-blue-500 text-white font-handwritten"
                        disabled={!databaseConnected}
                      >
                        <FaEdit className="w-3 h-3 mr-1" />
                        Bearbeiten
                      </Button>
                      <Button
                        onClick={() => setIsTrackingDialogOpen(true)}
                        className="flex-1 h-8 text-xs bg-purple-400 hover:bg-purple-500 text-white font-handwritten"
                        disabled={!databaseConnected}
                      >
                        <FaTags className="w-3 h-3 mr-1" />
                        Status
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleOfferGame(selectedGame, "lend")}
                        className="flex-1 h-8 text-xs bg-teal-400 hover:bg-teal-500 text-white font-handwritten"
                        disabled={!databaseConnected}
                      >
                        <TbExchange className="w-3 h-3 mr-1" />
                        Vermieten
                      </Button>
                      <Button
                        onClick={() => handleOfferGame(selectedGame, "trade")}
                        className="flex-1 h-8 text-xs bg-orange-400 hover:bg-orange-500 text-white font-handwritten"
                        disabled={!databaseConnected}
                      >
                        <GiBackForth className="w-3 h-3 mr-1" />
                        Tauschen
                      </Button>
                      <Button
                        onClick={() => handleOfferGame(selectedGame, "sell")}
                        className="flex-1 h-8 text-xs bg-pink-400 hover:bg-pink-500 text-white font-handwritten"
                        disabled={!databaseConnected}
                      >
                        <GiReceiveMoney className="w-3 h-3 mr-1" />
                        Verkaufen
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    className="w-full font-handwritten h-8 text-xs"
                    onClick={() => setSelectedGame(null)}
                  >
                    <FaEyeSlash className="w-3 h-3 mr-2" />
                    Ansicht schliessen
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="sticky top-8 transform rotate-1 hover:rotate-0 transition-all border-2 border-gray-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <GrSelect className="w-10 h-10 text-gray-500 mx-auto mb-4" />
                    <h3 className="mb-2 font-handwritten text-sm text-black font-medium">Spiel auswählen</h3>
                    <p className="text-gray-500 font-body text-xs">
                      Wähle ein Spiel aus deinem Spieleregal, um Details anzuzeigen
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Offer Game Dialog */}
      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <CreateMarketplaceOfferForm
            isOpen={isOfferDialogOpen}
            onClose={() => setIsOfferDialogOpen(false)}
            preselectedGame={offerGame || undefined}
            preselectedOfferType={offerType}
            initialStep={offerGame ? 2 : 1}
            onSuccess={() => {
              setIsOfferDialogOpen(false)
              toast({
                title: "Angebot erstellt",
                description: "Dein Angebot wurde erfolgreich im Marktplatz erstellt.",
              })
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Game Dialog */}
      <Dialog open={isEditGameDialogOpen} onOpenChange={setIsEditGameDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-handwritten text-2xl text-center flex items-center justify-center gap-2 text-blue-700">
              <FaEdit className="w-6 h-6 text-blue-500" />
              Spiel bearbeiten
            </DialogTitle>
            <p className="text-gray-500 text-center font-body text-xs">Bearbeite die Details deines Spiels</p>
          </DialogHeader>
          {editGame && (
            <form onSubmit={handleEditGameSubmit} className="space-y-6">
              {/* Bild Upload Sektion */}
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-xl border border-teal-200">
                <h3 className="font-handwritten text-teal-700 mb-3 flex items-center gap-2 text-sm">
                  <FaImage className="w-5 h-5" />
                  Spiel Cover
                </h3>
                <div className="text-center">
                  <div className="w-36 h-48 mx-auto mb-4 border-2 border-dashed border-teal-300 rounded-xl flex items-center justify-center bg-white/70 overflow-hidden hover:border-teal-400 transition-all duration-300 shadow-sm">
                    {editGameImage ? (
                      <img
                        src={editGameImage || "/placeholder.svg"}
                        alt="Spiel Cover"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <FaCamera className="w-10 h-10 text-teal-400 mx-auto mb-2" />
                        <p className="text-xs text-teal-600 font-body">Cover hochladen</p>
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
                    className="font-handwritten border-2 border-teal-400 text-teal-600 hover:bg-teal-400 hover:text-white transition-all duration-200"
                  >
                    <FaUpload className="w-4 h-4 mr-2" />
                    Bild hochladen
                  </Button>
                </div>
              </div>

              {/* Grundinformationen Sektion */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <h3 className="font-handwritten text-sm text-blue-700 mb-4 flex items-center gap-2">
                  <FaBook className="w-5 h-5" />
                  Grundinformationen
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-700 font-medium">Spielname *</Label>
                    <Input
                      value={editGameTitle}
                      onChange={(e) => setEditGameTitle(e.target.value)}
                      placeholder="z.B. CATAN"
                      className="font-body border-2 border-blue-200 focus:border-blue-400 bg-white/80 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-gray-700 font-medium">Verlag *</Label>
                    <Select value={editGamePublisher} onValueChange={setEditGamePublisher} required>
                      <SelectTrigger className="font-body border-2 border-blue-200 bg-white/80 text-xs">
                        <SelectValue placeholder="Verlag wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {publisherOptions.map((publisher) => (
                          <SelectItem key={publisher} value={publisher} className="font-body text-xs">
                            {publisher}
                          </SelectItem>
                        ))}
                        {editGamePublisher &&
                          !publisherOptions.includes(editGamePublisher) &&
                          editGamePublisher !== "custom" && (
                            <SelectItem
                              key={editGamePublisher}
                              value={editGamePublisher}
                              className="font-body font-bold text-xs"
                            >
                              {editGamePublisher} (Benutzerdefiniert)
                            </SelectItem>
                          )}
                        <SelectItem value="custom" className="font-body font-bold text-blue-600 text-xs">
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
                          className="font-body border-2 border-blue-200 bg-white/80 text-xs"
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
                          className="bg-blue-400 hover:bg-blue-500 text-white"
                        >
                          <FaPlus className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs text-gray-700 font-medium">Sprache *</Label>
                    <Select value={editGameLanguage} onValueChange={setEditGameLanguage} required>
                      <SelectTrigger className="font-body border-2 border-blue-200 bg-white/80 text-xs">
                        <SelectValue placeholder="Sprache wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Deutsch" className="font-body text-xs">
                          Deutsch
                        </SelectItem>
                        <SelectItem value="Englisch" className="font-body text-xs">
                          Englisch
                        </SelectItem>
                        <SelectItem value="Französisch" className="font-body text-xs">
                          Französisch
                        </SelectItem>
                        <SelectItem value="Italienisch" className="font-body text-xs">
                          Italienisch
                        </SelectItem>
                        <SelectItem value="Spanisch" className="font-body text-xs">
                          Spanisch
                        </SelectItem>
                        <SelectItem value="Mehrsprachig" className="font-body text-xs">
                          Mehrsprachig
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Kategorien Sektion */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <h3 className="font-handwritten text-sm text-purple-700 mb-4 flex items-center gap-2">
                  <FaTag className="w-5 h-5" />
                  Kategorien & Typus
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-700 font-medium">Kategorie * (Mehrfachauswahl)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between font-body bg-white/80 border-2 border-purple-200 hover:border-purple-300 text-xs"
                          type="button"
                        >
                          {editGameType.length > 0 ? (
                            <span className="text-purple-600 font-medium text-xs">
                              {editGameType.length} Kategorie{editGameType.length > 1 ? "n" : ""} ausgewählt
                            </span>
                          ) : (
                            "Kategorie wählen..."
                          )}
                          <FaChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-0">
                        <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                          <h4 className="font-medium text-xs font-body text-purple-700">Kategorie auswählen:</h4>
                          {GAME_TYPE_OPTIONS.map((type) => (
                            <div key={type} className="flex items-center space-x-2">
                              <Checkbox
                                id={`type-${type}`}
                                checked={editGameType.includes(type)}
                                onCheckedChange={() => handleEditGameTypeToggle(type)}
                                className="border-purple-300 data-[state=checked]:bg-purple-400"
                              />
                              <Label htmlFor={`type-${type}`} className="text-xs font-body cursor-pointer">
                                {type}
                              </Label>
                            </div>
                          ))}
                          <div className="border-t pt-2 mt-2">
                            <h5 className="font-medium text-xs font-body text-gray-600 mb-2">
                              Eigene Kategorie hinzufügen:
                            </h5>
                            <div className="flex gap-2">
                              <Input
                                value={editGameCustomType}
                                onChange={(e) => setEditGameCustomType(e.target.value)}
                                placeholder="Kategorie eingeben..."
                                className="text-xs font-body border-purple-200"
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
                                className="bg-purple-400 hover:bg-purple-500 text-white px-2"
                              >
                                <FaPlus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          {editGameType.length > 0 && (
                            <div className="border-t pt-2 mt-2">
                              <h5 className="font-medium text-xs font-body text-gray-600 mb-2">Ausgewählt:</h5>
                              <div className="flex flex-wrap gap-1">
                                {editGameType.map((type) => (
                                  <Badge
                                    key={type}
                                    className="text-xs cursor-pointer bg-purple-100 text-purple-700 hover:bg-purple-200"
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
                    <Label className="text-xs text-gray-700 font-medium">Typus * (Mehrfachauswahl)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between font-body bg-white/80 border-2 border-purple-200 hover:border-purple-300 text-xs"
                          type="button"
                        >
                          {editGameStyle.length > 0 ? (
                            <span className="text-purple-600 font-medium text-xs">
                              {editGameStyle.length} Typus {editGameStyle.length > 1 ? "en" : ""} ausgewählt
                            </span>
                          ) : (
                            "Typus wählen..."
                          )}
                          <FaChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-0">
                        <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                          <h4 className="font-medium text-xs font-body text-purple-700">Typus auswählen:</h4>
                          {GAME_STYLE_OPTIONS.map((style) => (
                            <div key={style} className="flex items-center space-x-2">
                              <Checkbox
                                id={`style-${style}`}
                                checked={editGameStyle.includes(style)}
                                onCheckedChange={() => handleEditGameStyleToggle(style)}
                                className="border-purple-300 data-[state=checked]:bg-purple-400"
                              />
                              <Label htmlFor={`style-${style}`} className="text-xs font-body cursor-pointer">
                                {style}
                              </Label>
                            </div>
                          ))}
                          <div className="border-t pt-2 mt-2">
                            <h5 className="font-medium text-xs font-body text-gray-600 mb-2">
                              Eigene Typus hinzufügen:
                            </h5>
                            <div className="flex gap-2">
                              <Input
                                value={editGameCustomStyle}
                                onChange={(e) => setEditGameCustomStyle(e.target.value)}
                                placeholder="Typus eingeben..."
                                className="text-xs font-body border-purple-200"
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
                                className="bg-purple-400 hover:bg-purple-500 text-white px-2"
                              >
                                <FaPlus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          {editGameStyle.length > 0 && (
                            <div className="border-t pt-2 mt-2">
                              <h5 className="font-medium text-xs font-body text-gray-600 mb-2">Ausgewählt:</h5>
                              <div className="flex flex-wrap gap-1">
                                {editGameStyle.map((style) => (
                                  <Badge
                                    key={style}
                                    className="text-xs cursor-pointer bg-purple-100 text-purple-700 hover:bg-purple-200"
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
                </div>
              </div>

              {/* Spieldetails Sektion */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                <h3 className="font-handwritten text-sm text-orange-700 mb-4 flex items-center gap-2">
                  <FaDice className="w-5 h-5" />
                  Spieldetails
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-xs text-gray-700 font-medium">Spieleranzahl *</Label>
                    <Select value={editGamePlayerCount} onValueChange={setEditGamePlayerCount} required>
                      <SelectTrigger className="font-body border-2 border-orange-200 focus:border-orange-400 bg-white/80 text-xs">
                        <SelectValue placeholder="Spieleranzahl wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {playerCountOptions.map((count) => (
                          <SelectItem key={count} value={count} className="font-body text-xs">
                            {count}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-700 font-medium">Spieldauer *</Label>
                    <Select value={editGameDuration} onValueChange={setEditGameDuration} required>
                      <SelectTrigger className="font-body border-2 border-orange-200 focus:border-orange-400 bg-white/80 text-xs">
                        <SelectValue placeholder="Spieldauer wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {durationOptionsInit.map((duration) => (
                          <SelectItem key={duration} value={duration} className="font-body text-xs">
                            {duration}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-700 font-medium">Altersempfehlung *</Label>
                    <Select value={editGameAge} onValueChange={setEditGameAge} required>
                      <SelectTrigger className="font-body border-2 border-orange-200 focus:border-orange-400 bg-white/80 text-xs">
                        <SelectValue placeholder="Altersempfehlung wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {AGE_OPTIONS.map((age) => (
                          <SelectItem key={age} value={age} className="font-body text-xs">
                            {age}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEditGameDialogOpen(false)}
                  className="flex-1 font-handwritten border-2 border-gray-300 hover:bg-gray-100 transition-all duration-200"
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-400 hover:bg-blue-500 text-white font-handwritten transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <FaEdit className="w-4 h-4 mr-2" />
                  Speichern
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-handwritten text-2xl text-center">Spiel löschen?</DialogTitle>
            <DialogDescription className="text-center font-body">
              Bist du sicher, dass du diese <span className="font-bold">{gameToDelete?.title}</span> aus deiner
              Bibliothek entfernen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="font-handwritten"
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              className="bg-red-400 hover:bg-red-500 text-white font-handwritten"
            >
              Löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <GameSearchDialog
        open={isGameSearchDialogOpen}
        onOpenChange={setIsGameSearchDialogOpen}
        onGameSelect={handleGameSelect}
      />

      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-handwritten text-2xl text-center">Spiele löschen?</DialogTitle>
            <DialogDescription className="text-center font-body">
              Bist du sicher, dass du diese <span className="font-bold">{selectedGames.size} Spiele</span> aus deiner
              Bibliothek entfernen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsBulkDeleteDialogOpen(false)}
              className="font-handwritten"
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              onClick={handleConfirmBulkDelete}
              className="bg-red-400 hover:bg-red-500 text-white font-handwritten"
            >
              {selectedGames.size} Spiele löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {selectedGame && (
        <GameTrackingDialog
          isOpen={isTrackingDialogOpen}
          onClose={() => setIsTrackingDialogOpen(false)}
          game={selectedGame}
          onUpdate={handleUpdateTracking}
        />
      )}
    </div>
  )
}

function AuthWrapper() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/library")
    }
  }, [user, authLoading, router])
  
  // Show loading while auth is being checked or redirecting
  if (authLoading || !user) {
    return <LibraryLoading />
  }
  
  return <LibraryContent />
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<LibraryLoading />}>
      <AuthWrapper />
    </Suspense>
  )
}
