"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Upload,
  X,
  ImageIcon,
  AlertCircle,
  Check,
  Camera,
  Tag,
  Users,
  Plus,
  Dices,
  ChevronDown,
  Info,
  Truck,
  MapPin,
  Package,
  FileText,
  Eye,
  ArrowLeft,
  ArrowRight,
  Search,
} from "lucide-react"
import { useGames } from "@/contexts/games-context"
import { useAuth } from "@/contexts/auth-context"

import { GameSearchDialog } from "./game-search-dialog"

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
  "Quiz-Spiel",
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
  "Schmidt",
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

interface CreateMarketplaceOfferFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  preselectedGame?: any | null
  preselectedOfferType?: string
}

export function CreateMarketplaceOfferForm({
  isOpen,
  onClose,
  onSuccess,
  preselectedGame = null,
  preselectedOfferType = "",
}: CreateMarketplaceOfferFormProps) {
  const { games, addMarketplaceOffer, addGame } = useGames()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isGameSearchOpen, setIsGameSearchOpen] = useState(false)

  // Form data
  const [selectedGame, setSelectedGame] = useState<string>("")
  const [customGameTitle, setCustomGameTitle] = useState("")
  const [customGamePublisher, setCustomGamePublisher] = useState("")

  const [customGameCustomPublisher, setCustomGameCustomPublisher] = useState("")
  const [customGamePlayerCount, setCustomGamePlayerCount] = useState("")
  const [customGameDuration, setCustomGameDuration] = useState("")
  const [customGameAge, setCustomGameAge] = useState("")
  const [customGameLanguage, setCustomGameLanguage] = useState("")
  const [customGameCustomLanguage, setCustomGameCustomLanguage] = useState("")
  const [customGameStyle, setCustomGameStyle] = useState<string[]>([])
  const [customGameCustomStyle, setCustomGameCustomStyle] = useState("")
  const [customGameType, setCustomGameType] = useState<string[]>([])
  const [customGameCustomType, setCustomGameCustomType] = useState("")
  const [customGameImage, setCustomGameImage] = useState<string | null>(null)

  const [offerType, setOfferType] = useState<"lend" | "trade" | "sell">("lend")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [dailyRate1Day, setDailyRate1Day] = useState("")
  const [dailyRate2To6Days, setDailyRate2To6Days] = useState("")
  const [dailyRate7To30Days, setDailyRate7To30Days] = useState("")
  const [dailyRateOver30Days, setDailyRateOver30Days] = useState("")
  const [depositAmount, setDepositAmount] = useState("")
  const [salePrice, setSalePrice] = useState("")
  const [deliveryPickup, setDeliveryPickup] = useState(false)
  const [deliveryShipping, setDeliveryShipping] = useState(false)
  const [shippingOption, setShippingOption] = useState("")
  const [pickupAddress, setPickupAddress] = useState("")
  const [condition, setCondition] = useState("")
  const [price, setPrice] = useState("")
  const [openToSuggestions, setOpenToSuggestions] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (preselectedGame) {
        setSelectedGame(preselectedGame.id || "")
        setImagePreview(preselectedGame.image || "")
        setCurrentStep(2)
      } else {
        setCurrentStep(1)
      }

      if (preselectedOfferType) {
        setOfferType(preselectedOfferType as "lend" | "trade" | "sell")
      }
    }
  }, [isOpen, preselectedGame, preselectedOfferType])

  const shippingOptions = [
    { value: "postpac-a-2kg", label: "PostPac Economy (A-Post) bis 2 kg: CHF 10.50" },
    { value: "postpac-b-2kg", label: "PostPac Economy (B-Post) bis 2 kg: CHF 8.50" },
    { value: "postpac-a-10kg", label: "PostPac Economy (A-Post) bis 10 kg: CHF 13.50" },
    { value: "postpac-b-10kg", label: "PostPac Economy (B-Post) bis 10 kg: CHF 11.50" },
    { value: "postpac-a-30kg", label: "PostPac Economy (A-Post) bis 30 kg: CHF 22.50" },
    { value: "postpac-b-30kg", label: "PostPac Economy (B-Post) bis 30 kg: CHF 20.50" },
  ]

  const handleCustomGameTypeToggle = (type: string) => {
    setCustomGameType((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const handleCustomGameStyleToggle = (style: string) => {
    setCustomGameStyle((prev) => (prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]))
  }

  const handleAddCustomType = () => {
    if (customGameCustomType.trim() && !customGameType.includes(customGameCustomType.trim())) {
      setCustomGameType((prev) => [...prev, customGameCustomType.trim()])
      setCustomGameCustomType("")
    }
  }

  const handleAddCustomStyle = () => {
    if (customGameCustomStyle.trim() && !customGameStyle.includes(customGameCustomStyle.trim())) {
      setCustomGameStyle((prev) => [...prev, customGameCustomStyle.trim()])
      setCustomGameCustomStyle("")
    }
  }

  const handleAddCustomPublisher = () => {
    if (customGameCustomPublisher.trim()) {
      setCustomGamePublisher(customGameCustomPublisher.trim())
      setCustomGameCustomPublisher("")
    }
  }

  const handleAddCustomLanguage = () => {
    if (customGameCustomLanguage.trim()) {
      setCustomGameLanguage(customGameCustomLanguage.trim())
      setCustomGameCustomLanguage("")
    }
  }

  const handleCustomGameImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, customGameImage: "Nur JPG, PNG und WebP Dateien sind erlaubt." }))
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setErrors((prev) => ({ ...prev, customGameImage: "Die Datei ist zu groß. Maximum 5MB erlaubt." }))
      return
    }

    setErrors((prev) => ({ ...prev, customGameImage: "" }))

    const reader = new FileReader()
    reader.onload = (e) => {
      setCustomGameImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleGameSelect = (game: any) => {
    console.log("[v0] Selected game from BGG:", game)

    // Fill custom game fields with BoardGameGeek data
    setCustomGameTitle(game.name || "")
    setCustomGamePublisher(game.publishers?.[0] || "")
    setCustomGamePlayerCount(game.playerCount || "")
    setCustomGameDuration(game.playingTime || "")
    setCustomGameAge(game.minAge ? `${game.minAge}+` : "")
    setCustomGameLanguage("Deutsch") // Default language
    setCustomGameType(game.categories || [])
    setCustomGameStyle(game.mechanics || [])
    setCustomGameImage(game.image || null)

    // Clear any existing game selection and enable custom game mode
    setSelectedGame("")

    // Clear validation errors
    setErrors({})

    // Close the search dialog
    setIsGameSearchOpen(false)

    console.log("[v0] Game data filled into form")
  }

  const resetForm = () => {
    setSelectedGame("")
    setCustomGameTitle("")
    setCustomGamePublisher("")
    setCustomGameCustomPublisher("")
    setCustomGamePlayerCount("")
    setCustomGameDuration("")
    setCustomGameAge("")
    setCustomGameLanguage("")
    setCustomGameCustomLanguage("")
    setCustomGameStyle([])
    setCustomGameCustomStyle("")
    setCustomGameType([])
    setCustomGameCustomType("")
    setCustomGameImage(null)
    setOfferType("lend")
    setDescription("")
    setImage(null)
    setImagePreview("")
    setDailyRate1Day("")
    setDailyRate2To6Days("")
    setDailyRate7To30Days("")
    setDailyRateOver30Days("")
    setDepositAmount("")
    setSalePrice("")
    setDeliveryPickup(false)
    setDeliveryShipping(false)
    setShippingOption("")
    setPickupAddress("")
    setCurrentStep(1)
    setErrors({})
    setCondition("")
    setPrice("")
    setOpenToSuggestions(false)
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, image: "Nur JPG, PNG und WebP Dateien sind erlaubt." }))
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setErrors((prev) => ({ ...prev, image: "Die Datei ist zu groß. Maximum 5MB erlaubt." }))
      return
    }

    setImage(file)
    setErrors((prev) => ({ ...prev, image: "" }))

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview("")
    setErrors((prev) => ({ ...prev, image: "" }))
  }

  const validateStep = (step: number): boolean => {
    console.log("[v0] validateStep called for step:", step)
    let newErrors: Record<string, string> = {}

    if (step === 1) {
      console.log("[v0] Validating step 1 - selectedGame:", selectedGame, "customGameTitle:", customGameTitle)
      newErrors = {}

      if (!selectedGame && !customGameTitle.trim()) {
        newErrors.game = "Bitte wähle ein Spiel aus oder gib einen Spieltitel ein"
      }

      if (!selectedGame && customGameTitle.trim()) {
        console.log("[v0] Validating custom game fields")
        if (!customGamePublisher.trim()) {
          newErrors.customGamePublisher = "Verlag ist erforderlich"
        }
        if (!condition) {
          newErrors.condition = "Zustand ist erforderlich"
        }
        if (!customGamePlayerCount) {
          newErrors.customGamePlayerCount = "Spieleranzahl ist erforderlich"
        }
        if (!customGameDuration) {
          newErrors.customGameDuration = "Spieldauer ist erforderlich"
        }
        if (!customGameAge) {
          newErrors.customGameAge = "Altersempfehlung ist erforderlich"
        }
        if (!customGameLanguage || customGameLanguage === "custom") {
          newErrors.customGameLanguage = "Sprache ist erforderlich"
        }
        if (customGameType.length === 0) {
          newErrors.customGameType = "Bitte wähle mindestens eine Kategorie."
        }
        if (customGameStyle.length === 0) {
          newErrors.customGameStyle = "Bitte wähle mindestens einen Typus."
        }
      }

      console.log("[v0] Step 1 validation errors:", newErrors)
      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    }

    if (step === 2) {
      console.log("[v0] Validating step 2 - offerType:", offerType, "condition:", condition, "price:", price)
      newErrors = {}

      if (!offerType) {
        newErrors.type = "Bitte wähle eine Angebotsart aus"
      }

      if (!condition) {
        newErrors.condition = "Bitte wähle einen Zustand aus"
      }

      if (offerType === "lend") {
        // Check if any daily rate is provided
        const hasAnyDailyRate = dailyRate1Day || dailyRate2To6Days || dailyRate7To30Days || dailyRateOver30Days

        // Only require price field if no daily rates are provided
        if (!price && !hasAnyDailyRate) {
          newErrors.price = "Bitte gib Preis/Bedingungen oder Ausleihgebühren an."
        }

        console.log("[v0] Validating lend-specific fields - dailyRates:", {
          dailyRate1Day,
          dailyRate2To6Days,
          dailyRate7To30Days,
          dailyRateOver30Days,
        })

        // Only show daily rates error if no price and no daily rates
        if (!price && !hasAnyDailyRate) {
          newErrors.dailyRates = "Bitte gib mindestens eine Ausleihgebühr an."
        }
      }

      if (offerType === "trade" && !openToSuggestions && !price.trim()) {
        newErrors.price = "Bitte gib Tauschbedingungen an."
      }

      if (offerType === "lend" && !depositAmount) {
        newErrors.depositAmount = "Bitte gib einen Wert für den Pfandbetrag ein."
      }

      if ((offerType === "lend" || offerType === "sell") && !deliveryPickup && !deliveryShipping) {
        newErrors.delivery = "Bitte wähle mindestens eine Zustellungsoption."
      }

      if (offerType === "lend") {
        console.log("[v0] Validating lend-specific fields - dailyRates:", {
          dailyRate1Day,
          dailyRate2To6Days,
          dailyRate7To30Days,
          dailyRateOver30Days,
        })
        if (!dailyRate1Day && !dailyRate2To6Days && !dailyRate7To30Days && !dailyRateOver30Days) {
          newErrors.dailyRates = "Bitte gib mindestens eine Ausleihgebühr an."
        }
        if (deliveryPickup && !pickupAddress) {
          newErrors.pickupAddress = "Bitte gib die Abholadresse an."
        }
        if (deliveryShipping && !shippingOption) {
          newErrors.shippingOption = "Bitte wähle eine Versandoption."
        }
      }

      if (offerType === "sell") {
        console.log("[v0] Validating sell-specific fields - salePrice:", salePrice)
        if (!salePrice) {
          newErrors.salePrice = "Bitte gib den Verkaufspreis an."
        }
        if (deliveryPickup && !pickupAddress) {
          newErrors.pickupAddress = "Bitte gib die Abholadresse an."
        }
        if (deliveryShipping && !shippingOption) {
          newErrors.shippingOption = "Bitte wähle eine Versandoption."
        }
      }
    }

    console.log("[v0] Step 2 validation errors:", newErrors)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    console.log("[v0] handleNext called - currentStep:", currentStep)
    if (validateStep(currentStep)) {
      console.log("[v0] Validation passed, moving to next step")
      setCurrentStep(currentStep + 1)
    } else {
      console.log("[v0] Validation failed, staying on current step")
    }
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
    setErrors({})
  }

  const handleSubmit = async () => {
    console.log("[v0] handleSubmit called - user:", user?.id, "validateStep(2):", validateStep(2))
    if (!validateStep(2) || !user) {
      console.log("[v0] handleSubmit early return - validation failed or no user")
      return
    }

    console.log("[v0] Starting form submission...")
    setIsSubmitting(true)
    try {
      let gameTitle = ""
      let gamePublisher = ""
      let gameId = selectedGame

      if (!selectedGame && customGameTitle) {
        console.log("[v0] Creating new custom game:", customGameTitle)
        const newGameData = {
          title: customGameTitle,
          publisher: customGamePublisher,
          condition: condition,
          players: customGamePlayerCount,
          duration: customGameDuration,
          age: customGameAge,
          language: customGameLanguage,
          available: ["lend", "trade", "sell"],
          image: customGameImage || "/images/ludoloop-game-placeholder.png",
          ...(customGameType.length > 0 && { type: customGameType.join(", ") }),
          ...(customGameStyle.length > 0 && { style: customGameStyle.join(", ") }),
        }

        console.log("[v0] New game data:", newGameData)
        const createdGame = await addGame(newGameData)
        console.log("[v0] Game created successfully:", createdGame)
        gameId = createdGame.id
        gameTitle = customGameTitle
        gamePublisher = customGamePublisher
      } else if (selectedGame) {
        console.log("[v0] Using existing game:", selectedGame)
        const game = games.find((g) => g.id === selectedGame)
        gameTitle = game?.title || ""
        gamePublisher = game?.publisher || ""
        console.log("[v0] Found game:", { gameTitle, gamePublisher })
      }

      // Convert image to blob URL if present
      let imageUrl = ""
      if (image) {
        imageUrl = URL.createObjectURL(image)
        console.log("[v0] Created image blob URL:", imageUrl)
      } else if (imagePreview) {
        imageUrl = imagePreview
        console.log("[v0] Using existing image preview:", imageUrl)
      }

      let finalPrice = ""
      if (offerType === "sell") {
        finalPrice = salePrice ? `${salePrice} CHF` : ""
      } else if (offerType === "lend") {
        // Construct price from daily rates
        const rates = []
        if (dailyRate1Day) rates.push(`1 Tag: ${dailyRate1Day}CHF`)
        if (dailyRate2To6Days) rates.push(`2-6 Tage: ${dailyRate2To6Days}CHF`)
        if (dailyRate7To30Days) rates.push(`7-30 Tage: ${dailyRate7To30Days}CHF`)
        if (dailyRateOver30Days) rates.push(`>30 Tage: ${dailyRateOver30Days}CHF`)
        finalPrice = rates.length > 0 ? rates.join(", ") : price
      } else if (offerType === "trade") {
        finalPrice = openToSuggestions ? "Offen für Vorschläge" : price
      }

      const offerData = {
        game_id: gameId,
        title: gameTitle,
        publisher: gamePublisher,
        condition,
        type: offerType,
        price: finalPrice,
        description,
        image: imageUrl,
        active: true,
        location: deliveryPickup ? pickupAddress : "",
        distance: "", // Default empty distance
      }

      console.log("[v0] Offer data to be submitted:", offerData)
      await addMarketplaceOffer(offerData)
      console.log("[v0] Marketplace offer created successfully")

      resetForm()
      onSuccess?.()
      onClose()
      console.log("[v0] Form submission completed successfully")
    } catch (error) {
      console.error("[v0] Error creating marketplace offer:", error)
      setErrors({ submit: "Fehler beim Erstellen des Angebots. Bitte versuche es erneut." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Schritt 1: Spiel auswählen"
      case 2:
        return "Schritt 2: Angebots-Details"
      case 3:
        return "Schritt 3: Zusammenfassung"
      default:
        return "Angebot erstellen"
    }
  }

  const getPriceLabel = () => {
    switch (offerType) {
      case "lend":
        return "Bedingungen"
      case "trade":
        return "Tauschbedingungen"
      case "sell":
        return "Verkaufspreis (CHF)"
      default:
        return "Preis"
    }
  }

  const getPricePlaceholder = () => {
    switch (offerType) {
      case "lend":
        return "z.B. Kostenlose Ausleihe gegen Pfand"
      case "trade":
        return "z.B. Gegen ähnliches Strategiespiel"
      case "sell":
        return "z.B. 25.00"
      default:
        return "Preis eingeben..."
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200 shadow-2xl">
          <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-orange-500 text-white p-6 -m-6 mb-6 rounded-t-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center mb-4">{getStepTitle()}</DialogTitle>

              <div className="flex items-center justify-center space-x-2 mb-2">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                        step <= currentStep
                          ? "bg-white text-orange-800 shadow-lg"
                          : "bg-orange-500 text-orange-800 border-2 border-orange-800"
                      }`}
                    >
                      {step < currentStep ? <Check className="w-5 h-5" /> : step}
                    </div>
                    {step < 3 && (
                      <div
                        className={`w-16 h-1 mx-2 transition-all duration-300 ${
                          step < currentStep ? "bg-white" : "bg-orange-800"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <p className="text-center text-white text-sm">Schritt {currentStep} von 3</p>
            </DialogHeader>
          </div>

          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="space-y-6 p-0">
              {/* Step 1: Game Selection */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-all duration-300">
                    <h3 className="text-xl font-bold text-orange-800 mb-4 flex items-center gap-3">
                      <Dices className="w-6 h-6 text-orange-800" />
                      Spiel auswählen
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Aus deiner Bibliothek wählen
                        </Label>
                        <Select value={selectedGame} onValueChange={setSelectedGame}>
                          <SelectTrigger className="h-12 border-2 border-orange-200 focus:border-orange-500 rounded-xl bg-white hover:border-orange-300 transition-colors">
                            <SelectValue placeholder="Spiel aus Bibliothek wählen..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-orange-200">
                            {games.map((game) => (
                              <SelectItem key={game.id} value={game.id} className="rounded-lg hover:bg-orange-50">
                                <div className="flex items-center gap-3">
                                  {game.image && (
                                    <img
                                      src={game.image || "/placeholder.svg"}
                                      alt={game.title}
                                      className="w-8 h-8 object-cover rounded"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium">{game.title}</p>
                                    <p className="text-xs text-gray-500">{game.publisher}</p>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-orange-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="bg-white px-4 text-orange-600 font-medium">oder</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
                          <Checkbox
                            id="custom-game"
                            checked={!selectedGame}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedGame("")
                              }
                            }}
                            className="border-orange-400 data-[state=checked]:bg-orange-600"
                          />
                          <Label htmlFor="custom-game" className="font-medium text-black-800 cursor-pointer">
                            Neues Spiel hinzufügen
                          </Label>
                        </div>

                        {!selectedGame && (
                          <div className="space-y-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                console.log("[v0] BoardGameGeek search button clicked")
                                console.log("[v0] selectedGame:", selectedGame)
                                console.log("[v0] Setting isGameSearchOpen to true")
                                setIsGameSearchOpen(true)
                              }}
                              className="w-full h-12 border-2 border-orange-400 text-orange-600 hover:bg-orange-400 hover:text-white transition-all duration-200 rounded-xl font-medium"
                            >
                              <Search className="w-4 h-4 mr-2" />
                              Spiel in der Datenbank suchen
                            </Button>

                            <div className="relative">
                              <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-orange-200" />
                              </div>
                              <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-4 text-orange-600 font-medium">oder manuell eingeben</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Custom Game Form */}
                  {!selectedGame && (
                    <div className="space-y-6">
                      {/* Game Cover Section */}
                      <div className="bg-gradient-to-br from-amber-50 to-amber-50 rounded-2xl p-6 border border-amber-200 shadow-sm">
                        <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
                          <Camera className="w-5 h-5" />
                          Spiel Cover
                        </h3>
                        <div className="text-center">
                          <div className="w-40 h-52 mx-auto mb-4 border-2 border-dashed border-orange-300 rounded-2xl flex items-center justify-center bg-white/70 overflow-hidden hover:border-orange-400 transition-all duration-300 shadow-sm hover:shadow-md">
                            {customGameImage ? (
                              <img
                                src={customGameImage || "/placeholder.svg"}
                                alt="Spiel Cover"
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              <div className="text-center">
                                <Camera className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                                <p className="text-sm text-orange-600 font-medium">Cover hochladen</p>
                              </div>
                            )}
                          </div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleCustomGameImageUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-orange-400 text-orange-600 hover:bg-orange-400 hover:text-white transition-all duration-200 rounded-xl px-6 py-2 font-medium"
                            disabled={!!selectedGame}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Bild hochladen
                          </Button>
                        </div>
                        {errors.customGameImage && (
                          <div className="flex items-center space-x-2 text-red-600 text-sm mt-3 bg-red-50 p-2 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.customGameImage}</span>
                          </div>
                        )}
                      </div>

                      {/* Basic Information */}
                      <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-200 shadow-sm">
                        <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
                          <Info className="w-5 h-5" />
                          Grundinformationen
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-semibold text-gray-700 mb-2 block">Spielname *</Label>
                            <Input
                              value={customGameTitle}
                              onChange={(e) => setCustomGameTitle(e.target.value)}
                              placeholder="z.B. Die Siedler von Catan"
                              className="h-12 border-2 border-orange-200 focus:border-orange-500 rounded-xl bg-white hover:border-orange-300 transition-colors"
                              disabled={!!selectedGame}
                            />
                          </div>

                          <div>
                            <Label className="text-sm font-semibold text-gray-700 mb-2 block">Verlag *</Label>
                            <Select
                              value={customGamePublisher}
                              onValueChange={setCustomGamePublisher}
                              disabled={!!selectedGame}
                            >
                              <SelectTrigger className="h-12 border-2 border-orange-200 focus:border-orange-500 rounded-xl bg-white hover:border-orange-300 transition-colors">
                                <SelectValue placeholder="Verlag wählen..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                {PUBLISHER_OPTIONS.map((publisher) => (
                                  <SelectItem key={publisher} value={publisher} className="rounded-lg">
                                    {publisher}
                                  </SelectItem>
                                ))}
                                <SelectItem value="custom" className="font-bold text-orange-600 rounded-lg">
                                  Eigenen Verlag eingeben...
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {customGamePublisher === "custom" && (
                              <div className="mt-3 flex gap-2">
                                <Input
                                  value={customGameCustomPublisher}
                                  onChange={(e) => setCustomGameCustomPublisher(e.target.value)}
                                  placeholder="Verlag eingeben..."
                                  className="h-10 border-2 border-orange-200 rounded-lg bg-white"
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
                                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-3"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="md:col-span-2">
                            <Label className="text-sm font-semibold text-gray-700 mb-2 block">Sprache *</Label>
                            <Select
                              value={customGameLanguage}
                              onValueChange={setCustomGameLanguage}
                              disabled={!!selectedGame}
                            >
                              <SelectTrigger className="h-12 border-2 border-orange-200 focus:border-orange-500 rounded-xl bg-white hover:border-orange-300 transition-colors">
                                <SelectValue placeholder="Sprache wählen..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                {LANGUAGE_OPTIONS.map((language) => (
                                  <SelectItem
                                    key={language}
                                    value={language === "Andere" ? "custom" : language}
                                    className="rounded-lg"
                                  >
                                    {language}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {customGameLanguage === "custom" && (
                              <div className="mt-3 flex gap-2">
                                <Input
                                  value={customGameCustomLanguage}
                                  onChange={(e) => setCustomGameCustomLanguage(e.target.value)}
                                  placeholder="Sprache eingeben..."
                                  className="h-10 border-2 border-orange-200 rounded-lg bg-white"
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
                                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-3"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        {(errors.customGamePublisher || errors.customGameLanguage) && (
                          <div className="mt-3 space-y-1">
                            {errors.customGamePublisher && (
                              <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                                <AlertCircle className="w-4 h-4" />
                                <span>{errors.customGamePublisher}</span>
                              </div>
                            )}
                            {errors.customGameLanguage && (
                              <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                                <AlertCircle className="w-4 h-4" />
                                <span>{errors.customGameLanguage}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Categories Section */}
                      <div className="bg-gradient-to-br from-orange-50 to-orange-50 rounded-2xl p-6 border border-orange-200 shadow-sm">
                        <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
                          <Tag className="w-5 h-5" />
                          Kategorien & Typus
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Category Selection */}
                          <div>
                            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                              Kategorie * (Mehrfachauswahl)
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-between h-12 border-2 border-orange-200 hover:border-orange-300 rounded-xl bg-white transition-colors"
                                  type="button"
                                  disabled={!!selectedGame}
                                >
                                  {customGameType.length > 0 ? (
                                    <span className="text-orange-600 font-medium">
                                      {customGameType.length} Kategorie{customGameType.length > 1 ? "n" : ""} ausgewählt
                                    </span>
                                  ) : (
                                    "Kategorie wählen..."
                                  )}
                                  <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-72 p-0 rounded-xl border-orange-200">
                                <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                                  <h4 className="font-semibold text-sm text-orange-800">Kategorie auswählen:</h4>
                                  {GAME_TYPE_OPTIONS.map((type) => (
                                    <div
                                      key={type}
                                      className="flex items-center space-x-3 p-2 hover:bg-orange-50 rounded-lg transition-colors"
                                    >
                                      <Checkbox
                                        id={`type-${type}`}
                                        checked={customGameType.includes(type)}
                                        onCheckedChange={() => handleCustomGameTypeToggle(type)}
                                        className="border-orange-300 data-[state=checked]:bg-orange-600"
                                      />
                                      <Label htmlFor={`type-${type}`} className="text-sm cursor-pointer flex-1">
                                        {type}
                                      </Label>
                                    </div>
                                  ))}
                                  <div className="border-t border-orange-200 pt-3 mt-3">
                                    <h5 className="font-medium text-xs text-gray-600 mb-2">
                                      Eigene Kategorie hinzufügen:
                                    </h5>
                                    <div className="flex gap-2">
                                      <Input
                                        value={customGameCustomType}
                                        onChange={(e) => setCustomGameCustomType(e.target.value)}
                                        placeholder="Kategorie eingeben..."
                                        className="text-sm border-orange-200 rounded-lg"
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
                                        className="bg-orange-500 hover:bg-orange-600 text-white px-2 rounded-lg"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  {customGameType.length > 0 && (
                                    <div className="border-t border-orange-200 pt-3 mt-3">
                                      <h5 className="font-medium text-xs text-gray-600 mb-2">Ausgewählt:</h5>
                                      <div className="flex flex-wrap gap-1">
                                        {customGameType.map((type) => (
                                          <Badge
                                            key={type}
                                            className="text-xs cursor-pointer bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-full px-2 py-1"
                                            onClick={() => handleCustomGameTypeToggle(type)}
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

                          {/* Style Selection */}
                          <div>
                            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                              Typus * (Mehrfachauswahl)
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-between h-12 border-2 border-orange-200 hover:border-orange-300 rounded-xl bg-white transition-colors"
                                  type="button"
                                  disabled={!!selectedGame}
                                >
                                  {customGameStyle.length > 0 ? (
                                    <span className="text-orange-600 font-medium">
                                      {customGameStyle.length} Typus {customGameStyle.length > 1 ? "en" : ""} ausgewählt
                                    </span>
                                  ) : (
                                    "Typus wählen..."
                                  )}
                                  <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-72 p-0 rounded-xl border-orange-200">
                                <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                                  <h4 className="font-semibold text-sm text-orange-800">Typus auswählen:</h4>
                                  {GAME_STYLE_OPTIONS.map((style) => (
                                    <div
                                      key={style}
                                      className="flex items-center space-x-3 p-2 hover:bg-orange-50 rounded-lg transition-colors"
                                    >
                                      <Checkbox
                                        id={`style-${style}`}
                                        checked={customGameStyle.includes(style)}
                                        onCheckedChange={() => handleCustomGameStyleToggle(style)}
                                        className="border-orange-300 data-[state=checked]:bg-orange-600"
                                      />
                                      <Label htmlFor={`style-${style}`} className="text-sm cursor-pointer flex-1">
                                        {style}
                                      </Label>
                                    </div>
                                  ))}
                                  <div className="border-t border-orange-200 pt-3 mt-3">
                                    <h5 className="font-medium text-xs text-gray-600 mb-2">
                                      Eigenen Typus hinzufügen:
                                    </h5>
                                    <div className="flex gap-2">
                                      <Input
                                        value={customGameCustomStyle}
                                        onChange={(e) => setCustomGameCustomStyle(e.target.value)}
                                        placeholder="Typus eingeben..."
                                        className="text-sm border-orange-200 rounded-lg"
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
                                        className="bg-orange-500 hover:bg-orange-600 text-white px-2 rounded-lg"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  {customGameStyle.length > 0 && (
                                    <div className="border-t border-orange-200 pt-3 mt-3">
                                      <h5 className="font-medium text-xs text-gray-600 mb-2">Ausgewählt:</h5>
                                      <div className="flex flex-wrap gap-1">
                                        {customGameStyle.map((style) => (
                                          <Badge
                                            key={style}
                                            className="text-xs cursor-pointer bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-full px-2 py-1"
                                            onClick={() => handleCustomGameStyleToggle(style)}
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
                        {(errors.customGameType || errors.customGameStyle) && (
                          <div className="mt-3 space-y-1">
                            {errors.customGameType && (
                              <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                                <AlertCircle className="w-4 h-4" />
                                <span>{errors.customGameType}</span>
                              </div>
                            )}
                            {errors.customGameStyle && (
                              <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                                <AlertCircle className="w-4 h-4" />
                                <span>{errors.customGameStyle}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Game Details Section */}
                      <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-200 shadow-sm">
                        <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Spieldetails
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-semibold text-gray-700 mb-2 block">Spieleranzahl *</Label>
                            <Select
                              value={customGamePlayerCount}
                              onValueChange={setCustomGamePlayerCount}
                              disabled={!!selectedGame}
                            >
                              <SelectTrigger className="h-12 border-2 border-orange-200 focus:border-orange-500 rounded-xl bg-white hover:border-orange-300 transition-colors">
                                <SelectValue placeholder="Spieleranzahl wählen..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                {PLAYER_COUNT_OPTIONS.map((count) => (
                                  <SelectItem key={count} value={count} className="rounded-lg">
                                    {count}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm font-semibold text-gray-700 mb-2 block">Spieldauer *</Label>
                            <Select
                              value={customGameDuration}
                              onValueChange={setCustomGameDuration}
                              disabled={!!selectedGame}
                            >
                              <SelectTrigger className="h-12 border-2 border-orange-200 focus:border-orange-500 rounded-xl bg-white hover:border-orange-300 transition-colors">
                                <SelectValue placeholder="Spieldauer wählen..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                {DURATION_OPTIONS.map((duration) => (
                                  <SelectItem key={duration} value={duration} className="rounded-lg">
                                    {duration}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm font-semibold text-gray-700 mb-2 block">Altersempfehlung *</Label>
                            <Select value={customGameAge} onValueChange={setCustomGameAge} disabled={!!selectedGame}>
                              <SelectTrigger className="h-12 border-2 border-orange-200 focus:border-orange-500 rounded-xl bg-white hover:border-orange-300 transition-colors">
                                <SelectValue placeholder="Altersempfehlung wählen..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                {AGE_OPTIONS.map((age) => (
                                  <SelectItem key={age} value={age} className="rounded-lg">
                                    {age}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {(errors.customGamePlayerCount || errors.customGameDuration || errors.customGameAge) && (
                          <div className="mt-3 space-y-1">
                            {errors.customGamePlayerCount && (
                              <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                                <AlertCircle className="w-4 h-4" />
                                <span>{errors.customGamePlayerCount}</span>
                              </div>
                            )}
                            {errors.customGameDuration && (
                              <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                                <AlertCircle className="w-4 h-4" />
                                <span>{errors.customGameDuration}</span>
                              </div>
                            )}
                            {errors.customGameAge && (
                              <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                                <AlertCircle className="w-4 h-4" />
                                <span>{errors.customGameAge}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Offer Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
                    <h3 className="text-xl font-bold text-orange-800 mb-6 flex items-center gap-3">Angebots-Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Offer Type */}
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">Angebotsart *</Label>
                        <Select
                          value={offerType}
                          onValueChange={(value: "lend" | "trade" | "sell") => setOfferType(value)}
                        >
                          <SelectTrigger className="h-12 border-2 border-orange-200 focus:border-orange-500 rounded-xl bg-white hover:border-orange-300 transition-colors">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="lend" className="rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-teal-400 rounded-full"></div>
                                Verleihen
                              </div>
                            </SelectItem>
                            <SelectItem value="trade" className="rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                                Tauschen
                              </div>
                            </SelectItem>
                            <SelectItem value="sell" className="rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                                Verkaufen
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.type && (
                          <div className="flex items-center space-x-2 text-red-600 text-sm mt-2 bg-red-50 p-2 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.type}</span>
                          </div>
                        )}
                      </div>

                      {/* Condition */}
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">Zustand *</Label>
                        <Select value={condition} onValueChange={setCondition}>
                          <SelectTrigger className="h-12 border-2 border-orange-200 focus:border-orange-500 rounded-xl bg-white hover:border-orange-300 transition-colors">
                            <SelectValue placeholder="Zustand auswählen..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="neu" className="rounded-lg">
                              <div className="flex items-center gap-2">Neu</div>
                            </SelectItem>
                            <SelectItem value="wie neu" className="rounded-lg">
                              <div className="flex items-center gap-2">Wie neu</div>
                            </SelectItem>
                            <SelectItem value="sehr gut" className="rounded-lg">
                              <div className="flex items-center gap-2">Sehr gut</div>
                            </SelectItem>
                            <SelectItem value="gut" className="rounded-lg">
                              <div className="flex items-center gap-2">Gut</div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.condition && (
                          <div className="flex items-center space-x-2 text-red-600 text-sm mt-2 bg-red-50 p-2 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.condition}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lending specific fields */}
                  {offerType === "lend" && (
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-200 shadow-sm">
                      <h4 className="text-lg font-bold text-teal-800 mb-4 flex items-center gap-2">
                        Verleihen Details
                      </h4>
                      {/* Daily Rates */}
                      <div className="mb-6">
                        <Label className="text-sm font-semibold text-gray-700 mb-3 block">Ausleihgebühr (CHF)</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-xl border border-teal-200">
                            <Label className="text-sm text-teal-700 font-medium mb-2 block">Für 1 Tag</Label>
                            <Input
                              placeholder="z.B. 10.00"
                              value={dailyRate1Day}
                              onChange={(e) => setDailyRate1Day(e.target.value)}
                              className="h-10 border-2 border-teal-200 focus:border-teal-500 rounded-lg"
                              type="number"
                              step="0.01"
                              min="0"
                            />
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-teal-200">
                            <Label className="text-sm text-teal-700 font-medium mb-2 block">Für 2 bis 6 Tage</Label>
                            <Input
                              placeholder="z.B. 8.00"
                              value={dailyRate2To6Days}
                              onChange={(e) => setDailyRate2To6Days(e.target.value)}
                              className="h-10 border-2 border-teal-200 focus:border-teal-500 rounded-lg"
                              type="number"
                              step="0.01"
                              min="0"
                            />
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-teal-200">
                            <Label className="text-sm text-teal-700 font-medium mb-2 block">Für 7 bis 30 Tage</Label>
                            <Input
                              placeholder="z.B. 5.00"
                              value={dailyRate7To30Days}
                              onChange={(e) => setDailyRate7To30Days(e.target.value)}
                              className="h-10 border-2 border-teal-200 focus:border-teal-500 rounded-lg"
                              type="number"
                              step="0.01"
                              min="0"
                            />
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-teal-200">
                            <Label className="text-sm text-teal-700 font-medium mb-2 block">Für mehr als 30 Tage</Label>
                            <Input
                              placeholder="z.B. 3.00"
                              value={dailyRateOver30Days}
                              onChange={(e) => setDailyRateOver30Days(e.target.value)}
                              className="h-10 border-2 border-teal-200 focus:border-teal-500 rounded-lg"
                              type="number"
                              step="0.01"
                              min="0"
                            />
                          </div>
                        </div>
                        <p className="text-sm text-teal-600 mt-3 bg-teal-50 p-3 rounded-lg">
                          Gib gestaffelte Tagespreise an. Lasse Felder leer für kostenlose Ausleihe in diesen
                          Zeiträumen.
                        </p>
                      </div>

                      {/* Deposit Amount */}
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">Pfandbetrag (CHF) *</Label>
                        <Input
                          placeholder="z.B. 50.00"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="h-12 border-2 border-teal-200 focus:border-teal-500 rounded-xl bg-white"
                          type="number"
                          step="0.01"
                          min="0"
                        />
                        {errors.depositAmount && (
                          <div className="flex items-center space-x-2 text-red-600 text-sm mt-2 bg-red-50 p-2 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.depositAmount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Selling specific fields */}
                  {offerType === "sell" && (
                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-200 shadow-sm">
                      <h4 className="text-lg font-bold text-pink-800 mb-4 flex items-center gap-2">Verkaufs Details</h4>

                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">Verkaufspreis (CHF) *</Label>
                        <Input
                          placeholder="z.B. 25.00"
                          value={salePrice}
                          onChange={(e) => setSalePrice(e.target.value)}
                          className="h-12 border-2 border-pink-200 focus:border-pink-500 rounded-xl bg-white"
                          type="number"
                          step="0.01"
                          min="0"
                        />
                        {errors.salePrice && (
                          <div className="flex items-center space-x-2 text-red-600 text-sm mt-2 bg-red-50 p-2 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.salePrice}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Trading specific fields */}
                  {offerType === "trade" && (
                    <div className="bg-gradient-to-br from-orange-50 to-orange-50 rounded-2xl p-6 border border-orange-200 shadow-sm">
                      <h4 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">Tausch Details</h4>

                      <div className="mb-4">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="openToSuggestions"
                            checked={openToSuggestions}
                            onChange={(e) => setOpenToSuggestions(e.target.checked)}
                            className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                          />
                          <Label
                            htmlFor="openToSuggestions"
                            className="text-sm font-medium text-gray-700 cursor-pointer"
                          >
                            Offen für Vorschläge
                          </Label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-7">
                          Ich bin offen für verschiedene Tauschvorschläge
                        </p>
                      </div>

                      {!openToSuggestions && (
                        <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">{getPriceLabel()}</Label>
                          <Input
                            placeholder={getPricePlaceholder()}
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="h-12 border-2 border-orange-200 focus:border-orange-500 rounded-xl bg-white"
                          />
                          {errors.price && (
                            <div className="flex items-center space-x-2 text-red-600 text-sm mt-2 bg-red-50 p-2 rounded-lg">
                              <AlertCircle className="w-4 h-4" />
                              <span>{errors.price}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {openToSuggestions && (
                        <div className="bg-orange-100 border border-orange-300 rounded-xl p-4">
                          <p className="text-orange-800 text-sm font-medium">
                            Du bist offen für Tauschvorschläge. Andere Nutzer können dir verschiedene Spiele zum Tausch
                            anbieten.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delivery Options */}
                  {(offerType === "lend" || offerType === "sell") && (
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-200 shadow-sm">
                      <h4 className="text-lg font-bold text-indigo-800 mb-4 flex items-center gap-2">
                        Zustellungsoptionen *
                      </h4>

                      <div className="space-y-4">
                        {/* Pickup Option */}
                        <div className="bg-white p-4 rounded-xl border border-indigo-200">
                          <div className="flex items-center space-x-3 mb-3">
                            <Checkbox
                              id="pickup"
                              checked={deliveryPickup}
                              onCheckedChange={(checked) => setDeliveryPickup(checked as boolean)}
                              className="border-indigo-400 data-[state=checked]:bg-indigo-600"
                            />
                            <Label
                              htmlFor="pickup"
                              className="font-medium text-indigo-800 cursor-pointer flex items-center gap-2"
                            >
                              <MapPin className="w-4 h-4" />
                              Abholung
                            </Label>
                          </div>

                          {deliveryPickup && (
                            <div className="ml-7">
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">Abholadresse</Label>
                              <Input
                                placeholder="z.B. Musterstrasse 123, 12345 Musterstadt"
                                value={pickupAddress}
                                onChange={(e) => setPickupAddress(e.target.value)}
                                className="h-10 border-2 border-indigo-200 focus:border-indigo-500 rounded-lg"
                              />
                              {errors.pickupAddress && (
                                <div className="flex items-center space-x-2 text-red-600 text-sm mt-2 bg-red-50 p-2 rounded-lg">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>{errors.pickupAddress}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Shipping Option */}
                        <div className="bg-white p-4 rounded-xl border border-indigo-200">
                          <div className="flex items-center space-x-3 mb-3">
                            <Checkbox
                              id="shipping"
                              checked={deliveryShipping}
                              onCheckedChange={(checked) => {
                                setDeliveryShipping(checked as boolean)
                                if (!checked) setShippingOption("")
                              }}
                              className="border-indigo-400 data-[state=checked]:bg-indigo-600"
                            />
                            <Label
                              htmlFor="shipping"
                              className="font-medium text-indigo-800 cursor-pointer flex items-center gap-2"
                            >
                              <Package className="w-4 h-4" />
                              Postversand (Kosten zu Lasten der{" "}
                              {offerType === "lend" ? "Leihnehmer*innen" : "Käufer*innen"})
                            </Label>
                          </div>

                          {deliveryShipping && (
                            <div className="ml-7">
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">Versandoption</Label>
                              <Select value={shippingOption} onValueChange={setShippingOption}>
                                <SelectTrigger className="h-10 border-2 border-indigo-200 focus:border-indigo-500 rounded-lg">
                                  <SelectValue placeholder="Versandoption wählen..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                  {shippingOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value} className="rounded-lg">
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {errors.shippingOption && (
                                <div className="flex items-center space-x-2 text-red-600 text-sm mt-2 bg-red-50 p-2 rounded-lg">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>{errors.shippingOption}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {errors.delivery && (
                        <div className="flex items-center space-x-2 text-red-600 text-sm mt-3 bg-red-50 p-2 rounded-lg">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.delivery}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-sm">
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Beschreibung
                    </Label>
                    <Textarea
                      placeholder="Zusätzliche Informationen zum Spiel oder Angebot..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="border-2 border-amber-200 focus:border-amber-500 rounded-xl bg-white resize-none"
                      rows={4}
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-sm">
                    <Label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Bild
                    </Label>
                    <div className="border-2 border-dashed border-purple-200 rounded-xl p-6 hover:border-purple-300 transition-colors">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview || "/placeholder.svg"}
                            alt="Vorschau"
                            className="w-full h-64 object-cover rounded-xl"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-3 right-3 rounded-full w-8 h-8 p-0"
                            onClick={removeImage}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                          <p className="text-purple-600 font-medium mb-2">Bild hochladen</p>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById("image-upload")?.click()}
                            className="border-2 border-purple-400 text-purple-600 hover:bg-purple-400 hover:text-white rounded-xl px-6 py-2 transition-all duration-200"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Bild auswählen
                          </Button>
                          <p className="text-xs text-gray-500 mt-3">JPG, PNG, WebP (max. 5MB)</p>
                        </div>
                      )}
                    </div>
                    {errors.image && (
                      <div className="flex items-center space-x-2 text-red-600 text-sm mt-3 bg-red-50 p-2 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.image}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Summary */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-orange-50 to-indigo-50 rounded-2xl p-6 border border-orange-200 shadow-lg">
                    <h3 className="text-2xl font-bold text-orange-800 mb-6 flex items-center gap-3">
                      <Eye className="w-6 h-6" />
                      Angebots-Zusammenfassung
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Game Information */}
                      <div className="bg-white rounded-xl p-4 border border-orange-100">
                        <h4 className="font-bold text-orange-700 mb-3 flex items-center gap-2">
                          <Dices className="w-4 h-4" />
                          Spiel-Informationen
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Spiel:</span>
                            <span className="font-medium">
                              {selectedGame ? games.find((g) => g.id === selectedGame)?.title : customGameTitle}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Verlag:</span>
                            <span className="font-medium">
                              {selectedGame ? games.find((g) => g.id === selectedGame)?.publisher : customGamePublisher}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Zustand:</span>
                            <Badge variant="outline" className="text-xs">
                              {condition}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Offer Information */}
                      <div className="bg-white rounded-xl p-4 border border-orange-100">
                        <h4 className="font-bold text-orange-700 mb-3 flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          Angebots-Informationen
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Typ:</span>
                            <Badge
                              className={`text-xs ${
                                offerType === "lend"
                                  ? "bg-teal-100 text-teal-700"
                                  : offerType === "trade"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-pink-100 text-pink-700"
                              }`}
                            >
                              {offerType === "lend" ? "Verleihen" : offerType === "trade" ? "Tauschen" : "Verkaufen"}
                            </Badge>
                          </div>

                          {offerType === "sell" && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Verkaufspreis:</span>
                              <span className="font-bold text-pink-600">CHF {salePrice}</span>
                            </div>
                          )}

                          {offerType === "trade" && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Preis:</span>
                              <span className="font-medium">{price}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Lending Details */}
                      {offerType === "lend" && (
                        <div className="md:col-span-2 bg-white rounded-xl p-4 border border-teal-100">
                          <h4 className="font-bold text-teal-700 mb-3 flex items-center gap-2">Verleihen Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm text-gray-600 block mb-2">Ausleihgebühr:</span>
                              <div className="space-y-1 text-sm">
                                {dailyRate1Day && (
                                  <p className="flex justify-between">
                                    <span>1 Tag:</span>
                                    <span className="font-medium">CHF {dailyRate1Day}</span>
                                  </p>
                                )}
                                {dailyRate2To6Days && (
                                  <p className="flex justify-between">
                                    <span>2-6 Tage:</span>
                                    <span className="font-medium">CHF {dailyRate2To6Days}</span>
                                  </p>
                                )}
                                {dailyRate7To30Days && (
                                  <p className="flex justify-between">
                                    <span>7-30 Tage:</span>
                                    <span className="font-medium">CHF {dailyRate7To30Days}</span>
                                  </p>
                                )}
                                {dailyRateOver30Days && (
                                  <p className="flex justify-between">
                                    <span>Über 30 Tage:</span>
                                    <span className="font-medium">CHF {dailyRateOver30Days}</span>
                                  </p>
                                )}
                                {!dailyRate1Day &&
                                  !dailyRate2To6Days &&
                                  !dailyRate7To30Days &&
                                  !dailyRateOver30Days && (
                                    <p className="text-teal-600 font-medium">Kostenlose Ausleihe</p>
                                  )}
                              </div>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600 block mb-2">Pfandbetrag:</span>
                              <span className="font-bold text-teal-600 text-lg">CHF {depositAmount}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Delivery Options */}
                      {(offerType === "lend" || offerType === "sell") && (
                        <div className="md:col-span-2 bg-white rounded-xl p-4 border border-indigo-100">
                          <h4 className="font-bold text-indigo-700 mb-3 flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Zustellungsoptionen
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {deliveryPickup && (
                              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                                <Badge variant="outline" className="mb-2 bg-indigo-100 text-indigo-700">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  Abholung
                                </Badge>
                                <p className="text-xs text-gray-600">{pickupAddress}</p>
                              </div>
                            )}
                            {deliveryShipping && (
                              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                                <Badge variant="outline" className="mb-2 bg-indigo-100 text-indigo-700">
                                  <Package className="w-3 h-3 mr-1" />
                                  Postversand
                                </Badge>
                                <p className="text-xs text-gray-600">
                                  {shippingOptions.find((opt) => opt.value === shippingOption)?.label}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {description && (
                      <div className="mt-6 bg-white rounded-xl p-4 border border-purple-100">
                        <h4 className="font-bold text-purple-700 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Beschreibung
                        </h4>
                        <p className="text-gray-700 text-sm leading-relaxed">{description}</p>
                      </div>
                    )}

                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="mt-6 bg-white rounded-xl p-4 border border-purple-100">
                        <h4 className="font-bold text-purple-700 mb-3 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Bild
                        </h4>
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Vorschau"
                          className="w-48 h-48 object-cover rounded-xl border border-purple-200"
                        />
                      </div>
                    )}
                  </div>

                  {errors.submit && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-200">
                      <AlertCircle className="w-5 h-5" />
                      <span>{errors.submit}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between items-center pt-6 border-t border-orange-200">
            <div>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="border-2 border-orange-200 text-orange-600 hover:bg-orange-50 rounded-xl px-6 py-2 font-medium transition-all duration-200 bg-transparent"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Zurück
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-2 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl px-6 py-2 font-medium transition-all duration-200 bg-transparent"
              >
                Abbrechen
              </Button>

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-800 text-white rounded-xl px-8 py-2 font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  Weiter
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl px-8 py-2 font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Wird erstellt...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Angebot erstellen
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <GameSearchDialog open={isGameSearchOpen} onOpenChange={setIsGameSearchOpen} onGameSelect={handleGameSelect} />
    </>
  )
}
