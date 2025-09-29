"use client"

import type React from "react"
import { useEffect } from "react"
import { Search, Gamepad2, X, Library, Upload, AlertCircle, Loader2, Plus, Trash2, Dice6, Users } from "lucide-react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createLudoEvent, type LudoEventData } from "@/app/actions/ludo-events"
import { useAuth } from "@/contexts/auth-context"
import { useGames } from "@/contexts/games-context"
import { useFriends } from "@/contexts/friends-context"
import { toast } from "react-hot-toast"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

interface Game {
  id: string
  title: string
  publisher?: string
  image?: string
  players?: number
  duration?: string
  age?: string
  language?: string
  condition?: string
  available?: string[]
  isBggGame?: boolean
}

interface Friend {
  id: string
  name: string
  avatar?: string
  email?: string
  bio?: string
}

interface CreateLudoEventFormProps {
  onSuccess: (eventData: any) => void
  onCancel: () => void
}

interface TimeSlot {
  id: string
  date: string
  timeFrom: string
  timeTo: string
}

const generateSeriesDates = (
  startDate: string,
  frequency: string,
  customIntervalNumber: string,
  customIntervalUnit: string,
  weeklyDays: string[],
  monthlyType: string,
  monthlyDay: string,
  monthlyWeekday: string,
  monthlyWeekdayPosition: string,
  seriesEndType: string,
  seriesEndDate: string,
  seriesEndCount: string,
): string[] => {
  if (!startDate) return []

  const dates: string[] = []
  const start = new Date(startDate)
  let current = new Date(start)
  const endDate = seriesEndDate ? new Date(seriesEndDate) : null
  const maxCount = seriesEndCount ? Number.parseInt(seriesEndCount) : 100 // Default to a large number if not specified

  // Helper function to get next date based on frequency
  const getNextDate = (currentDate: Date): Date => {
    const next = new Date(currentDate)

    switch (frequency) {
      case "täglich":
        if (frequency === "andere" && customIntervalNumber) {
          const interval = Number.parseInt(customIntervalNumber)
          if (customIntervalUnit === "tage") {
            next.setDate(next.getDate() + interval)
          } else {
            // If unit is not days for daily, default to 1 day
            next.setDate(next.getDate() + 1)
          }
        } else {
          next.setDate(next.getDate() + 1)
        }
        break

      case "wöchentlich":
        if (frequency === "andere" && customIntervalNumber) {
          const interval = Number.parseInt(customIntervalNumber)
          if (customIntervalUnit === "wochen") {
            next.setDate(next.getDate() + interval * 7)
          } else {
            // If unit is not weeks for weekly, default to 1 week
            next.setDate(next.getDate() + 7)
          }
        } else {
          next.setDate(next.getDate() + 7)
        }
        break

      case "monatlich":
        if (frequency === "andere" && customIntervalNumber) {
          const interval = Number.parseInt(customIntervalNumber)
          if (customIntervalUnit === "monate") {
            next.setMonth(next.getMonth() + interval)
          } else {
            // If unit is not months for monthly, default to 1 month
            next.setMonth(next.getMonth() + 1)
          }
        } else {
          next.setMonth(next.getMonth() + 1)
        }
        break

      case "jährlich":
        if (frequency === "andere" && customIntervalNumber) {
          const interval = Number.parseInt(customIntervalNumber)
          if (customIntervalUnit === "jahre") {
            next.setFullYear(next.getFullYear() + interval)
          } else {
            // If unit is not years for yearly, default to 1 year
            next.setFullYear(next.getFullYear() + 1)
          }
        } else {
          next.setFullYear(next.getFullYear() + 1)
        }
        break

      case "andere":
        const interval = Number.parseInt(customIntervalNumber) || 1
        switch (customIntervalUnit) {
          case "tage":
            next.setDate(next.getDate() + interval)
            break
          case "wochen":
            next.setDate(next.getDate() + interval * 7)
            break
          case "monate":
            next.setMonth(next.getMonth() + interval)
            break
          case "jahre":
            next.setFullYear(next.getFullYear() + interval)
            break
          default: // Default to 1 day if unit is unknown
            next.setDate(next.getDate() + 1)
            break
        }
        break
      default: // Default to 1 day if frequency is unknown
        next.setDate(next.getDate() + 1)
        break
    }

    // Handle specific day of week logic for weekly recurrence
    if (frequency === "wöchentlich" && weeklyDays.length > 0) {
      let daysToAdd = 0
      let foundNextDay = false
      while (daysToAdd < 7) {
        const tempDate = new Date(current)
        tempDate.setDate(tempDate.getDate() + daysToAdd)
        const dayOfWeek = tempDate.toLocaleDateString("en-US", { weekday: "long" })
        if (weeklyDays.includes(dayOfWeek)) {
          current = tempDate
          foundNextDay = true
          break
        }
        daysToAdd++
      }
      if (!foundNextDay) {
        // If no matching day found in the next 7 days, advance by a week and try again
        current.setDate(current.getDate() + 7)
      }
    }

    // Handle specific day/weekday logic for monthly recurrence
    if (frequency === "monatlich") {
      if (monthlyType === "day" && monthlyDay) {
        const dayOfMonth = Number.parseInt(monthlyDay)
        if (dayOfMonth) {
          const tempDate = new Date(current.getFullYear(), current.getMonth(), dayOfMonth)
          // Ensure the date is valid and in the future
          if (tempDate.getMonth() !== current.getMonth()) {
            // Rolled over to next month
            current.setMonth(current.getMonth() + 1)
            current.setDate(1) // Start from the first of the next month
          } else {
            current = tempDate
          }
        }
      } else if (monthlyType === "weekday" && monthlyWeekday && monthlyWeekdayPosition) {
        const targetWeekday = monthlyWeekday.toLowerCase()
        const targetPosition = monthlyWeekdayPosition.toLowerCase()
        let count = 0
        let dayOffset = 0
        const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()

        while (dayOffset < daysInMonth) {
          const tempDate = new Date(current.getFullYear(), current.getMonth(), current.getDate() + dayOffset)
          const currentWeekday = tempDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()

          if (currentWeekday === targetWeekday) {
            count++
            if (
              (targetPosition === "first" && count === 1) ||
              (targetPosition === "second" && count === 2) ||
              (targetPosition === "third" && count === 3) ||
              (targetPosition === "fourth" && count === 4) ||
              (targetPosition === "last" && tempDate.getMonth() !== current.getMonth()) // Check if it's the last occurrence in the month
            ) {
              current = tempDate
              break
            }
          }
          dayOffset++
        }
        // If the target day wasn't found or it's not the last occurrence, advance to the next month
        if (
          current.getMonth() !== new Date(startDate).getMonth() &&
          current.getDate() !== Number.parseInt(monthlyDay || "1")
        ) {
          // Basic check to avoid infinite loops
          current.setMonth(current.getMonth() + 1)
          current.setDate(1)
        }
      }
    }

    return current
  }

  // Generate dates
  let count = 0
  while (true) {
    // Loop indefinitely until break conditions are met
    // Check end conditions
    if (seriesEndType === "date" && endDate && current > endDate) {
      break
    }
    if (seriesEndType === "count" && count >= maxCount) {
      break
    }

    // Add current date if it's valid and not already added
    const isoDate = current.toISOString().split("T")[0]
    if (!dates.includes(isoDate)) {
      dates.push(isoDate)
      count++
    }

    // Get next date
    current = getNextDate(current)

    // Safety break to prevent infinite loops in case of logic errors
    if (dates.length > 365 * 5) {
      // Limit to 5 years of dates
      console.warn("generateSeriesDates: Exceeded maximum date generation limit.")
      break
    }
  }

  return dates
}

