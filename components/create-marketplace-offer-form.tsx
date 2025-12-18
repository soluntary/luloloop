"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FaTruckFast, FaLocationDot, FaUpload } from "react-icons/fa6"
import { FaInfo, FaArrowLeft, FaSearch, FaChevronDown } from "react-icons/fa"
import { AiFillPicture } from "react-icons/ai"
import { ImageIcon, AlertCircle, Check, Plus, Info, Trash2, ArrowRight } from "lucide-react"
import { useGames } from "@/contexts/games-context"
import { useAuth } from "@/contexts/auth-context"

import { GameSearchDialog } from "./game-search-dialog"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { getPostalCodeAndCity } from "@/lib/utils"

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
  initialStep?: number
}

export function CreateMarketplaceOfferForm({
  isOpen,
  onClose,
  onSuccess,
  preselectedGame = null,
  preselectedOfferType = "",
  initialStep = 1,
}: CreateMarketplaceOfferFormProps) {
  const { games, addMarketplaceOffer, addGame } = useGames()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isGameSearchOpen, setIsGameSearchOpen] = useState(false)

  // Form data
  const [selectedGame, setSelectedGame] = useState<string>(preselectedGame?.id || "")
  const [customGameTitle, setCustomGameTitle] = useState("")
  const [customGamePublisher, setCustomGamePublisher] = useState("")

  const [publisherOptions, setPublisherOptions] = useState<string[]>(PUBLISHER_OPTIONS)

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
  const [minRentalDays, setMinRentalDays] = useState("")
  const [maxRentalDays, setMaxRentalDays] = useState("")
  const [salePrice, setSalePrice] = useState("")
  const [deliveryPickup, setDeliveryPickup] = useState(false)
  const [deliveryShipping, setDeliveryShipping] = useState(false)
  // REMOVED: const [shippingOption, setShippingOption] = useState("")
  const [pickupAddress, setPickupAddress] = useState("")
  const [showFullAddress, setShowFullAddress] = useState(false)
  const [condition, setCondition] = useState("")
  const [price, setPrice] = useState("")
  const [openToSuggestions, setOpenToSuggestions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [databaseConnected, setDatabaseConnected] = useState(true)

  const [isManualEntry, setIsManualEntry] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (preselectedGame) {
        setSelectedGame(preselectedGame.id || "")
        setImagePreview(preselectedGame.image || "")
        setCurrentStep(2)
        setIsManualEntry(false)

        // If condition is not set when starting at step 2, initialize it
        // This prevents validation errors when going back to step 1
        if (!condition) {
          // Don't set a default value, but ensure it's required in step 2
        }
      } else {
        setCurrentStep(initialStep)
        setIsManualEntry(false)
      }

      if (preselectedOfferType) {
        setOfferType(preselectedOfferType as "lend" | "trade" | "sell")
      }
    }
  }, [isOpen, preselectedGame, preselectedOfferType, initialStep])

  useEffect(() => {
    if (deliveryPickup && user) {
      console.log("[v0] User profile data:", {
        address: user.address,
      })

      if (user.address && user.address.trim() !== "") {
        setPickupAddress(user.address)
        console.log("[v0] Pickup address from profile:", user.address)
      } else {
        const message = "Bitte Adresse im Profil vervollständigen"
        setPickupAddress(message)
        console.log("[v0] No address in profile")
      }
    } else if (!deliveryPickup) {
      setPickupAddress("")
    }
  }, [deliveryPickup, user])

  // REMOVED: const shippingOptions = [
  //   { value: "postpac-a-2kg", label: "PostPac Economy (A-Post) bis 2 kg: CHF 10.50" },
  //   { value: "postpac-b-2kg", label: "PostPac Economy (B-Post) bis 2 kg: CHF 8.50" },
  //   { value: "postpac-a-10kg", label: "PostPac Economy (A-Post) bis 10 kg: CHF 13.50" },
  //   { value: "postpac-b-10kg", label: "PostPac Economy (B-Post) bis 10 kg: CHF 11.50" },
  //   { value: "postpac-a-30kg", label: "PostPac Economy (A-Post) bis 30 kg: CHF 22.50" },
  //   { value: "postpac-b-30kg", label: "PostPac Economy (B-Post) bis 30 kg: CHF 20.50" },
  // ]

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

    if (game.publishers && game.publishers.length > 0) {
      const publisher = game.publishers[0]
      console.log("[v0] Processing publisher:", publisher)
      console.log("[v0] Current publisherOptions:", publisherOptions)

      const matchingPublisher = publisherOptions.find((option) => option.toLowerCase() === publisher.toLowerCase())
      console.log("[v0] Publisher in options?", !!matchingPublisher)

      if (matchingPublisher) {
        setCustomGamePublisher(matchingPublisher)
        console.log("[v0] Set existing publisher:", matchingPublisher)
      } else {
        const newOptions = [...publisherOptions, publisher]
        setPublisherOptions(newOptions)
        setCustomGamePublisher(publisher)
        console.log("[v0] Adding new publisher to options:", publisher)
        console.log("[v0] Set new publisher:", publisher)
      }
      console.log("[v0] Updated publisherOptions:", publisherOptions)
    }

    if (game.minPlayers && game.maxPlayers) {
      const playerCount = `${game.minPlayers} bis ${game.maxPlayers} Personen`
      const matchingOption = PLAYER_COUNT_OPTIONS.find((option) => {
        const match = option.match(/(\d+) bis (\d+) Personen/)
        if (match) {
          const [, min, max] = match
          return Number.parseInt(min) <= game.minPlayers && Number.parseInt(max) >= game.maxPlayers
        }
        return false
      })
      // Use matching option if found, otherwise use the generated string
      setCustomGamePlayerCount(matchingOption || playerCount)
    }

    if (game.playingTime) {
      let durationOption = ""
      if (game.playingTime < 10) durationOption = "< 10 Min."
      else if (game.playingTime <= 20) durationOption = "10-20 Min."
      else if (game.playingTime <= 30) durationOption = "20-30 Min."
      else if (game.playingTime <= 45) durationOption = "30-45 Min."
      else if (game.playingTime <= 60) durationOption = "45-60 Min."
      else if (game.playingTime <= 90) durationOption = "60-90 Min."
      else durationOption = "> 90 Min."

      setCustomGameDuration(durationOption)
    }

    if (game.minAge) {
      let ageOption = ""
      if (game.minAge <= 4) ageOption = "bis 4 Jahren"
      else if (game.minAge <= 5) ageOption = "ab 4 bis 5 Jahren"
      else if (game.minAge <= 7) ageOption = "ab 6 bis 7 Jahren"
      else if (game.minAge <= 9) ageOption = "ab 8 bis 9 Jahren"
      else if (game.minAge <= 11) ageOption = "ab 10 bis 11 Jahren"
      else if (game.minAge <= 13) ageOption = "ab 12 bis 13 Jahren"
      else if (game.minAge <= 17) ageOption = "ab 14 bis 17 Jahren"
      else ageOption = "ab 18 Jahren"

      setCustomGameAge(ageOption)
    }

    setCustomGameLanguage("Deutsch") // Default language

    if (game.categories && game.categories.length > 0) {
      const mappedTypes: string[] = []
      game.categories.forEach((category: string) => {
        if (category.includes("Card")) mappedTypes.push("Kartenspiel")
        else if (category.includes("Dice")) mappedTypes.push("Würfelspiel")
        else if (category.includes("Party")) mappedTypes.push("Partyspiel")
        else if (category.includes("Strategy")) mappedTypes.push("Brettspiel")
        else if (category.includes("Family")) mappedTypes.push("Brettspiel")
      })
      if (mappedTypes.length === 0) mappedTypes.push("Brettspiel")
      setCustomGameType([...new Set(mappedTypes)])
    }

    if (game.mechanics && game.mechanics.length > 0) {
      const mappedStyles: string[] = []
      game.mechanics.forEach((mechanic: string) => {
        if (mechanic.includes("Cooperative")) mappedStyles.push("Kooperativ")
        else if (mechanic.includes("Solo")) mappedStyles.push("Solospiel")
        else if (mechanic.includes("Team")) mappedStyles.push("Team vs. Team")
        else mappedStyles.push("Kompetitiv") // Default
      })
      if (mappedStyles.length === 0) mappedStyles.push("Kompetitiv")
      setCustomGameStyle([...new Set(mappedStyles)])
    }

    setCustomGameImage(game.image || null)

    // Clear any existing game selection and enable custom game mode
    setSelectedGame("")
    setIsManualEntry(true) // Ensure manual entry is active after BGG search

    // Clear validation errors
    setErrors({})

    // Close the search dialog
    setIsGameSearchOpen(false)

    console.log("[v0] Game data filled into form")
  }

  const handleGameSelection = (gameId: string) => {
    setSelectedGame(gameId)

    if (gameId) {
      // Find the selected game and use its image
      const selectedGameData = games.find((g) => g.id === gameId)
      if (selectedGameData?.image) {
        setImagePreview(selectedGameData.image)
        // Clear any uploaded file since we're using the game's image
        setImage(null)
      }
      setIsManualEntry(false) // Reset manual entry when a game is selected from the list
    } else {
      // If no game selected, clear the image preview
      setImagePreview("")
      setImage(null)
    }
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
    setMinRentalDays("")
    setMaxRentalDays("")
    setSalePrice("")
    setDeliveryPickup(false)
    setDeliveryShipping(false)
    // REMOVED: setShippingOption("")
    setPickupAddress("")
    setShowFullAddress(false) // Reset the new state
    setCurrentStep(initialStep) // Reset to initial step
    setErrors({})
    setCondition("")
    setPrice("")
    setOpenToSuggestions(false)
    setIsManualEntry(false) // Reset manual entry state on form reset
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

      if (isManualEntry) {
        if (!customGameTitle.trim()) {
          newErrors.customGameTitle = "Spieltitel ist erforderlich"
        }

        if (customGamePublisher === "Andere" && !customGameCustomPublisher.trim()) {
          newErrors.customGameCustomPublisher = "Bitte gib den Verlag an."
        } else if (customGamePublisher !== "Andere" && !customGamePublisher) {
          newErrors.customGamePublisher = "Verlag ist erforderlich"
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
        if (customGameLanguage === "Andere" && !customGameCustomLanguage.trim()) {
          newErrors.customGameCustomLanguage = "Bitte gib die Sprache an."
        } else if (customGameLanguage !== "Andere" && !customGameLanguage) {
          newErrors.customGameLanguage = "Sprache ist erforderlich"
        }

        if (!condition) {
          newErrors.condition = "Zustand ist erforderlich"
        }
      } else if (!isManualEntry && selectedGame) {
        // It will be required in step 2 instead
        // This allows users to skip step 1 when starting at step 2 with preselected game
      } else {
        if (!selectedGame && !isManualEntry) {
          newErrors.selectedGame = "Bitte wähle ein Spiel aus oder erstelle ein neues"
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
          newErrors.price = "Bitte gib Preis/Bedingungen oder Mietgebühren an."
        }

        console.log("[v0] Validating lend-specific fields - dailyRates:", {
          dailyRate1Day,
          dailyRate2To6Days,
          dailyRate7To30Days,
          dailyRateOver30Days,
        })

        // Only show daily rates error if no price and no daily rates
        if (!price && !hasAnyDailyRate) {
          newErrors.dailyRates = "Bitte gib mindestens eine Mietgebühr an."
        }

        if (minRentalDays && maxRentalDays) {
          const minDays = Number.parseInt(minRentalDays)
          const maxDays = Number.parseInt(maxRentalDays)

          if (minDays < 1) {
            newErrors.minRentalDays = "Mindestmietdauer muss mindestens 1 Tag sein."
          }
          if (maxDays < 1) {
            newErrors.maxRentalDays = "Maximalmietdauer muss mindestens 1 Tag sein."
          }
          if (minDays > maxDays) {
            newErrors.maxRentalDays = "Maximalmietdauer muss größer als Mindestmietdauer sein."
          }
        }
      }

      if (offerType === "trade" && !openToSuggestions && !price.trim()) {
        newErrors.price = "Bitte gib eine Tauschbedingung an."
      }

      if (!deliveryPickup && !deliveryShipping) {
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
          newErrors.dailyRates = "Bitte gib mindestens eine Mietgebühr an."
        }
        // REMOVED: shipping option validation
        if (deliveryPickup && !pickupAddress) {
          newErrors.pickupAddress = "Bitte gib die Abholadresse an."
        }
      }

      if (offerType === "sell") {
        console.log("[v0] Validating sell-specific fields - salePrice:", salePrice)
        if (!salePrice) {
          newErrors.salePrice = "Bitte gib den Verkaufspreis an."
        }
        // REMOVED: shipping option validation
        if (deliveryPickup && !pickupAddress) {
          newErrors.pickupAddress = "Bitte gib die Abholadresse an."
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

      // Adjust submission logic for custom game creation
      if (isManualEntry && !selectedGame && customGameTitle) {
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

      const finalPickupAddress = deliveryPickup
        ? showFullAddress
          ? pickupAddress
          : getPostalCodeAndCity(pickupAddress)
        : ""

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
        location: finalPickupAddress,
        distance: "", // Default empty distance
        pickup_available: deliveryPickup,
        shipping_available: deliveryShipping,
        pickup_address: finalPickupAddress,
        show_full_address: showFullAddress, // ADDED
        // REMOVED: shipping_options: deliveryShipping ? { option: shippingOption } : null,
        shipping_options: null, // Set to null as shipping details are no longer collected
        ...(offerType === "lend" && minRentalDays && { min_rental_days: Number.parseInt(minRentalDays) }),
        ...(offerType === "lend" && maxRentalDays && { max_rental_days: Number.parseInt(maxRentalDays) }),
      }

      console.log("[v0] Offer data to be submitted:", offerData)

      console.log("[v0] About to call addMarketplaceOffer...")
      console.log("[v0] Database connected:", databaseConnected)
      console.log("[v0] User authenticated:", !!user)

      await addMarketplaceOffer(offerData)
      console.log("[v0] Marketplace offer created successfully")

      resetForm()
      onSuccess?.()
      onClose()
      console.log("[v0] Form submission completed successfully")
    } catch (error) {
      console.error("[v0] Error during form submission:", error)
      console.error("[v0] Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      })

      setError(error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten")
    } finally {
      console.log("[v0] Form submission finally block - setting isSubmitting to false")
      setIsSubmitting(false)
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Schritt 1: Spielauswahl"
      case 2:
        return "Schritt 2: Anzeigendetails"
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
        return "oder Wunschspiel eingeben"
      case "sell":
        return "Verkaufspreis (CHF)"
      default:
        return "Preis"
    }
  }

  const getPricePlaceholder = () => {
    switch (offerType) {
      case "lend":
        return "z.B. Kostenlose Miete gegen Pfand"
      case "trade":
        return "z.B. Die Siedler von Catan "
      case "sell":
        return "z.B. 25.00"
      default:
        return "Preis eingeben..."
    }
  }

  return (
    <>
      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="space-y-6 p-0">
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">{getStepTitle()}</h3>
            {/* Update step indicator colors to teal */}
            <div className="flex items-center justify-center space-x-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      step <= currentStep
                        ? "bg-teal-600 text-white"
                        : "bg-gray-100 text-gray-400 border border-gray-300"
                    }`}
                  >
                    {step < currentStep ? <Check className="w-4 h-4" /> : step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-12 h-0.5 mx-2 transition-all ${step < currentStep ? "bg-teal-600" : "bg-gray-200"}`}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-gray-600 text-xs mt-3">Schritt {currentStep} von 3</p>
          </div>

          {/* Step 1: Game Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-gray-900 mb-4 font-normal text-xs">Spiel auswählen</h3>

                <div className="space-y-4">
                  <div>
                    {/* Update input focus colors to teal */}
                    <Select value={selectedGame} onValueChange={handleGameSelection}>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-teal-500 rounded-lg bg-white">
                        <SelectValue placeholder="Spiel aus deiner Ludothek wählen..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-gray-200">
                        {games.map((game) => (
                          <SelectItem key={game.id} value={game.id} className="rounded-md">
                            <div className="flex items-center gap-3">
                              {game.image && (
                                <img
                                  src={game.image || "/placeholder.svg"}
                                  alt={game.title}
                                  className="w-8 h-8 object-cover rounded"
                                />
                              )}
                              <div>
                                <p className="font-medium text-sm">{game.title}</p>
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
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-4 text-gray-600 font-medium">oder</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                      <Checkbox
                        id="custom-game"
                        checked={isManualEntry}
                        onCheckedChange={(checked) => {
                          setIsManualEntry(checked === true)
                          if (checked) {
                            setSelectedGame("")
                            setImagePreview("")
                            setImage(null)
                          }
                        }}
                        className="border-gray-400 data-[state=checked]:bg-gray-900"
                      />
                      <Label htmlFor="custom-game" className="font-medium text-sm text-gray-900 cursor-pointer">
                        Neues Spiel erfassen
                      </Label>
                    </div>

                    {isManualEntry && (
                      <div className="space-y-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            console.log("[v0] BoardGameGeek search button clicked")
                            console.log("[v0] selectedGame:", selectedGame)
                            console.log("[v0] Setting isGameSearchOpen to true")
                            setIsGameSearchOpen(true)
                          }}
                          className="w-full h-11 border-gray-300 text-gray-800 hover:bg-gray-100 hover:border-gray-900 transition-colors rounded-lg font-medium"
                        >
                          <FaSearch className="w-4 h-4 mr-2" />
                          Spiel in der Datenbank suchen
                        </Button>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="bg-white px-4 text-gray-600 font-medium">oder manuell erfassen</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Custom Game Form */}
              {isManualEntry && (
                <div className="space-y-6">
                  {/* Game Cover Section */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">Spiel Cover</h3>
                    <div className="text-center">
                      {/* Update upload hover to teal */}
                      <div className="w-40 h-52 mx-auto mb-4 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden hover:border-teal-500 transition-all duration-300 shadow-sm hover:shadow-md">
                        {customGameImage ? (
                          <img
                            src={customGameImage || "/placeholder.svg"}
                            alt="Spiel Cover"
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <div className="text-center">
                            <AiFillPicture className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                            <p className="text-xs text-gray-600 font-medium">Cover hochladen</p>
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
                        className="w-full h-11 border-gray-300 text-gray-800 hover:bg-gray-100 hover:border-gray-900 transition-colors rounded-lg font-medium"
                        disabled={!!selectedGame}
                      >
                        <FaUpload className="w-4 h-4 mr-2" />
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
                  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">Grundinformationen</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-semibold text-gray-700 mb-2 block">Spielname *</Label>
                        <Input
                          value={customGameTitle}
                          onChange={(e) => setCustomGameTitle(e.target.value)}
                          placeholder="z.B. Die Siedler von Catan"
                          className="h-11 border-gray-300 focus:border-teal-500 rounded-lg bg-white"
                          disabled={!!selectedGame}
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-semibold text-gray-700 mb-2 block">Verlag *</Label>
                        <Select
                          value={customGamePublisher}
                          onValueChange={setCustomGamePublisher}
                          disabled={!!selectedGame}
                        >
                          <SelectTrigger className="h-11 border-gray-300 focus:border-teal-500 rounded-lg bg-white">
                            <SelectValue placeholder="Verlag wählen..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            {publisherOptions.map((publisher) => (
                              <SelectItem key={publisher} value={publisher} className="rounded-md">
                                {publisher}
                              </SelectItem>
                            ))}
                            <SelectItem value="custom" className="font-bold text-blue-600 rounded-md">
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
                              className="h-10 border-gray-300 rounded-lg bg-white"
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
                              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-xs font-semibold text-gray-700 mb-2 block">Sprache *</Label>
                        <Select
                          value={customGameLanguage}
                          onValueChange={setCustomGameLanguage}
                          disabled={!!selectedGame}
                        >
                          <SelectTrigger className="h-11 border-gray-300 focus:border-teal-500 rounded-lg bg-white">
                            <SelectValue placeholder="Sprache wählen..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            {LANGUAGE_OPTIONS.map((language) => (
                              <SelectItem
                                key={language}
                                value={language === "Andere" ? "custom" : language}
                                className="rounded-md"
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
                              className="h-10 border-gray-300 rounded-lg bg-white"
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
                              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3"
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

                  {/* Game Details Section */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">Spieldetails</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs font-semibold text-gray-700 mb-2 block">Spieleranzahl *</Label>
                        <Select
                          value={customGamePlayerCount}
                          onValueChange={setCustomGamePlayerCount}
                          disabled={!!selectedGame}
                        >
                          <SelectTrigger className="h-11 border-gray-300 focus:border-teal-500 rounded-lg bg-white">
                            <SelectValue placeholder="Spieleranzahl wählen..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            {PLAYER_COUNT_OPTIONS.map((count) => (
                              <SelectItem key={count} value={count} className="rounded-md">
                                {count}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-700 mb-2 block">Spieldauer *</Label>
                        <Select
                          value={customGameDuration}
                          onValueChange={setCustomGameDuration}
                          disabled={!!selectedGame}
                        >
                          <SelectTrigger className="h-11 border-gray-300 focus:border-teal-500 rounded-lg bg-white">
                            <SelectValue placeholder="Spieldauer wählen..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            {DURATION_OPTIONS.map((duration) => (
                              <SelectItem key={duration} value={duration} className="rounded-md">
                                {duration}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-700 mb-2 block">Altersempfehlung *</Label>
                        <Select value={customGameAge} onValueChange={setCustomGameAge} disabled={!!selectedGame}>
                          <SelectTrigger className="h-11 border-gray-300 focus:border-teal-500 rounded-lg bg-white">
                            <SelectValue placeholder="Altersempfehlung wählen..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            {AGE_OPTIONS.map((age) => (
                              <SelectItem key={age} value={age} className="rounded-md">
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

                  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      Kategorien & Typus
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs font-semibold text-gray-700 mb-2 block">
                          Kategorie * (Mehrfachauswahl)
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between h-11 border-gray-300 focus:border-teal-500 rounded-lg bg-white"
                              type="button"
                              disabled={!!selectedGame}
                            >
                              {customGameType.length > 0 ? (
                                <span className="text-blue-600 font-medium">
                                  {customGameType.length} Kategorie{customGameType.length > 1 ? "n" : ""} ausgewählt
                                </span>
                              ) : (
                                "Kategorie wählen..."
                              )}
                              <FaChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0">
                            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                              <h4 className="font-medium text-xs text-gray-700">Kategorie auswählen:</h4>
                              {GAME_TYPE_OPTIONS.map((type) => (
                                <div key={type} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`custom-type-${type}`}
                                    checked={customGameType.includes(type)}
                                    onCheckedChange={() => handleCustomGameTypeToggle(type)}
                                    className="border-gray-400 data-[state=checked]:bg-blue-600"
                                  />
                                  <Label htmlFor={`custom-type-${type}`} className="text-xs cursor-pointer">
                                    {type}
                                  </Label>
                                </div>
                              ))}
                              <div className="border-t pt-2 mt-2">
                                <h5 className="font-medium text-xs text-gray-600 mb-2">Eigene Kategorie hinzufügen:</h5>
                                <div className="flex gap-2">
                                  <Input
                                    value={customGameCustomType}
                                    onChange={(e) => setCustomGameCustomType(e.target.value)}
                                    placeholder="Kategorie eingeben..."
                                    className="text-xs border-gray-300"
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
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-2"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              {customGameType.length > 0 && (
                                <div className="border-t pt-2 mt-2">
                                  <h5 className="font-medium text-xs text-gray-600 mb-2">Ausgewählt:</h5>
                                  <div className="flex flex-wrap gap-1">
                                    {customGameType.map((type) => (
                                      <Badge
                                        key={type}
                                        className="text-xs cursor-pointer bg-blue-100 text-blue-700 hover:bg-blue-200"
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
                        {errors.customGameType && (
                          <div className="flex items-center space-x-2 text-red-600 text-sm mt-3 bg-red-50 p-2 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.customGameType}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs font-semibold text-gray-700 mb-2 block">
                          Typus * (Mehrfachauswahl)
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between h-11 border-gray-300 focus:border-teal-500 rounded-lg bg-white"
                              type="button"
                              disabled={!!selectedGame}
                            >
                              {customGameStyle.length > 0 ? (
                                <span className="text-blue-600 font-medium">
                                  {customGameStyle.length} Typus {customGameStyle.length > 1 ? "en" : ""} ausgewählt
                                </span>
                              ) : (
                                "Typus wählen..."
                              )}
                              <FaChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0">
                            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                              <h4 className="font-medium text-xs text-gray-700">Typus auswählen:</h4>
                              {GAME_STYLE_OPTIONS.map((style) => (
                                <div key={style} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`custom-style-${style}`}
                                    checked={customGameStyle.includes(style)}
                                    onCheckedChange={() => handleCustomGameStyleToggle(style)}
                                    className="border-gray-400 data-[state=checked]:bg-blue-600"
                                  />
                                  <Label htmlFor={`custom-style-${style}`} className="text-xs cursor-pointer">
                                    {style}
                                  </Label>
                                </div>
                              ))}
                              <div className="border-t pt-2 mt-2">
                                <h5 className="font-medium text-xs text-gray-600 mb-2">Eigenen Typus hinzufügen:</h5>
                                <div className="flex gap-2">
                                  <Input
                                    value={customGameCustomStyle}
                                    onChange={(e) => setCustomGameCustomStyle(e.target.value)}
                                    placeholder="Typus eingeben..."
                                    className="text-xs border-gray-300"
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
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-2"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              {customGameStyle.length > 0 && (
                                <div className="border-t pt-2 mt-2">
                                  <h5 className="font-medium text-xs text-gray-600 mb-2">Ausgewählt:</h5>
                                  <div className="flex flex-wrap gap-1">
                                    {customGameStyle.map((style) => (
                                      <Badge
                                        key={style}
                                        className="text-xs cursor-pointer bg-blue-100 text-blue-700 hover:bg-blue-200"
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
                        {errors.customGameStyle && (
                          <div className="flex items-center space-x-2 text-red-600 text-sm mt-3 bg-red-50 p-2 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.customGameStyle}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Offer Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-6 text-sm">Angebots-Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Offer Type */}
                  <div>
                    <Label className="text-xs font-semibold text-gray-700 mb-2 block">Angebotsart *</Label>
                    <Select value={offerType} onValueChange={(value: "lend" | "trade" | "sell") => setOfferType(value)}>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-teal-500 rounded-lg bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        <SelectItem value="lend" className="rounded-md">
                          <div className="flex items-center gap-2">Mietangebot</div>
                        </SelectItem>
                        <SelectItem value="trade" className="rounded-md">
                          <div className="flex items-center gap-2">Tauschangebot</div>
                        </SelectItem>
                        <SelectItem value="sell" className="rounded-md">
                          <div className="flex items-center gap-2">Verkaufsangebot</div>
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
                    <Label className="text-xs font-semibold text-gray-700 mb-2 block">Zustand *</Label>
                    <Select value={condition} onValueChange={setCondition}>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-teal-500 rounded-lg bg-white">
                        <SelectValue placeholder="Zustand auswählen..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        <SelectItem value="Neu, ungeöffnet" className="rounded-md">
                          <div className="flex items-center gap-2">Neu, ungeöffnet</div>
                        </SelectItem>
                        <SelectItem value="Neuwertig" className="rounded-md">
                          <div className="flex items-center gap-2">Neuwertig</div>
                        </SelectItem>
                        <SelectItem value="Gut" className="rounded-md">
                          <div className="flex items-center gap-2">Gut</div>
                        </SelectItem>
                        <SelectItem value="Gebraucht" className="rounded-md">
                          <div className="flex items-center gap-2">Gebraucht</div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.condition && (
                      <div className="flex items-center space-x-2 text-red-600 text-sm mt-2 bg-red-50 p-2 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs">{errors.condition}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Lending specific fields */}
              {offerType === "lend" && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4 text-sm">Mietkonditionen *</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Daily Rates */}
                    <div>
                      <Label className="text-xs font-semibold text-gray-700 mb-2 block">Tagespreise (CHF) *</Label>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-gray-600 mb-1 block">1 Tag</Label>
                          <Input
                            placeholder="z.B. 5.00"
                            value={dailyRate1Day}
                            onChange={(e) => setDailyRate1Day(e.target.value)}
                            className="h-10 border-gray-300 focus:border-teal-500 rounded-lg bg-white"
                            type="number"
                            step="0.01"
                            min="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600 mb-1 block">2-6 Tage</Label>
                          <Input
                            placeholder="z.B. 4.00"
                            value={dailyRate2To6Days}
                            onChange={(e) => setDailyRate2To6Days(e.target.value)}
                            className="h-10 border-gray-300 focus:border-teal-500 rounded-lg bg-white"
                            type="number"
                            step="0.01"
                            min="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600 mb-1 block">7-30 Tage</Label>
                          <Input
                            placeholder="z.B. 3.00"
                            value={dailyRate7To30Days}
                            onChange={(e) => setDailyRate7To30Days(e.target.value)}
                            className="h-10 border-gray-300 focus:border-teal-500 rounded-lg bg-white"
                            type="number"
                            step="0.01"
                            min="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600 mb-1 block">Über 30 Tage</Label>
                          <Input
                            placeholder="z.B. 2.00"
                            value={dailyRateOver30Days}
                            onChange={(e) => setDailyRateOver30Days(e.target.value)}
                            className="h-10 border-gray-300 focus:border-teal-500 rounded-lg bg-white"
                            type="number"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>
                      {errors.dailyRates && (
                        <div className="flex items-center space-x-2 text-red-600 text-sm mt-2 bg-red-50 p-2 rounded-lg">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-xs">{errors.dailyRates}</span>
                        </div>
                      )}
                    </div>

                    {/* Rental Duration */}
                    <div>
                      <Label className="text-xs font-semibold text-gray-700 mb-2 block">Mietzeit</Label>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-gray-600 mb-1 block">Mindestmietzeit (Tage)</Label>
                          <Input
                            placeholder="z.B. 1"
                            value={minRentalDays}
                            onChange={(e) => setMinRentalDays(e.target.value)}
                            className="h-10 border-gray-300 focus:border-teal-500 rounded-lg bg-white"
                            type="number"
                            min="1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600 mb-1 block">Maximalmietzeit (Tage)</Label>
                          <Input
                            placeholder="z.B. 30"
                            value={maxRentalDays}
                            onChange={(e) => setMaxRentalDays(e.target.value)}
                            className="h-10 border-gray-300 focus:border-teal-500 rounded-lg bg-white"
                            type="number"
                            min="1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Selling specific fields */}
              {offerType === "sell" && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4 text-sm">Verkaufsbedingungen</h4>

                  <div>
                    <Label className="text-xs font-semibold text-gray-700 mb-2 block">Verkaufspreis (CHF) *</Label>
                    <Input
                      placeholder="z.B. 25.00"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      className="h-11 border-gray-300 focus:border-teal-500 rounded-lg bg-white"
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
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4 text-sm">Tauschbedingung</h4>

                  <div className="mb-4">
                    <div className="flex items-center space-x-3 text-xs">
                      <input
                        type="checkbox"
                        id="openToSuggestions"
                        checked={openToSuggestions}
                        onChange={(e) => setOpenToSuggestions(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <Label htmlFor="openToSuggestions" className="flex items-center gap-2 text-sm cursor-pointer">
                        Offen für Vorschläge
                      </Label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-7">Ich bin offen für Tauschvorschläge</p>
                  </div>

                  {!openToSuggestions && (
                    <div>
                      <Label className="text-xs font-semibold text-gray-700 mb-2 block">{getPriceLabel()}</Label>
                      <Input
                        placeholder={getPricePlaceholder()}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="h-11 border-gray-300 focus:border-teal-500 rounded-lg bg-white"
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
                    <div className="text-blue-800 font-medium text-xs">
                      <p className="text-blue-800 font-medium">
                        Du bist offen für Tauschvorschläge. Andere Mitglieder können dir Spiele zum Tausch anbieten.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                  Welche Zustelloption bietest du an? *
                </h4>

                <div className="space-y-4">
                  {/* Pickup Option */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3 text-xs">
                      <Checkbox
                        id="pickup"
                        checked={deliveryPickup}
                        onCheckedChange={(checked) => {
                          console.log(
                            "[v0] Pickup checkbox clicked - checked:",
                            checked,
                            "current state:",
                            deliveryPickup,
                          )
                          setDeliveryPickup(checked === true)
                        }}
                        className="border-gray-400 data-[state=checked]:bg-blue-600"
                      />
                      <Label htmlFor="pickup" className="flex items-center gap-2 text-sm cursor-pointer">
                        <FaLocationDot className="w-4 h-4" />
                        Abholung
                      </Label>
                    </div>

                    {deliveryPickup && (
                      <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                          <FaInfo className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0" />
                          <p className="text-xs text-blue-700">
                            Standardmässig zeigen wir nur die Postleitzahl und den Ort an. Wenn du die vollständige
                            Adresse anzeigen lassen möchtest, setze bitte einen Haken im Kasten.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-xs">In</span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              pickupAddress.includes("unvollständig") || pickupAddress.includes("vervollständigen")
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {pickupAddress
                              ? showFullAddress
                                ? pickupAddress
                                : getPostalCodeAndCity(pickupAddress)
                              : "Adresse wird geladen..."}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 text-xs">
                          <Checkbox
                            id="showFullAddress"
                            checked={showFullAddress}
                            onCheckedChange={(checked) => setShowFullAddress(checked === true)}
                            className="border-gray-400 data-[state=checked]:bg-blue-600"
                          />
                          <Label htmlFor="showFullAddress" className="text-sm cursor-pointer text-gray-700">
                            Vollständige Adresse anzeigen
                          </Label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Shipping Option */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3 text-xs">
                      <Checkbox
                        id="shipping"
                        checked={deliveryShipping}
                        onCheckedChange={(checked) => {
                          console.log(
                            "[v0] Shipping checkbox clicked - checked:",
                            checked,
                            "current state:",
                            deliveryShipping,
                          )
                          setDeliveryShipping(checked === true)
                        }}
                        className="border-gray-400 data-[state=checked]:bg-blue-600"
                      />
                      <Label
                        htmlFor="shipping"
                        className="flex items-center gap-2 text-sm cursor-pointer flex items-center gap-2"
                      >
                        <FaTruckFast className="w-4 h-4" />
                        Postversand (Kosten zu Lasten der{" "}
                        {offerType === "lend" ? "Mieter*in" : offerType === "sell" ? "Käufer*in" : "Tauschpartner*in"})
                      </Label>
                    </div>
                  </div>
                </div>

                {errors.delivery && (
                  <div className="flex items-center space-x-2 text-red-600 text-sm mt-4 bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs">{errors.delivery}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">Beschreibung</h4>
                <RichTextEditor
                  placeholder="Zusätzliche Informationen zum Spiel oder Angebot..."
                  value={description}
                  onChange={setDescription}
                  className="border-2 border-gray-300 focus:border-teal-500 rounded-lg bg-white"
                  rows={4}
                  maxLength={2000}
                />
              </div>

              {selectedGame && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-blue-800 text-xs">
                      Das Spiel-Cover wird automatisch für die Anzeige verwendet. Gerne darfst du hier ein anderes Bild
                      hochladen.
                    </p>
                  </div>
                </div>
              )}

              {/* Image Upload */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">Bild</h4>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Vorschau"
                        className="w-full h-64 object-cover rounded-xl"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-3 right-3 rounded-full w-8 h-8 p-0 bg-white hover:bg-gray-100 shadow-lg border border-gray-200"
                        onClick={removeImage}
                      >
                        <Trash2 className="w-4 h-4 text-gray-700" />
                      </Button>
                      {selectedGame && !image && (
                        <div className="absolute bottom-3 left-3 bg-green-100 text-green-800 px-2 py-1 rounded-lg text-xs font-medium">
                          Spielbild
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium mb-2">
                        {selectedGame ? "Zusätzliches Bild hochladen" : "Bild hochladen"}
                      </p>

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
                        className="w-full h-11 border-gray-300 text-gray-800 hover:bg-gray-100 hover:border-gray-900 transition-colors rounded-lg font-medium"
                      >
                        <FaUpload className="w-4 h-4 mr-2" />
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
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-lg">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">Angebots-Zusammenfassung</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Game Information */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 justify-start text-sm">
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
                        <span className="font-medium">{condition}</span>
                      </div>
                    </div>
                  </div>

                  {/* Offer Information */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                      Angebots-Informationen
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Angebotsart:</span>
                        <span className="font-medium">
                          {offerType === "lend"
                            ? "Mietangebot"
                            : offerType === "trade"
                              ? "Tauschangebot"
                              : "Verkaufsangebot"}
                        </span>
                      </div>

                      {offerType === "sell" && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Verkaufspreis:</span>
                          <span className="font-medium">CHF {salePrice}</span>
                        </div>
                      )}

                      {offerType === "trade" && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tauschbedingungen:</span>
                          <span className="font-medium">{openToSuggestions ? "Offen für Vorschläge" : price}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {offerType === "lend" && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">Mietkonditionen</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-600 block mb-2">Tagespreise:</span>
                          <div className="space-y-1 text-sm">
                            {dailyRate1Day && <p>1 Tag: CHF {dailyRate1Day}</p>}
                            {dailyRate2To6Days && <p>2-6 Tage: CHF {dailyRate2To6Days}</p>}
                            {dailyRate7To30Days && <p>7-30 Tage: CHF {dailyRate7To30Days}</p>}
                            {dailyRateOver30Days && <p>Über 30 Tage: CHF {dailyRateOver30Days}</p>}
                            {!dailyRate1Day && !dailyRate2To6Days && !dailyRate7To30Days && !dailyRateOver30Days && (
                              <p className="text-orange-600 font-medium">Kostenlose Miete</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 block mb-2">Mietzeit:</span>
                          <div className="space-y-1 text-sm">
                            {minRentalDays && <p>Min: {minRentalDays} Tage</p>}
                            {maxRentalDays && <p>Max: {maxRentalDays} Tage</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delivery Options */}
                  <div className="md:col-span-2 bg-white rounded-xl p-4 border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">Zustellungsoptionen</h4>
                    <div className="space-y-3">
                      {deliveryPickup && (
                        <div className="flex items-start gap-2">
                          <FaLocationDot className="w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Abholung in{" "}
                              <span className="text-blue-600 font-medium">
                                {showFullAddress ? pickupAddress : getPostalCodeAndCity(pickupAddress)}
                              </span>
                            </p>
                          </div>
                        </div>
                      )}
                      {deliveryShipping && (
                        <div className="flex items-start gap-2">
                          <FaTruckFast className="w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Postversand (Kosten zu Lasten der{" "}
                              {offerType === "lend"
                                ? "Leihnehmer*innen"
                                : offerType === "sell"
                                  ? "Käufer*innen"
                                  : "Tauschpartner*innen"}
                              )
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {description && (
                  <div className="mt-6 bg-white rounded-xl p-4 border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">Beschreibung</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">{description}</p>
                  </div>
                )}

                {/* Image Preview */}
                {imagePreview && (
                  <div className="mt-6 bg-white rounded-xl p-4 border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">Bild</h4>
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Vorschau"
                      className="w-48 h-48 object-cover rounded-xl border border-gray-200"
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

      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <div>
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-6 py-2 font-medium transition-all duration-200 bg-transparent"
            >
              <FaArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-2 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg px-6 py-2 font-medium transition-all duration-200 bg-transparent"
          >
            Abbrechen
          </Button>

          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-8 py-2 font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Weiter
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg px-8 py-2 font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100"
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

      <GameSearchDialog open={isGameSearchOpen} onOpenChange={setIsGameSearchOpen} onGameSelect={handleGameSelect} />
    </>
  )
}