export default function CreateLudoEventForm({ onSuccess, onCancel }: CreateLudoEventFormProps) {
  const { user: authUser } = useAuth() // Renamed to avoid conflict with Supabase user
  const { games: userGames } = useGames()
  const { friends } = useFriends()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [fileInputRef] = useState<React.RefObject<HTMLInputElement>>(useRef<HTMLInputElement>(null))
  const [showGameShelfModal, setShowGameShelfModal] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({
    title: "",
    location: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    maxPlayers: "",
    customIntervalNumber: "", // Added for custom interval validation
    additionalDates: "", // Added for manual dates validation
  })

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    maxPlayers: "4",
    frequency: "einmalig" as "einmalig" | "täglich" | "wöchentlich" | "monatlich" | "jährlich" | "andere",
    seriesMode: "manual" as "manual" | "series", // For recurring events: manual entry or series creation
    customIntervalNumber: "",
    customIntervalUnit: "wochen" as "tage" | "wochen" | "monate" | "jahre",
    weeklyDays: [] as string[], // For weekly: which days of the week
    monthlyType: "day" as "day" | "weekday", // For monthly: specific day or weekday pattern
    monthlyDay: "", // For monthly: specific day of month
    monthlyWeekday: "", // For monthly: which weekday (first Monday, last Friday, etc.)
    monthlyWeekdayPosition: "first" as "first" | "second" | "third" | "fourth" | "last",
    seriesEndType: "date" as "date" | "count", // How series should end
    seriesEndDate: "",
    seriesEndCount: "",
    eventDate: "",
    additionalDates: [] as string[],
    startTime: "",
    endTime: "",
    location: "",
    isOnline: false,
    onlinePlatform: "",
    visibility: "public" as "public" | "friends_only",
    requiresApproval: false,
    organizerOnly: false,
    prizeInfo: "",
    rules: "",
    additionalInfo: "",
    selectedImage: "",
    selectedImageFile: null as File | null,
    invitedFriends: [] as string[],
    selectedGames: [] as string[],
    additionalStartTimes: [] as string[],
    additionalEndTimes: [] as string[],
    // Added for Supabase submission
    date: "", // Assuming this maps to event_date
    maxParticipants: "", // Assuming this maps to max_participants
    gameType: "", // Not directly used in Supabase submission but kept for form state
    difficultyLevel: "", // Not directly used in Supabase submission but kept for form state
    isPublic: true, // Assuming this maps to visibility
    otherGames: "", // Not directly used in Supabase submission but kept for form state
  })

  const [selectedGames, setSelectedGames] = useState<Game[]>([])
  const [customGames, setCustomGames] = useState<string[]>([])
  const [newCustomGame, setNewCustomGame] = useState("")
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [useTimeSlots, setUseTimeSlots] = useState(false)
  const [showFriendDialog, setShowFriendDialog] = useState(false)
  const [friendSearchTerm, setFriendSearchTerm] = useState("")
  const [showFriendGameDialog, setShowFriendGameDialog] = useState<{ friendId: string; friendName: string } | null>(
    null,
  )
  const [friendGameSearchTerm, setFriendGameSearchTerm] = useState("")
  const [friendGameRequests, setFriendGameRequests] = useState<{ [friendId: string]: Game[] }>({})
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "unavailable">("all")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const [bggSearchTerm, setBggSearchTerm] = useState("")
  const [bggSearchResults, setBggSearchResults] = useState<any[]>([])
  const [bggSearchLoading, setBggSearchLoading] = useState(false)
  const [locationType, setLocationType] = useState<"local" | "virtual">("local")

  useEffect(() => {
    if (formData.frequency === "einmalig") {
      setUseTimeSlots(false)
      setTimeSlots([])
    } else if (["täglich", "wöchentlich", "monatlich", "jährlich", "andere"].includes(formData.frequency)) {
      // For recurring events, we'll handle time slots differently based on series mode
      if (formData.seriesMode === "series") {
        setUseTimeSlots(false)
        setTimeSlots([])
      } else {
        setUseTimeSlots(true)
        if (timeSlots.length === 0) {
          handleAddTimeSlot()
        }
      }
    }
  }, [formData.frequency, formData.seriesMode])

  const handleInputChange = (field: string, value: any) => {
    console.log(`[v0] Input change - Field: ${field}, Value: ${value}`)
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }
      console.log(`[v0] Updated form data for ${field}:`, newData[field])
      return newData
    })
  }

  const handleGameToggle = (game: Game) => {
    setSelectedGames((prev) => {
      const isSelected = prev.some((g) => g.id === game.id)
      if (isSelected) {
        return prev.filter((g) => g.id !== game.id)
      } else {
        return [...prev, game]
      }
    })
  }

  const handleAddCustomGame = () => {
    if (newCustomGame.trim() && !customGames.includes(newCustomGame.trim())) {
      setCustomGames((prev) => [...prev, newCustomGame.trim()])
      setNewCustomGame("")
    }
  }

  const handleRemoveCustomGame = (game: string) => {
    setCustomGames((prev) => prev.filter((g) => g !== game))
  }

  const handleFriendToggle = (friend: Friend) => {
    setSelectedFriends((prev) => {
      const isSelected = prev.some((f) => f.id === friend.id)
      if (isSelected) {
        return prev.filter((f) => f.id !== friend.id)
      } else {
        return [...prev, friend]
      }
    })
  }

  const handleRemoveSelectedFriend = (friendId: string) => {
    setSelectedFriends((prev) => prev.filter((f) => f.id !== friendId))
  }

  const handleAddTimeSlot = () => {
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      date: "",
      timeFrom: "",
      timeTo: "",
    }
    setTimeSlots((prev) => [...prev, newSlot])
  }

  const handleUpdateTimeSlot = (id: string, field: keyof TimeSlot, value: string) => {
    setTimeSlots((prev) => prev.map((slot) => (slot.id === id ? { ...slot, [field]: value } : slot)))
  }

  const handleRemoveTimeSlot = (id: string) => {
    setTimeSlots((prev) => prev.filter((slot) => slot.id !== id))
  }

  // Image validation and upload functions
  const validateImageFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return "Nur JPG, PNG und WebP Dateien sind erlaubt."
    }

    // Check file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return "Die Datei ist zu groß. Maximal 5MB sind erlaubt."
    }

    return null
  }

  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImageError(null)
    setIsUploadingImage(true)

    try {
      // Validate the file
      const validationError = validateImageFile(file)
      if (validationError) {
        setImageError(validationError)
        return
      }

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const result = await response.json()

      // Update form data with the uploaded image URL
      setFormData((prev) => ({
        ...prev,
        selectedImage: result.url,
        selectedImageFile: null, // Clear the file since it's now uploaded
      }))
    } catch (error) {
      console.error("Error uploading image:", error)
      setImageError("Fehler beim Hochladen des Bildes. Bitte versuchen Sie es erneut.")
    } finally {
      setIsUploadingImage(false)
      // Reset the input value so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveImage = () => {
    // Clean up the object URL to prevent memory leaks
    if (formData.selectedImage && formData.selectedImage.startsWith("blob:")) {
      URL.revokeObjectURL(formData.selectedImage)
    }

    setFormData((prev) => ({
      ...prev,
      selectedImage: "",
      selectedImageFile: null,
    }))
    setImageError(null)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const validateCurrentStep = () => {
    console.log("[v0] Validating step:", currentStep)
    console.log("[v0] Current form data:", formData)

    const stepErrors: { [key: string]: string } = {}
    let isValid = true

    if (currentStep === 1) {
      // Step 1: Only validate title - user can proceed once title is filled
      if (!formData.title.trim()) {
        stepErrors.title = "Bitte gib einen Titel für das Event ein."
        isValid = false
      }
    }

    if (currentStep === 2) {
      // Step 2: Validate date, time, location, and interval settings
      if (!formData.eventDate) {
        stepErrors.eventDate = "Bitte wähle ein Datum für das Event."
        isValid = false
      }
      if (!formData.startTime) {
        stepErrors.startTime = "Bitte wähle eine Startzeit."
        isValid = false
      }
      if (!formData.endTime) {
        stepErrors.endTime = "Bitte wähle eine Endzeit."
        isValid = false
      }
      if (!formData.location.trim() && !formData.isOnline) {
        stepErrors.location = "Bitte gib einen Ort an oder wähle Online-Event."
        isValid = false
      }
      if (formData.isOnline && !formData.onlinePlatform.trim()) {
        stepErrors.onlinePlatform = "Bitte gib eine Online-Plattform an."
        isValid = false
      }
      // Allow empty field for unlimited participants
      if (formData.maxPlayers !== "" && Number.parseInt(formData.maxPlayers) < 2) {
        stepErrors.maxPlayers =
          "Bitte gib eine gültige Spielerzahl an (mindestens 2) oder lasse das Feld leer für unbegrenzte Teilnehmerzahl."
        isValid = false
      }

      if (formData.frequency === "andere" && formData.seriesMode === "series") {
        if (!formData.customIntervalNumber || Number.parseInt(formData.customIntervalNumber) <= 1) {
          stepErrors.customIntervalNumber = "Das Intervall muss größer als 1 sein."
          isValid = false
        }
      }

      if (
        ["täglich", "wöchentlich", "monatlich", "jährlich", "andere"].includes(formData.frequency) &&
        formData.seriesMode === "manual" &&
        formData.additionalDates.length === 0
      ) {
        stepErrors.additionalDates =
          "Bitte füge mindestens einen weiteren Termin hinzu oder wähle 'Serientermine erstellen'."
        isValid = false
      }
    }

    if (currentStep === 3) {
      // Step 3: Validate game selection
      if (selectedGames.length === 0 && customGames.length === 0) {
        stepErrors.games = "Bitte wähle mindestens ein Spiel aus oder füge ein eigenes hinzu."
        isValid = false
      }
    }

    if (currentStep === 4) {
      // Step 4: Validate frequency and final settings
      if (!formData.frequency) {
        stepErrors.frequency = "Bitte wähle eine Häufigkeit aus."
        isValid = false
      }
    }

    console.log("[v0] Validation errors:", stepErrors)
    console.log("[v0] Is valid:", isValid)

    if (!isValid) {
      setErrors(stepErrors)
    } else {
      setErrors({}) // Clear errors when validation passes
    }

    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)
    setFieldErrors({
      title: "",
      location: "",
      eventDate: "",
      startTime: "",
      endTime: "",
      maxPlayers: "",
      customIntervalNumber: "",
      additionalDates: "",
    })

    try {
      console.log("[v0] === STARTING FORM SUBMISSION ===")
      console.log("[v0] Current user:", authUser?.id, authUser?.username)
      console.log("[v0] Form data before validation:", JSON.stringify(formData, null, 2))
      console.log("[v0] Selected games:", selectedGames)
      console.log("[v0] Selected friends:", selectedFriends)

      let hasErrors = false
      const newFieldErrors = { ...fieldErrors }

      if (!formData.title.trim()) {
        newFieldErrors.title = "Bitte gib einen Titel für das Event ein."
        hasErrors = true
      }

      if (!formData.location.trim() && !formData.isOnline) {
        newFieldErrors.location = "Bitte gib einen Ort an."
        hasErrors = true
      }

      if (!formData.eventDate) {
        newFieldErrors.eventDate = "Bitte wähle ein Datum für das Event."
        hasErrors = true
      } else {
        const selectedDate = new Date(formData.eventDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (selectedDate <= today) {
          newFieldErrors.eventDate = "Das Event-Datum muss in der Zukunft liegen."
          hasErrors = true
        }
      }

      if (!formData.startTime) {
        newFieldErrors.startTime = "Bitte wähle eine Startzeit."
        hasErrors = true
      }

      if (!formData.endTime) {
        newFieldErrors.endTime = "Bitte wähle eine Endzeit."
        hasErrors = true
      }

      if (formData.startTime && formData.endTime) {
        const startTime = new Date(`2000-01-01T${formData.startTime}:00`)
        const endTime = new Date(`2000-01-01T${formData.endTime}:00`)

        if (endTime <= startTime) {
          newFieldErrors.endTime = "Die Endzeit muss nach der Startzeit liegen."
          hasErrors = true
        }
      }

      // Allow empty field for unlimited participants
      if (!formData.maxPlayers || (formData.maxPlayers !== "" && Number.parseInt(formData.maxPlayers) < 2)) {
        newFieldErrors.maxPlayers =
          "Bitte gib eine gültige Spielerzahl an (mindestens 2) oder lasse das Feld leer für unbegrenzte Teilnehmerzahl."
        hasErrors = true
      }

      if (formData.frequency === "andere" && formData.seriesMode === "series") {
        if (!formData.customIntervalNumber || Number.parseInt(formData.customIntervalNumber) <= 1) {
          newFieldErrors.customIntervalNumber = "Das Intervall muss größer als 1 sein."
          hasErrors = true
        }
      }

      if (
        ["täglich", "wöchentlich", "monatlich", "jährlich", "andere"].includes(formData.frequency) &&
        formData.seriesMode === "manual" &&
        formData.additionalDates.length === 0
      ) {
        newFieldErrors.additionalDates =
          "Bitte füge mindestens einen weiteren Termin hinzu oder wähle 'Serientermine erstellen'."
        hasErrors = true
      }

      if (hasErrors) {
        setFieldErrors(newFieldErrors)
        setIsSubmitting(false)
        return
      }

      const imageUrl = formData.selectedImage

      if (!authUser) {
        setSubmitError("Du musst angemeldet sein, um ein Event zu erstellen.")
        return
      }

      // Validate required fields
      if (!formData.title.trim()) {
        setSubmitError("Bitte gib einen Titel für das Event ein.")
        return
      }

      if (!formData.location.trim() && !formData.isOnline) {
        setSubmitError("Bitte gib einen Ort an.")
        return
      }

      if (!formData.eventDate) {
        setSubmitError("Bitte wähle ein Datum für das Event.")
        return
      }

      const selectedDate = new Date(formData.eventDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time to start of day for comparison

      if (selectedDate <= today) {
        setSubmitError("Das Event-Datum muss in der Zukunft liegen.")
        return
      }

      if (formData.startTime && formData.endTime) {
        const startTime = new Date(`2000-01-01T${formData.startTime}:00`)
        const endTime = new Date(`2000-01-01T${formData.endTime}:00`)

        if (endTime <= startTime) {
          setSubmitError("Die Endzeit muss nach der Startzeit liegen.")
          return
        }
      }

      const otherGamesList = formData.otherGames
        ? formData.otherGames
            .split(",")
            .map((game) => game.trim())
            .filter((game) => game.length > 0)
        : []

      const eventData: LudoEventData = {
        title: formData.title,
        description: formData.description,
        gameType: formData.gameType,
        difficultyLevel: formData.difficultyLevel,
        maxPlayers: formData.maxPlayers === "" ? null : Number.parseInt(formData.maxPlayers),
        eventDate: formData.eventDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        isOnline: formData.isOnline,
        onlinePlatform: formData.onlinePlatform,
        isPublic: formData.isPublic,
        requiresApproval: formData.requiresApproval,
        organizerOnly: formData.organizerOnly,
        prizeInfo: formData.prizeInfo,
        rules: formData.rules,
        additionalInfo: formData.additionalInfo,
        imageUrl: imageUrl,
        selectedGames,
        customGames: [...customGames, ...otherGamesList],
        selectedFriends: selectedFriends.map((f) => f.id),
        // Updated frequency and series data
        frequency: formData.frequency,
        seriesMode: formData.seriesMode,
        customIntervalNumber: formData.customIntervalNumber ? Number.parseInt(formData.customIntervalNumber) : null,
        customIntervalUnit: formData.customIntervalUnit,
        weeklyDays: formData.weeklyDays,
        monthlyType: formData.monthlyType,
        monthlyDay: formData.monthlyDay ? Number.parseInt(formData.monthlyDay) : null,
        monthlyWeekday: formData.monthlyWeekday,
        monthlyWeekdayPosition: formData.monthlyWeekdayPosition,
        seriesEndType: formData.seriesEndType,
        seriesEndDate: formData.seriesEndDate,
        seriesEndCount: formData.seriesEndCount ? Number.parseInt(formData.seriesEndCount) : null,
        // </CHANGE>

        additionalDates: formData.additionalDates,
        additionalStartTimes: formData.additionalStartTimes,
        additionalEndTimes: formData.additionalEndTimes,

        visibility: formData.visibility,
        selected_friends: formData.visibility === "friends_only" ? selectedFriends.map((f) => f.id) : [],
      }

      console.log("[v0] About to call createLudoEvent with data:", JSON.stringify(eventData, null, 2))
      console.log("[v0] Additional dates being sent:", formData.additionalDates)
      console.log("[v0] Additional start times:", formData.additionalStartTimes)
      console.log("[v0] Additional end times:", formData.additionalEndTimes)

      console.log("[v0] Creator ID:", authUser.id)
      console.log("[v0] === CALLING createLudoEvent FUNCTION ===")

      const result = await createLudoEvent(eventData, authUser.id)

      console.log("[v0] === createLudoEvent RETURNED ===")
      console.log("[v0] createLudoEvent result:", JSON.stringify(result, null, 2))

      if (result.success) {
        console.log("[v0] Event created successfully!")
        console.log("[v0] Created event data:", JSON.stringify(result.data, null, 2))

        if (formData.visibility === "friends_only" && selectedFriends.length > 0) {
          toast.success("Event erfolgreich erstellt und an die ausgewählten Freunde gesendet.")
        } else {
          toast.success("Event erfolgreich erstellt.")
        }

        console.log("[v0] Event created successfully, calling onSuccess callback")
        onSuccess(result.data)

        if (onSuccess) {
          onSuccess()
        }

        // Reset form
        setFormData({
          title: "",
          description: "",
          maxPlayers: "4",
          frequency: "einmalig" as "einmalig" | "täglich" | "wöchentlich" | "monatlich" | "jährlich" | "andere",
          seriesMode: "manual" as "manual" | "series",
          customIntervalNumber: "",
          customIntervalUnit: "wochen" as "tage" | "wochen" | "monate" | "jahre",
          weeklyDays: [],
          monthlyType: "day" as "day" | "weekday",
          monthlyDay: "",
          monthlyWeekday: "",
          monthlyWeekdayPosition: "first" as "first" | "second" | "third" | "fourth" | "last",
          seriesEndType: "date" as "date" | "count",
          seriesEndDate: "",
          seriesEndCount: "",
          eventDate: "",
          additionalDates: [] as string[],
          startTime: "",
          endTime: "",
          location: "",
          isOnline: false,
          onlinePlatform: "",
          visibility: "public" as "public" | "friends_only",
          requiresApproval: false,
          organizerOnly: false,
          prizeInfo: "",
          rules: "",
          additionalInfo: "",
          selectedImage: "",
          selectedImageFile: null as File | null,
          invitedFriends: [] as string[],
          selectedGames: [] as string[],
          additionalStartTimes: [] as string[],
          additionalEndTimes: [] as string[],
          // Reset for Supabase submission
          date: "",
          maxParticipants: "",
          gameType: "",
          difficultyLevel: "",
          isPublic: true,
          otherGames: "",
        })
        setSelectedFriends([])
        setSelectedGames([])
        setCurrentStep(1)
        setIsSubmitting(false)
      } else {
        console.error("[v0] Event creation failed:", result.error)
        console.log("[v0] Full error result:", JSON.stringify(result, null, 2))
        setSubmitError(result.error || "Fehler beim Erstellen des Events")
      }
    } catch (error) {
      console.error("[v0] Form submission error:", error)
      console.error("[v0] Error message:", error instanceof Error ? error.message : "Unknown error")
      console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
      setSubmitError("Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.")
    } finally {
      console.log("[v0] === FORM SUBMISSION COMPLETED ===")
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    console.log("[v0] Next step clicked, current step:", currentStep)

    if (validateCurrentStep()) {
      console.log("[v0] Validation passed, moving to next step")
      if (currentStep < 4) {
        const newStep = currentStep + 1
        console.log("[v0] Setting current step to:", newStep)
        setCurrentStep(newStep)
      }
    } else {
      console.log("[v0] Validation failed, staying on current step")
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1:
        return "Grundinformationen"
      case 2:
        return "Event-Details"
      case 3:
        return "Spieleauswahl: Welche Spiele werden zum Event gespielt?"
      case 4:
        return "Einstellungen & Veröffentlichung"
      default:
        return ""
    }
  }

  // Filter friends based on search term
  const filteredFriends =
    friends?.filter(
      (friend) =>
        friend &&
        friend.name &&
        typeof friend.name === "string" &&
        friend.name.toLowerCase().includes((friendSearchTerm || "").toLowerCase()),
    ) || []

  const handleGameShelfSelection = (game: any) => {
    const gameForEvent = {
      id: game.id,
      title: game.title,
      image: game.image,
      publisher: game.publisher,
      players: game.players,
      duration: game.duration,
      age: game.age,
      language: game.language,
      condition: game.condition,
      available: game.available,
    }

    setSelectedGames((prev) => {
      if (prev.some((g) => g.id === game.id)) {
        return prev // Game already selected
      }
      return [...prev, game]
    })

    setShowGameShelfModal(false)
  }

  const handleToggleFriendGameRequest = (friendId: string, game: Game) => {
    setFriendGameRequests((prev) => {
      const currentRequests = prev[friendId] || []
      const isGameRequested = currentRequests.some((g) => g.id === game.id)

      if (isGameRequested) {
        // Remove the game from the requests
        const updatedRequests = currentRequests.filter((g) => g.id !== game.id)
        return {
          ...prev,
          [friendId]: updatedRequests,
        }
      } else {
        // Add the game to the requests
        return {
          ...prev,
          [friendId]: [...currentRequests, game],
        }
      }
    })
  }

  const handleRemoveFriendGameRequest = (friendId: string, gameId: string) => {
    setFriendGameRequests((prev) => {
      const currentRequests = prev[friendId] || []
      const updatedRequests = currentRequests.filter((g) => g.id !== gameId)
      return {
        ...prev,
        [friendId]: updatedRequests,
      }
    })
  }

  const filteredFriendGames = showFriendGameDialog
    ? userGames.filter((game) => game?.title?.toLowerCase().includes((friendGameSearchTerm || "").toLowerCase()))
    : []

  const handleRemoveSelectedGame = (gameId: string) => {
    setSelectedGames((prev) => prev.filter((game) => game.id !== gameId))
  }

  const searchBoardGameGeek = async (query: string) => {
    if (!query.trim()) {
      setBggSearchResults([])
      return
    }

    setBggSearchLoading(true)
    try {
      const response = await fetch(`/api/boardgamegeek/search?q=${encodeURIComponent(query)}`)

      if (!response.ok) {
        throw new Error("BGG search failed")
      }

      const data = await response.json()

      const results = (data.games || []).slice(0, 10).map((game: any) => ({
        id: `bgg-${game.id}`,
        title: game.name,
        year: game.yearPublished,
        image: game.image || game.thumbnail || "/placeholder.svg",
        publisher: game.publishers?.[0] || "",
        players: game.minPlayers && game.maxPlayers ? `${game.minPlayers}-${game.maxPlayers} Spieler` : "Unbekannt",
        duration: game.playingTime ? `${game.playingTime} Min.` : "Unbekannt",
        age: game.minAge ? `ab ${game.minAge} Jahren` : "Unbekannt",
        categories: game.categories || [],
        mechanics: game.mechanics || [],
        isBggGame: true,
      }))

      setBggSearchResults(results)
    } catch (error) {
      console.error("BGG search error:", error)
      setBggSearchResults([])
    } finally {
      setBggSearchLoading(false)
    }
  }

  const handleRemoveGame = (gameId: string) => {
    setSelectedGames((prev) => prev.filter((game) => game.id !== gameId))
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-pink-50 p-6 rounded-2xl max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 font-handwritten transform -rotate-1">
          Neues Event erstellen
        </h2>
        <p className="text-gray-600 font-body">Organisiere dein eigenes Event und lade andere Spieler ein!</p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-between items-center mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step <= currentStep
                  ? "bg-gradient-to-r from-orange-400 to-pink-400 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step}
            </div>
            {step < 4 && (
              <div
                className={`w-16 h-1 mx-2 ${
                  step < currentStep ? "bg-gradient-to-r from-orange-400 to-pink-400" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-handwritten text-gray-800 mb-4">{getStepTitle(currentStep)}</h3>
      </div>

      {/* Step 1: Ludo Event Details */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <Label htmlFor="title" className="font-body text-gray-700">
              Event-Titel *
            </Label>
            <Input
              id="title"
              placeholder="z.B. Gemütlicher CATAN Abend..."
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="mt-1 border-2 border-orange-200 focus:border-orange-400 font-body"
            />
            {fieldErrors.title && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {fieldErrors.title}
              </p>
            )}
            {errors.title && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <Label className="font-body text-gray-700">Event-Bild</Label>
            <p className="text-sm text-gray-500 mt-1 mb-3">
              Lade ein Bild hoch, um dein Event attraktiver zu gestalten (optional)
            </p>

            {formData.selectedImage ? (
              <div className="relative">
                <img
                  src={formData.selectedImage || "/placeholder.svg"}
                  alt="Event Vorschau"
                  className="w-full h-48 object-cover rounded-lg border-2 border-orange-200"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={handleImageUpload}
                className="border-2 border-dashed border-orange-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-400 transition-colors"
              >
                <div className="flex flex-col items-center space-y-2">
                  {isUploadingImage ? (
                    <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                  ) : (
                    <Upload className="h-8 w-8 text-orange-500" />
                  )}
                  <p className="text-gray-600 font-body">
                    {isUploadingImage ? "Bild wird verarbeitet..." : "Klicken zum Hochladen"}
                  </p>
                  <p className="text-sm text-gray-500">JPG, PNG oder WebP (max. 5MB)</p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {imageError && (
              <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {imageError}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description" className="font-body text-gray-700">
              Beschreibung
            </Label>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => handleInputChange("description", value)}
              placeholder="Beschreibe dein Event: was möchtest du veranstalten?"
              className="mt-1"
              rows={4}
              maxLength={1000}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
        </div>
      )}

      {/* Step 2: Date & Location */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2">
              <input
                id="organizerOnly"
                type="checkbox"
                checked={formData.organizerOnly}
                onChange={(e) => handleInputChange("organizerOnly", e.target.checked)}
                className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
              />
              <Label htmlFor="organizerOnly" className="font-body text-gray-700 cursor-pointer">
                Veranstalter (Ich werde nicht als Teilnehmer gezählt)
              </Label>
            </div>
            <p className="text-sm text-gray-500 ml-6">
              Aktiviere diese Option, wenn du das Event nur organisierst, aber nicht selbst teilnimmst.
            </p>
          </div>

          <div>
            <Label htmlFor="maxPlayers" className="font-body text-gray-700">
              Maximale Teilnehmeranzahl *
            </Label>
            <Input
              id="maxPlayers"
              type="number"
              min="2"
              value={formData.maxPlayers || ""}
              onChange={(e) => {
                const value = e.target.value
                handleInputChange("maxPlayers", value)
                // Also update formData.maxParticipants for Supabase submission
                handleInputChange("maxParticipants", value)
              }}
              className="mt-1 border-2 border-orange-200 focus:border-orange-400 font-body"
            />
            <p className="text-xs text-gray-500 mt-1">Leer lassen für unbegrenzte Teilnehmerzahl</p>
            {fieldErrors.maxPlayers && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {fieldErrors.maxPlayers}
              </p>
            )}
            {errors.maxPlayers && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.maxPlayers}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="frequency" className="font-body text-gray-700">
              Häufigkeit *
            </Label>
            <Select
              value={formData.frequency}
              onValueChange={(value) => {
                handleInputChange("frequency", value)
                if (value !== formData.frequency) {
                  handleInputChange("eventDate", "")
                  handleInputChange("additionalDates", [])
                  handleInputChange("seriesMode", "manual")
                  handleInputChange("customIntervalNumber", "")
                }
              }}
            >
              <SelectTrigger className="mt-1 border-2 border-orange-200 focus:border-orange-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="einmalig">Einmalig</SelectItem>
                <SelectItem value="täglich">Täglich</SelectItem>
                <SelectItem value="wöchentlich">Wöchentlich</SelectItem>
                <SelectItem value="monatlich">Monatlich</SelectItem>
                <SelectItem value="jährlich">Jährlich</SelectItem>
                <SelectItem value="andere">Andere</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.frequency === "andere" && (
            <div className="space-y-4">
              <Label className="font-body text-gray-700">Intervall-Einstellungen</Label>
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-600">Alle</span>
                <Input
                  type="number"
                  min="2"
                  placeholder="2"
                  value={formData.customIntervalNumber}
                  onChange={(e) => handleInputChange("customIntervalNumber", e.target.value)}
                  className={`w-20 border-2 ${errors.customIntervalNumber ? "border-red-300 focus:border-red-400" : "border-orange-200 focus:border-orange-400"}`}
                />
                <Select
                  value={formData.customIntervalUnit}
                  onValueChange={(value) => handleInputChange("customIntervalUnit", value)}
                >
                  <SelectTrigger className="w-32 border-2 border-orange-200 focus:border-orange-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tage">Tage</SelectItem>
                    <SelectItem value="wochen">Wochen</SelectItem>
                    <SelectItem value="monate">Monate</SelectItem>
                    <SelectItem value="jahre">Jahre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-gray-500">
                Beispiel: "Alle 3 Wochen" bedeutet das Event findet alle 3 Wochen statt (Zahl muss größer als 1 sein)
              </p>
              {errors.customIntervalNumber && <p className="text-red-600 text-sm">{errors.customIntervalNumber}</p>}
            </div>
          )}

          {["täglich", "wöchentlich", "monatlich", "jährlich", "andere"].includes(formData.frequency) && (
            <div>
              <Label className="font-body text-gray-700">Terminplanung *</Label>
              <Select
                value={formData.seriesMode}
                onValueChange={(value) => {
                  handleInputChange("seriesMode", value)
                  if (value !== formData.seriesMode) {
                    handleInputChange("eventDate", "")
                    handleInputChange("additionalDates", [])
                  }
                }}
              >
                <SelectTrigger className="mt-1 border-2 border-orange-200 focus:border-orange-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Termin(e) manuell eingeben</SelectItem>
                  <SelectItem value="series">Serientermine erstellen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.frequency === "wöchentlich" && formData.seriesMode === "series" && (
            <div className="space-y-4">
              <Label className="font-body text-gray-700">Wochentage auswählen</Label>
              <div className="grid grid-cols-7 gap-2">
                {["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"].map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={formData.weeklyDays.includes(day)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleInputChange("weeklyDays", [...formData.weeklyDays, day])
                        } else {
                          handleInputChange(
                            "weeklyDays",
                            formData.weeklyDays.filter((d) => d !== day),
                          )
                        }
                      }}
                    />
                    <Label htmlFor={day} className="text-sm cursor-pointer">
                      {day.slice(0, 2)}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500">Wähle die Wochentage aus, an denen das Event stattfinden soll</p>
            </div>
          )}

          {formData.frequency === "monatlich" && formData.seriesMode === "series" && (
            <div className="space-y-4">
              <Label className="font-body text-gray-700">Monatliches Muster</Label>
              <Select value={formData.monthlyType} onValueChange={(value) => handleInputChange("monthlyType", value)}>
                <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">An einem bestimmten Tag im Monats</SelectItem>
                  <SelectItem value="weekday">An einem bestimmten Wochentag</SelectItem>
                </SelectContent>
              </Select>

              {formData.monthlyType === "day" && (
                <div>
                  <Label className="font-body text-gray-700">Tag des Monats</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="z.B. 7 für jeden 7. des Monats"
                    value={formData.monthlyDay}
                    onChange={(e) => handleInputChange("monthlyDay", e.target.value)}
                    className="mt-1 border-2 border-orange-200 focus:border-orange-400"
                  />
                </div>
              )}

              {formData.monthlyType === "weekday" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Select
                      value={formData.monthlyWeekdayPosition}
                      onValueChange={(value) => handleInputChange("monthlyWeekdayPosition", value)}
                    >
                      <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first">Ersten</SelectItem>
                        <SelectItem value="second">Zweiten</SelectItem>
                        <SelectItem value="third">Dritten</SelectItem>
                        <SelectItem value="fourth">Vierten</SelectItem>
                        <SelectItem value="last">Letzten</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={formData.monthlyWeekday}
                      onValueChange={(value) => handleInputChange("monthlyWeekday", value)}
                    >
                      <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="montag">Montag</SelectItem>
                        <SelectItem value="dienstag">Dienstag</SelectItem>
                        <SelectItem value="mittwoch">Mittwoch</SelectItem>
                        <SelectItem value="donnerstag">Donnerstag</SelectItem>
                        <SelectItem value="freitag">Freitag</SelectItem>
                        <SelectItem value="samstag">Samstag</SelectItem>
                        <SelectItem value="sonntag">Sonntag</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-gray-500">z.B. "Ersten Freitag" = jeden ersten Freitag im Monat</p>
                </div>
              )}
            </div>
          )}

          {/* Updated series end UI to use radio buttons with inline layout */}
          {["täglich", "wöchentlich", "monatlich", "jährlich", "andere"].includes(formData.frequency) &&
            formData.seriesMode === "series" && (
              <div className="space-y-4">
                <Label className="font-body text-gray-700">Wann soll die Serie enden?</Label>

                {/* Radio button option 1: Endet nach X Terminen */}
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="endByCount"
                    name="seriesEndType"
                    value="count"
                    checked={formData.seriesEndType === "count"}
                    onChange={(e) => {
                      handleInputChange("seriesEndType", e.target.value)
                      if (e.target.checked) {
                        handleInputChange("seriesEndDate", "") // Clear end date if count is selected
                      }
                    }}
                    className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                  />
                  <Label htmlFor="endByCount" className="font-body text-gray-700">
                    Endet nach
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="5"
                    value={formData.seriesEndCount}
                    onChange={(e) => {
                      handleInputChange("seriesEndCount", e.target.value)
                      if (e.target.value) {
                        handleInputChange("seriesEndType", "count")
                      }
                    }}
                    className={`w-20 border-2 ${formData.seriesEndType !== "count" ? "opacity-50 cursor-not-allowed" : "border-orange-200 focus:border-orange-400"}`}
                    disabled={formData.seriesEndType !== "count"}
                  />
                  <Label className="font-body text-gray-700">Terminen</Label>
                </div>

                {/* Radio button option 2: Endet am Datum */}
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="endByDate"
                    name="seriesEndType"
                    value="date"
                    checked={formData.seriesEndType === "date"}
                    onChange={(e) => {
                      handleInputChange("seriesEndType", e.target.value)
                      if (e.target.checked) {
                        handleInputChange("seriesEndCount", "") // Clear count if date is selected
                      }
                    }}
                    className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                  />
                  <Label htmlFor="endByDate" className="font-body text-gray-700">
                    Endet am
                  </Label>
                  <Input
                    type="date"
                    value={formData.seriesEndDate}
                    onChange={(e) => {
                      handleInputChange("seriesEndDate", e.target.value)
                      if (e.target.value) {
                        handleInputChange("seriesEndType", "date")
                      }
                    }}
                    className={`border-2 ${formData.seriesEndType !== "date" ? "opacity-50 cursor-not-allowed" : "border-orange-200 focus:border-orange-400"}`}
                    disabled={formData.seriesEndType !== "date"}
                  />
                </div>
              </div>
            )}

          <div>
            <Label htmlFor="eventDate" className="font-body text-gray-700">
              {formData.frequency === "einmalig"
                ? "Event-Datum *"
                : formData.seriesMode === "series"
                  ? "Start-Datum *"
                  : "Datum *"}
            </Label>
            <Input
              id="eventDate"
              type="date"
              className="mt-1 border-2 border-orange-200 focus:border-orange-400"
              value={formData.eventDate}
              onChange={(e) => {
                handleInputChange("eventDate", e.target.value)
                handleInputChange("date", e.target.value) // Update for Supabase
              }}
              required
            />
            {fieldErrors.eventDate ? (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {fieldErrors.eventDate}
              </p>
            ) : (
              <p className="text-sm text-gray-600 mt-1">Das Datum muss in der Zukunft liegen</p>
            )}
            {errors.eventDate && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.eventDate}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime" className="font-body text-gray-700">
                Startzeit *
              </Label>
              <Input
                id="startTime"
                type="time"
                className="mt-1 border-2 border-orange-200 focus:border-orange-400"
                value={formData.startTime}
                onChange={(e) => handleInputChange("startTime", e.target.value)}
                required
              />
              {fieldErrors.startTime && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {fieldErrors.startTime}
                </p>
              )}
              {errors.startTime && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.startTime}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="endTime" className="font-body text-gray-700">
                Endzeit *
              </Label>
              <Input
                id="endTime"
                type="time"
                className="mt-1 border-2 border-orange-200 focus:border-orange-400"
                value={formData.endTime}
                onChange={(e) => handleInputChange("endTime", e.target.value)}
                required
              />
              {fieldErrors.endTime && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {fieldErrors.endTime}
                </p>
              )}
              {errors.endTime && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.endTime}
                </p>
              )}
            </div>
          </div>

          {["täglich", "wöchentlich", "monatlich", "jährlich", "andere"].includes(formData.frequency) &&
            formData.seriesMode === "manual" && (
              <div className="space-y-4">
                <div>
                  <Label className="font-body text-gray-700">Weitere Termine *</Label>
                  <p className="text-sm text-gray-500 mt-1 mb-2">
                    Füge alle Termine hinzu, an denen das Event stattfinden soll. Jeder Termin muss in der Zukunft und
                    nach dem vorherigen Termin liegen.
                  </p>
                  {errors.additionalDates && <p className="text-red-600 text-sm mb-2">{errors.additionalDates}</p>}
                  <div className="space-y-2 mt-2">
                    {formData.additionalDates.map((date, index) => {
                      const previousDate = index === 0 ? formData.eventDate : formData.additionalDates[index - 1]
                      const isDateValid = !date || !previousDate || new Date(date) > new Date(previousDate)
                      const isFutureDate = !date || new Date(date) > new Date()

                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Input
                                type="date"
                                className={`border-2 ${!isDateValid || !isFutureDate ? "border-red-300 focus:border-red-400" : "border-orange-200 focus:border-orange-400"}`}
                                value={date}
                                onChange={(e) => {
                                  const newDates = [...formData.additionalDates]
                                  newDates[index] = e.target.value
                                  handleInputChange("additionalDates", newDates)
                                }}
                              />
                              {date && !isFutureDate && (
                                <p className="text-red-600 text-xs mt-1">Datum muss in der Zukunft liegen</p>
                              )}
                              {date && isFutureDate && !isDateValid && (
                                <p className="text-red-600 text-xs mt-1">
                                  Datum muss nach dem {index === 0 ? "Start-Event" : "vorherigen Termin"} liegen
                                </p>
                              )}
                            </div>
                            {date && (
                              <>
                                <Input
                                  type="time"
                                  className="border-2 border-orange-200 focus:border-orange-400"
                                  placeholder="Startzeit"
                                  value={formData.additionalStartTimes?.[index] || formData.startTime}
                                  onChange={(e) => {
                                    const newTimes = [...(formData.additionalStartTimes || [])]
                                    newTimes[index] = e.target.value
                                    handleInputChange("additionalStartTimes", newTimes)
                                  }}
                                />
                                <Input
                                  type="time"
                                  className="border-2 border-orange-200 focus:border-orange-400"
                                  placeholder="Endzeit"
                                  value={formData.additionalEndTimes?.[index] || formData.endTime}
                                  onChange={(e) => {
                                    const newTimes = [...(formData.additionalEndTimes || [])]
                                    newTimes[index] = e.target.value
                                    handleInputChange("additionalEndTimes", newTimes)
                                  }}
                                />
                              </>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newDates = formData.additionalDates.filter((_, i) => i !== index)
                                const newStartTimes = (formData.additionalStartTimes || []).filter(
                                  (_, i) => i !== index,
                                )
                                const newEndTimes = (formData.additionalEndTimes || []).filter((_, i) => i !== index)
                                handleInputChange("additionalDates", newDates)
                                handleInputChange("additionalStartTimes", newStartTimes)
                                handleInputChange("additionalEndTimes", newEndTimes)
                              }}
                            >
                              Entfernen
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleInputChange("additionalDates", [...formData.additionalDates, ""])
                      }}
                    >
                      + Weiteren Termin hinzufügen
                    </Button>
                  </div>
                </div>
              </div>
            )}

          {/* Updated preview logic to show generated series dates */}
          {((formData.frequency === "einmalig" && formData.eventDate && formData.startTime && formData.endTime) ||
            (formData.frequency !== "einmalig" &&
              formData.seriesMode === "manual" &&
              formData.additionalDates.some((date) => date)) ||
            (formData.frequency !== "einmalig" &&
              formData.seriesMode === "series" &&
              formData.eventDate &&
              formData.startTime &&
              formData.endTime &&
              (formData.seriesEndType === "count" ? formData.seriesEndCount : formData.seriesEndDate))) && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-3">📅 Terminvorschau</h3>
              <div className="space-y-2">
                {formData.frequency === "einmalig" ? (
                  <div className="flex justify-between items-center bg-white rounded p-2 border border-blue-200">
                    <span className="font-medium text-blue-700">
                      {new Date(formData.eventDate).toLocaleDateString("de-DE", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-blue-600">
                      {formData.startTime} - {formData.endTime}
                    </span>
                  </div>
                ) : formData.seriesMode === "manual" ? (
                  <>
                    {formData.eventDate && (
                      <div className="flex justify-between items-center bg-white rounded p-2 border border-blue-200">
                        <span className="font-medium text-blue-700">
                          {new Date(formData.eventDate).toLocaleDateString("de-DE", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                        <span className="text-blue-600">
                          {formData.startTime} - {formData.endTime}
                        </span>
                      </div>
                    )}
                    {formData.additionalDates.map((date, index) => {
                      if (!date) return null
                      return (
                        <div
                          key={index}
                          className="flex justify-between items-center bg-white rounded p-2 border border-blue-200"
                        >
                          <span className="font-medium text-blue-700">
                            {new Date(date).toLocaleDateString("de-DE", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                          <span className="text-blue-600">
                            {formData.additionalStartTimes?.[index] || formData.startTime} -{" "}
                            {formData.additionalEndTimes?.[index] || formData.endTime}
                          </span>
                        </div>
                      )
                    })}
                  </>
                ) : (
                  // Series mode preview
                  (() => {
                    const seriesDates = generateSeriesDates(
                      formData.eventDate,
                      formData.frequency,
                      formData.customIntervalNumber,
                      formData.customIntervalUnit,
                      formData.weeklyDays,
                      formData.monthlyType,
                      formData.monthlyDay,
                      formData.monthlyWeekday,
                      formData.monthlyWeekdayPosition,
                      formData.seriesEndType,
                      formData.seriesEndDate,
                      formData.seriesEndCount,
                    )

                    return seriesDates.map((date, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-white rounded p-2 border border-blue-200"
                      >
                        <span className="font-medium text-blue-700">
                          {new Date(date).toLocaleDateString("de-DE", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                        <span className="text-blue-600">
                          {formData.startTime} - {formData.endTime}
                        </span>
                      </div>
                    ))
                  })()
                )}
              </div>
              <div className="mt-3 text-sm text-blue-600 font-medium">
                Gesamt:{" "}
                {formData.frequency === "einmalig"
                  ? 1
                  : formData.seriesMode === "manual"
                    ? (formData.eventDate ? 1 : 0) + formData.additionalDates.filter((date) => date).length
                    : generateSeriesDates(
                        formData.eventDate,
                        formData.frequency,
                        formData.customIntervalNumber,
                        formData.customIntervalUnit,
                        formData.weeklyDays,
                        formData.monthlyType,
                        formData.monthlyDay,
                        formData.monthlyWeekday,
                        formData.monthlyWeekdayPosition,
                        formData.seriesEndType,
                        formData.seriesEndDate,
                        formData.seriesEndCount,
                      ).length}{" "}
                Termine geplant
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="location" className="font-body text-gray-700">
              Ort *
            </Label>
            <div className="space-y-4">
              <Select
                value={locationType}
                onValueChange={(value: "local" | "virtual") => {
                  setLocationType(value)
                  handleInputChange("isOnline", value === "virtual")
                }}
              >
                <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local (vor Ort)</SelectItem>
                  <SelectItem value="virtual">Virtuell (online)</SelectItem>
                </SelectContent>
              </Select>

              {locationType === "local" && (
                <div>
                  <AddressAutocomplete
                    label=""
                    placeholder="Location, Ort oder Adresse"
                    value={formData.location}
                    onChange={(value) => handleInputChange("location", value)}
                    className="border-2 border-orange-200 focus:border-orange-400"
                    error={fieldErrors.location || errors.location}
                  />
                </div>
              )}

              {locationType === "virtual" && (
                <Input
                  placeholder="Einladungslink (Discord, Zoom, etc.)"
                  value={formData.onlinePlatform}
                  onChange={(e) => handleInputChange("onlinePlatform", e.target.value)}
                  className="border-2 border-orange-200 focus:border-orange-400"
                />
              )}
              {errors.onlinePlatform && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.onlinePlatform}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Games & Participants */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-500 font-body mb-4">
              Wähle Spiele aus deinem Spieleregal oder suche gerne andere aus der Datenbank
            </p>

            <div className="space-y-4">
              {/* Personal Library Section */}
              <div className="border-2 border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <Button
                    type="button"
                    onClick={() => setShowGameShelfModal(true)}
                    variant="outline"
                    className="border-2 border-dashed border-orange-200 hover:border-orange-300 text-gray-600 hover:text-gray-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Aus Spielregal auswählen
                  </Button>
                </div>

                {selectedGames.filter((game) => !game.isBggGame).length === 0 && (
                  <div className="text py-2 text-gray-500">
                    <p className="text-sm">Klicke auf "Aus Spielregal auswählen", um Spiele hinzuzufügen</p>
                  </div>
                )}
              </div>

              <div className="border-2 border-orange-200 rounded-lg p-4">
                <Label className="font-body text-gray-700 text-sm mb-2 block">Aus der Datenbank suchen</Label>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Beliebiges Spiel suchen ..."
                    value={bggSearchTerm}
                    onChange={(e) => {
                      setBggSearchTerm(e.target.value)
                      searchBoardGameGeek(e.target.value)
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {bggSearchLoading && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Durchsuche Datenbank...</p>
                  </div>
                )}

                {bggSearchResults.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {bggSearchResults.map((game) => {
                      const isSelected = selectedGames.some((g) => g.id === game.id)
                      return (
                        <div
                          key={game.id}
                          className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                            isSelected ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={() => handleGameShelfSelection(game)}
                        >
                          <div className="aspect-square bg-gray-100 rounded-md mb-2 overflow-hidden">
                            <img
                              src={game.image || "/placeholder.svg"}
                              alt={game.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                              }}
                            />
                          </div>
                          <h4 className="font-medium text-sm text-gray-900 line-clamp-2">{game.title}</h4>
                          {game.year && <p className="text-xs text-gray-500">({game.year})</p>}
                          {game.publisher && <p className="text-xs text-gray-600">{game.publisher}</p>}
                          {/* <div className="flex flex-wrap gap-1">
                            <Badge className="bg-blue-100 text-blue-800 text-xs">BGG</Badge>
                            {game.players !== "Unbekannt" && (
                              <Badge variant="outline" className="text-xs">
                                {game.players}
                              </Badge>
                            )}
                          </div> */}
                        </div>
                      )
                    })}
                  </div>
                )}

                {bggSearchTerm && !bggSearchLoading && bggSearchResults.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Keine Spiele gefunden für "{bggSearchTerm}"</p>
                    <p className="text-xs mt-1">Versuche einen anderen Suchbegriff</p>
                  </div>
                )}
              </div>

              {selectedGames.length > 0 && (
                <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                  <Label className="font-body text-gray-700 text-sm mb-3 block">Ausgewählte Spiele für das Event</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {selectedGames.map((game) => (
                      <div key={game.id} className="border border-gray-200 rounded-lg p-3 bg-white relative">
                        <button
                          type="button"
                          onClick={() => handleRemoveGame(game.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors z-10"
                        >
                          ×
                        </button>
                        <div className="aspect-square bg-gray-100 rounded-md mb-2 overflow-hidden">
                          <img
                            src={game.image || "/placeholder.svg"}
                            alt={game.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h4 className="font-medium text-sm text-gray-900 line-clamp-2">{game.title}</h4>
                        {/* <div className="flex flex-wrap gap-1 mt-1">
                          {game.isBggGame ? (
                            <Badge className="bg-blue-100 text-orange-800 text-xs">BGG</Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-800 text-xs">Bibliothek</Badge>
                          )}
                        </div> */}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Settings & Publication */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div>
            <Label htmlFor="visibility" className="font-body text-gray-700">
              Sichtbarkeit *
            </Label>
            <Select value={formData.visibility} onValueChange={(value) => handleInputChange("visibility", value)}>
              <SelectTrigger className="mt-1 border-2 border-orange-200 focus:border-orange-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  Für alle sichtbar (Jeder kann das Event sehen und sich hierfür anmelden)
                </SelectItem>
                {/* <SelectItem value="friends">Nur Freunde (Nur deine Freunde können das Event sehen)</SelectItem> */}
                {/* Update visibility select options */}
                <SelectItem value="friends_only">
                  Mit Einladung (Nur ausgewählte Freunde können das Event sehen)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Update condition to check for friends_only */}
          {formData.visibility === "friends_only" && (
            <div className="space-y-4">
              <div>
                <Label className="font-body text-gray-700">Freunde einladen</Label>
                <p className="text-sm text-gray-500 mt-1">
                  Wähle Freunde aus, die du zu diesem Event einladen möchtest.
                </p>
                <div className="mt-2 space-y-3">
                  <Button
                    type="button"
                    onClick={() => setShowFriendDialog(true)}
                    variant="outline"
                    className="w-full border-2 border-dashed border-orange-200 hover:border-orange-300 text-gray-600 hover:text-gray-700"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Freunde auswählen ({selectedFriends.length} ausgewählt)
                  </Button>

                  {selectedFriends.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Ausgewählte Freunde:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedFriends.map((friend) => (
                          <div
                            key={friend.id}
                            className="flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm"
                          >
                            <div className="w-6 h-6 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {friend.name[0].toUpperCase()}
                            </div>
                            <span>{friend.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSelectedFriend(friend.id)}
                              className="text-orange-600 hover:text-orange-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Friend game requests section */}
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-gray-700">Spiele von Freunden anfragen:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedFriends.map((friend) => (
                            <Button
                              key={friend.id}
                              type="button"
                              onClick={() => setShowFriendGameDialog({ friendId: friend.id, friendName: friend.name })}
                              variant="outline"
                              className="justify-start text-left"
                            >
                              <Gamepad2 className="w-4 h-4 mr-2" />
                              <span className="truncate">
                                {friend.name}
                                {friendGameRequests[friend.id]?.length > 0 && (
                                  <span className="ml-1 text-xs bg-teal-100 text-teal-800 px-1 rounded">
                                    {friendGameRequests[friend.id].length}
                                  </span>
                                )}
                              </span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Update condition to exclude friends_only from approval settings */}
          {formData.visibility !== "friends_only" && (
            <div>
              <Label htmlFor="requiresApproval" className="font-body text-gray-700">
                Teilnahmemodalitäten *
              </Label>
              <Select
                value={formData.requiresApproval ? "manual" : "automatic"}
                onValueChange={(value) => handleInputChange("requiresApproval", value === "manual")}
              >
                <SelectTrigger className="mt-1 border-2 border-orange-200 focus:border-orange-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">
                    Direkte Teilnahme (Mitglieder können sich direkt für das Event anmelden)
                  </SelectItem>
                  <SelectItem value="manual">
                    Teilnahme erst nach Genehmigung (Du genehmigst jede Teilnahme-Anfrage)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="rules" className="font-body text-gray-700">
              Zusatzinfos & Hinweise
            </Label>
            <Textarea
              id="rules"
              placeholder="z.B. Spezielle Hausregeln, was mitzubringen ist..."
              value={formData.rules}
              onChange={(e) => handleInputChange("rules", e.target.value)}
              className="mt-1 min-h-[80px] border-2 border-orange-200 focus:border-orange-400 font-body"
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <Trash2 className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 font-body">{submitError}</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <div>
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="border-2 border-gray-300 text-gray-600 hover:bg-gray-50 font-handwritten bg-transparent"
              disabled={isSubmitting}
            >
              Zurück
            </Button>
          )}
        </div>

        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-2 border-gray-300 text-gray-600 hover:bg-gray-50 font-handwritten bg-transparent"
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white font-handwritten"
              disabled={isSubmitting}
            >
              Weiter
            </Button>
          ) : (
            /* Updated final submit button text */
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-400 to-teal-400 hover:from-green-500 hover:to-teal-500 text-white font-handwritten"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Erstelle Event...
                </div>
              ) : (
                <>
                  <Dice6 className="w-4 h-4 mr-2" />
                  Event erstellen
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Friend Selection Dialog */}
      <Dialog open={showFriendDialog} onOpenChange={setShowFriendDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="font-handwritten text-xl">Freunde auswählen</DialogTitle>
          </DialogHeader>

          {/* Search Field */}
          <div className="px-1 pb-4">
            <Input
              placeholder="Freunde suchen..."
              value={friendSearchTerm}
              onChange={(e) => setFriendSearchTerm(e.target.value)}
              className="border-2 border-pink-200 focus:border-pink-400"
            />
          </div>

          <div className="overflow-y-auto max-h-96">
            {friends.length > 0 ? (
              filteredFriends.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleFriendToggle(friend)}
                    >
                      <Checkbox
                        checked={selectedFriends.some((f) => f.id === friend.id)}
                        onChange={() => handleFriendToggle(friend)}
                      />
                      <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                        {friend.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium font-body">{friend.name}</h4>
                        {friend.email && <p className="text-sm text-gray-500">{friend.email}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-body">Keine Freunde gefunden für "{friendSearchTerm}"</p>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-body">Du hast noch keine Freunde hinzugefügt</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={() => {
                setShowFriendDialog(false)
                setFriendSearchTerm("") // Reset search when closing
              }}
              className="bg-pink-400 hover:bg-pink-500 text-white font-handwritten"
            >
              Fertig ({selectedFriends.length} ausgewählt)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showFriendGameDialog} onOpenChange={() => setShowFriendGameDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Gamepad2 className="h-5 w-5 mr-2" />
              Spiele von {showFriendGameDialog?.friendName} anfragen
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-2">
              Wähle Spiele aus dem Regal von {showFriendGameDialog?.friendName}, die zum Event mitgebracht werden sollen
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search bar for friend's games */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Spiele durchsuchen..."
                value={friendGameSearchTerm}
                onChange={(e) => setFriendGameSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {filteredFriendGames.length === 0 ? (
              <div className="text-center py-8">
                <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Keine Spiele gefunden</p>
                <p className="text-sm text-gray-500 mt-2">
                  {friendGameSearchTerm
                    ? "Versuche einen anderen Suchbegriff"
                    : `${showFriendGameDialog?.friendName} hat noch keine Spiele im Spielregal`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredFriendGames.map((game) => {
                  const isRequested = friendGameRequests[showFriendGameDialog?.friendId || ""]?.some(
                    (g) => g.id === game.id,
                  )
                  const isAvailable = game.available?.includes("available")
                  const isSelected = selectedGames.some((g) => g.id === game.id)

                  return (
                    <div
                      key={game.id}
                      className={`border rounded-lg p-3 transition-colors ${"hover:bg-gray-50"} ${isSelected ? "border-teal-500 bg-teal-50" : "border-gray-200"}`}
                      onClick={() => handleGameShelfSelection(game)} // removed availability check to allow selecting unavailable games
                    >
                      <div className="absolute top-2 left-2 z-10">
                        <div
                          className={`w-3 h-3 rounded-full border border-white shadow-sm ${
                            isAvailable ? "bg-green-500" : "bg-red-500"
                          }`}
                          title={isAvailable ? "Verfügbar" : "Nicht verfügbar"}
                        />
                      </div>

                      <div className="aspect-square bg-gray-100 rounded-md mb-2 overflow-hidden">
                        <img
                          src={game.image || "/placeholder.svg"}
                          alt={game.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className={`font-medium text-sm truncate ${isAvailable ? "text-gray-900" : "text-gray-500"}`}>
                        {game.title}
                      </h4>
                      {game.publisher && (
                        <p className={`text-xs truncate ${isAvailable ? "text-gray-500" : "text-gray-400"}`}>
                          {game.publisher}
                        </p>
                      )}

                      {!isAvailable && <p className="text-xs text-red-500 mt-1">Nicht verfügbar</p>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Game Shelf Selection Modal */}
      <Dialog open={showGameShelfModal} onOpenChange={setShowGameShelfModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Library className="h-5 w-5 mr-2" />
              Spiele aus deinem Spielregal auswählen
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <div className="flex gap-1">
                <button
                  onClick={() => setAvailabilityFilter("all")}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    availabilityFilter === "all" ? "bg-teal-500 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Alle
                </button>
                <button
                  onClick={() => setAvailabilityFilter("available")}
                  className={`px-3 py-1 text-xs rounded-full transition-colors flex items-center gap-1 ${
                    availabilityFilter === "available"
                      ? "bg-green-500 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Verfügbar
                </button>
                <button
                  onClick={() => setAvailabilityFilter("unavailable")}
                  className={`px-3 py-1 text-xs rounded-full transition-colors flex items-center gap-1 ${
                    availabilityFilter === "unavailable"
                      ? "bg-red-500 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Nicht verfügbar
                </button>
              </div>
            </div>

            {userGames.length === 0 ? (
              <div className="text-center py-8">
                <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Du hast noch keine Spiele in deinem Spielregal</p>
                <p className="text-sm text-gray-500 mt-2">Füge zuerst Spiele zu deiner Bibliothek hinzu</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userGames
                  .filter((game) => {
                    const isAvailable = game.available?.includes("available")
                    if (availabilityFilter === "available") return isAvailable
                    if (availabilityFilter === "unavailable") return !isAvailable
                    return true // 'all' shows everything
                  })
                  .map((game) => {
                    const isAvailable = game.available?.includes("available")
                    const isSelected = selectedGames.some((g) => g.id === game.id)

                    return (
                      <div
                        key={game.id}
                        className={`border rounded-lg p-3 transition-colors relative ${
                          isAvailable ? "hover:bg-gray-50 cursor-pointer" : "opacity-60 cursor-not-allowed bg-gray-50"
                        } ${isSelected ? "border-teal-500 bg-teal-50" : "border-gray-200"}`}
                        onClick={() => isAvailable && handleGameShelfSelection(game)}
                      >
                        <div className="absolute top-2 left-2 z-10">
                          <div
                            className={`w-3 h-3 rounded-full border border-white shadow-sm ${
                              isAvailable ? "bg-green-500" : "bg-red-500"
                            }`}
                            title={isAvailable ? "Verfügbar" : "Nicht verfügbar"}
                          />
                        </div>

                        <div className="aspect-square bg-gray-100 rounded-md mb-2 overflow-hidden">
                          <img
                            src={game.image || "/placeholder.svg"}
                            alt={game.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h4
                          className={`font-medium text-sm truncate ${isAvailable ? "text-gray-900" : "text-gray-500"}`}
                        >
                          {game.title}
                        </h4>
                        {game.publisher && (
                          <p className={`text-xs truncate ${isAvailable ? "text-gray-500" : "text-gray-400"}`}>
                            {game.publisher}
                          </p>
                        )}

                        {!isAvailable && <p className="text-xs text-red-500 mt-1">Nicht verfügbar</p>}
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
