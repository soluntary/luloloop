"use client"

import type React from "react"
import { useEffect } from "react"
import { Search, Gamepad2, X, Library, Upload, AlertCircle, Loader2, Plus, Trash2, Dice6, Users } from "lucide-react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createLudoEvent } from "@/app/actions/ludo-events"
import { useAuth } from "@/contexts/auth-context"
import { useGames } from "@/contexts/games-context"
import { useFriends } from "@/contexts/friends-context"
import { SlPicture } from "react-icons/sl"
import { toast } from "react-hot-toast"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Badge } from "@/components/ui/badge" // Import Badge

// Assume supabase client is imported and initialized elsewhere if needed for direct DB calls
// import { supabase } from "@/lib/supabaseClient"; // Example import

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
  initialData?: any
  onEventCreated?: (newEvent: any) => void // Added for Supabase integration callback
  onClose: () => void // Added for Supabase integration callback
}

interface TimeSlot {
  id: string
  date: string
  timeFrom: string
  timeTo: string
}

const parseLocalDate = (dateString: string): Date => {
  // Parse date string as local date, not UTC
  // "2025-02-30" should be February 30 in local timezone, not UTC
  const [year, month, day] = dateString.split("-").map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

const adjustStartDateToMatchWeekdays = (startDate: string, weeklyDays: string[]): string => {
  if (!startDate || weeklyDays.length === 0) return startDate

  const germanToEnglishDay = (germanDay: string): string => {
    const dayMap: Record<string, string> = {
      Montag: "Monday",
      Dienstag: "Tuesday",
      Mittwoch: "Wednesday",
      Donnerstag: "Thursday",
      Freitag: "Friday",
      Samstag: "Saturday",
      Sonntag: "Sunday",
    }
    return dayMap[germanDay] || germanDay
  }

  const englishWeeklyDays = weeklyDays.map(germanToEnglishDay)
  const start = new Date(startDate)
  const startDayOfWeek = start.toLocaleDateString("en-US", { weekday: "long" })

  // If start date already matches one of the selected weekdays, return it
  if (englishWeeklyDays.includes(startDayOfWeek)) {
    return startDate
  }

  // Find the nearest future date that matches one of the selected weekdays
  let daysToAdd = 1
  while (daysToAdd <= 7) {
    const tempDate = new Date(start)
    tempDate.setDate(tempDate.getDate() + daysToAdd)
    const dayOfWeek = tempDate.toLocaleDateString("en-US", { weekday: "long" })

    if (englishWeeklyDays.includes(dayOfWeek)) {
      return tempDate.toISOString().split("T")[0]
    }
    daysToAdd++
  }

  return startDate
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

  // Helper function to parse date string as local date
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number)
    return new Date(year, month - 1, day, 0, 0, 0, 0)
  }

  // Normalize end date to midnight for proper comparison
  const endDate = seriesEndDate ? parseLocalDate(seriesEndDate) : null

  const maxCount = seriesEndCount ? Number.parseInt(seriesEndCount) : 100

  console.log("[v0] generateSeriesDates called with:", {
    startDate,
    seriesEndDate,
    frequency,
    weeklyDays,
    seriesEndType,
  })

  const germanToEnglishDay = (germanDay: string): string => {
    const dayMap: Record<string, string> = {
      Montag: "Monday",
      Dienstag: "Tuesday",
      Mittwoch: "Wednesday",
      Donnerstag: "Thursday",
      Freitag: "Friday",
      Samstag: "Saturday",
      Sonntag: "Sunday",
    }
    return dayMap[germanDay] || germanDay
  }

  // Helper function to get next date based on frequency
  const getNextDate = (currentDate: Date, isFirstIteration = false): Date => {
    const next = new Date(currentDate)

    if (frequency === "wöchentlich" && weeklyDays.length > 0) {
      const englishWeeklyDays = weeklyDays.map(germanToEnglishDay)

      if (isFirstIteration) {
        // For the first iteration, check if current date matches any selected weekday
        const currentDayOfWeek = currentDate.toLocaleDateString("en-US", { weekday: "long" })
        if (englishWeeklyDays.includes(currentDayOfWeek)) {
          // Current date is already a selected weekday, return it
          return new Date(currentDate)
        }
      }

      // Find the next occurrence of a selected weekday
      let daysToAdd = isFirstIteration ? 0 : 1
      const maxDaysToCheck = isFirstIteration ? 7 : 14 // Check up to 2 weeks ahead

      while (daysToAdd < maxDaysToCheck) {
        const tempDate = new Date(currentDate)
        tempDate.setDate(tempDate.getDate() + daysToAdd)
        const dayOfWeek = tempDate.toLocaleDateString("en-US", { weekday: "long" })

        if (englishWeeklyDays.includes(dayOfWeek)) {
          return tempDate
        }
        daysToAdd++
      }

      // Fallback: return next week
      next.setDate(next.getDate() + 7)
      return next
    }

    if (frequency === "monatlich") {
      console.log("[v0] Monthly calculation - Before:", {
        currentDate: currentDate.toISOString(),
        currentDay: currentDate.getDate(),
        currentMonth: currentDate.getMonth(),
        timezoneOffset: currentDate.getTimezoneOffset(),
      })

      // Set to day 1 first to avoid month overflow issues when current day > days in next month
      next.setDate(1)
      console.log("[v0] After setDate(1):", {
        date: next.toISOString(),
        day: next.getDate(),
        month: next.getMonth(),
      })

      // Now increment to next month
      next.setMonth(next.getMonth() + 1)
      console.log("[v0] After setMonth(+1):", {
        date: next.toISOString(),
        day: next.getDate(),
        month: next.getMonth(),
      })

      if (monthlyType === "day" && monthlyDay) {
        const dayOfMonth = Number.parseInt(monthlyDay)
        if (dayOfMonth) {
          // Set the desired day of month
          next.setDate(dayOfMonth)
          console.log("[v0] After setDate(dayOfMonth):", {
            date: next.toISOString(),
            day: next.getDate(),
            month: next.getMonth(),
            requestedDay: dayOfMonth,
          })

          // Check if the date rolled over (e.g., Feb 31 -> Mar 3)
          if (next.getDate() !== dayOfMonth) {
            // Invalid day for this month, use last day of month
            console.log("[v0] Date rolled over, adjusting to last day of month")
            next.setDate(0)
            console.log("[v0] After setDate(0):", {
              date: next.toISOString(),
              day: next.getDate(),
              month: next.getMonth(),
            })
          }
        }
      } else if (monthlyType === "weekday" && monthlyWeekday && monthlyWeekdayPosition) {
        // Convert German weekday to English for comparison
        const targetWeekday = germanToEnglishDay(monthlyWeekday).toLowerCase()
        const targetPosition = monthlyWeekdayPosition.toLowerCase()

        // Start from the first day of the target month
        const targetMonth = next.getMonth()
        const targetYear = next.getFullYear()

        let count = 0
        let foundDate: Date | null = null
        const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate()

        for (let day = 1; day <= daysInMonth; day++) {
          const tempDate = new Date(targetYear, targetMonth, day)
          const currentWeekday = tempDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()

          if (currentWeekday === targetWeekday) {
            count++
            if (
              (targetPosition === "first" && count === 1) ||
              (targetPosition === "second" && count === 2) ||
              (targetPosition === "third" && count === 3) ||
              (targetPosition === "fourth" && count === 4)
            ) {
              foundDate = tempDate
              break
            }
            // For "last", keep updating until we find the last occurrence
            if (targetPosition === "last") {
              foundDate = tempDate
            }
          }
        }

        if (foundDate) {
          return foundDate
        }
      }

      console.log("[v0] Monthly calculation - Final result:", {
        date: next.toISOString(),
        day: next.getDate(),
        month: next.getMonth(),
        localDateString: next.toLocaleDateString("de-DE"),
      })

      return next
    }

    // Handle other frequencies
    switch (frequency) {
      case "täglich":
        next.setDate(next.getDate() + 1)
        break

      case "jährlich":
        next.setFullYear(next.getFullYear() + 1)
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
          default:
            next.setDate(next.getDate() + 1)
            break
        }
        break

      default:
        next.setDate(next.getDate() + 1)
        break
    }

    return next
  }

  let count = 0
  let isFirstIteration = true

  while (true) {
    // Normalize current date for comparison
    const currentNormalized = new Date(current)
    currentNormalized.setHours(0, 0, 0, 0)

    console.log("[v0] Loop iteration:", {
      current: current.toISOString().split("T")[0],
      endDate: endDate?.toISOString().split("T")[0],
      comparison: endDate ? currentNormalized.getTime() - endDate.getTime() : "no end date",
    })

    // This ensures the end date is included if it matches the recurrence pattern
    if (seriesEndType === "date" && endDate && currentNormalized.getTime() > endDate.getTime()) {
      console.log("[v0] Breaking because current date is after end date")
      break
    }
    if (seriesEndType === "count" && count >= maxCount) {
      console.log("[v0] Breaking because count reached max")
      break
    }

    // Add current date if it's valid and not already added
    const isoDate = current.toISOString().split("T")[0]
    if (!dates.includes(isoDate)) {
      console.log("[v0] Adding date:", isoDate)
      dates.push(isoDate)
      count++
    }

    // Get next date
    current = getNextDate(current, isFirstIteration)
    isFirstIteration = false

    // Safety break to prevent infinite loops
    if (dates.length > 365 * 5) {
      console.warn("generateSeriesDates: Exceeded maximum date generation limit.")
      break
    }
  }

  console.log("[v0] Generated dates:", dates)
  return dates
}

export default function CreateLudoEventForm({
  onSuccess,
  onCancel,
  initialData,
  onEventCreated,
  onClose,
}: CreateLudoEventFormProps) {
  console.log("[v0] CreateLudoEventForm mounted, initialData:", initialData)
  console.log("[v0] InitialData keys:", initialData ? Object.keys(initialData) : "undefined")
  console.log("[v0] InitialData title:", initialData?.title)
  console.log("[v0] InitialData event_date:", initialData?.event_date)
  console.log("[v0] InitialData first_instance_date:", initialData?.first_instance_date)
  console.log("[v0] InitialData games:", initialData?.games)
  console.log("[v0] InitialData selected_games:", initialData?.selected_games)

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

  const parseSelectedGames = (data: any) => {
    if (!data?.selected_games) return []

    if (Array.isArray(data.selected_games)) {
      // Map through array and parse each JSON string
      return data.selected_games
        .map((game: any) => {
          if (typeof game === "string") {
            try {
              return JSON.parse(game)
            } catch (e) {
              console.error("[v0] Failed to parse game:", game, e)
              return null
            }
          }
          // If already an object, return as-is
          return game
        })
        .filter(Boolean) // Remove any null values from failed parsing
    }

    // If it's a single string, try to parse it
    if (typeof data.selected_games === "string") {
      try {
        const parsed = JSON.parse(data.selected_games)
        return Array.isArray(parsed) ? parsed : [parsed]
      } catch (e) {
        console.error("[v0] Failed to parse selected_games string:", data.selected_games, e)
        return []
      }
    }

    return []
  }

  const getEventDate = (data: any) => {
    return data?.first_instance_date || data?.event_date || ""
  }

  const [selectedImages, setSelectedImages] = useState<string[]>(
    initialData?.images || (initialData?.image ? [initialData.image] : []),
  )
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([])

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    maxPlayers: initialData?.max_participants?.toString() || "4",
    frequency: (initialData?.frequency || "einmalig") as
      | "einmalig"
      | "täglich"
      | "wöchentlich"
      | "monatlich"
      | "jährlich"
      | "andere",
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
    eventDate: getEventDate(initialData),
    additionalDates: [] as string[],
    startTime: initialData?.start_time || "",
    endTime: initialData?.end_time || "",
    location: initialData?.location || "",
    locationDetails: initialData?.location_details || "", // Added for location details
    isOnline: initialData?.is_online || false,
    onlinePlatform: initialData?.online_platform || "",
    visibility: (initialData?.visibility || "public") as "public" | "friends_only",
    requiresApproval: initialData?.requires_approval || false,
    organizerOnly: initialData?.organizer_only || false,
    prizeInfo: initialData?.prize_info || "",
    rules: initialData?.rules || "",
    additionalInfo: initialData?.additional_info || "",
    // Update selectedImage to selectedImages for multi-image support
    selectedImage: initialData?.image || "",
    selectedImages: initialData?.images || [], // Added for multi-image support
    selectedImageFile: null as File | null,
    invitedFriends: initialData?.invited_friends || ([] as string[]),
    selectedGames: parseSelectedGames(initialData),
    additionalStartTimes: [] as string[],
    additionalEndTimes: [] as string[],
    // Added for Supabase submission
    date: getEventDate(initialData),
    maxParticipants: initialData?.max_participants?.toString() || "", // Assuming this maps to max_participants
    gameType: "",
    difficultyLevel: "",
    isPublic: initialData?.visibility === "public" || true, // Assuming this maps to visibility
    otherGames: "", // Not directly used in Supabase submission but kept for form state
    notes: initialData?.notes || "", // Added for notes
    approvalRequired: initialData?.approval_required || false, // Mapped to requiresApproval
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
    if (
      formData.frequency === "wöchentlich" &&
      formData.seriesMode === "series" &&
      formData.weeklyDays.length > 0 &&
      formData.eventDate
    ) {
      const startDate = new Date(formData.eventDate)
      const dayNames = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]
      const currentDay = dayNames[startDate.getDay()]

      // Check if current start date matches one of the selected weekdays
      if (!formData.weeklyDays.includes(currentDay)) {
        // Find the next matching weekday
        const dayIndices = formData.weeklyDays.map((day) => dayNames.indexOf(day)).sort((a, b) => a - b)
        const currentDayIndex = startDate.getDay()

        // Find the next matching day
        let nextDayIndex = dayIndices.find((idx) => idx > currentDayIndex)
        if (nextDayIndex === undefined) {
          // If no day later in the week, take the first selected day of next week
          nextDayIndex = dayIndices[0] + 7
        }

        // Calculate days to add
        const daysToAdd = nextDayIndex - currentDayIndex
        const newDate = new Date(startDate)
        newDate.setDate(newDate.getDate() + daysToAdd)

        // Update the start date
        const formattedDate = newDate.toISOString().split("T")[0]
        setFormData((prev) => ({ ...prev, eventDate: formattedDate }))

        console.log(
          `[v0] Adjusted start date from ${formData.eventDate} (${currentDay}) to ${formattedDate} (${dayNames[newDate.getDay()]}) to match selected weekdays`,
        )
      }
    }
  }, [formData.weeklyDays, formData.frequency, formData.seriesMode, formData.eventDate]) // Added eventDate dependency

  useEffect(() => {
    // Initialize form values with initialData, including selectedGames, friends, etc.
    if (initialData) {
      setSelectedGames(initialData.games || parseSelectedGames(initialData))
      setSelectedFriends(
        (initialData.invited_friends || []).map((friendId: string) => friends.find((f) => f.id === friendId)),
      )
      setFriendGameRequests(initialData.friendGameRequests || {})
      setCustomGames(initialData.customGames || [])
      // Set frequency and series mode based on initial data
      if (initialData.frequency && initialData.frequency !== "einmalig") {
        if (initialData.seriesMode) {
          handleInputChange("seriesMode", initialData.seriesMode)
        }
        if (initialData.frequency === "wöchentlich" && initialData.weeklyDays) {
          handleInputChange("weeklyDays", initialData.weeklyDays)
        }
        if (initialData.frequency === "monatlich") {
          if (initialData.monthlyType) handleInputChange("monthlyType", initialData.monthlyType)
          if (initialData.monthlyDay) handleInputChange("monthlyDay", initialData.monthlyDay)
          if (initialData.monthlyWeekday) handleInputChange("monthlyWeekday", initialData.monthlyWeekday)
          if (initialData.monthlyWeekdayPosition)
            handleInputChange("monthlyWeekdayPosition", initialData.monthlyWeekdayPosition)
        }
        if (initialData.frequency === "andere") {
          if (initialData.customIntervalNumber)
            handleInputChange("customIntervalNumber", initialData.customIntervalNumber.toString())
          if (initialData.customIntervalUnit) handleInputChange("customIntervalUnit", initialData.customIntervalUnit)
        }
        if (initialData.seriesEndType) handleInputChange("seriesEndType", initialData.seriesEndType)
        if (initialData.seriesEndDate) handleInputChange("seriesEndDate", initialData.seriesEndDate)
        if (initialData.seriesEndCount) handleInputChange("seriesEndCount", initialData.seriesEndCount.toString())
      }
      if (initialData.additionalDates) {
        handleInputChange("additionalDates", initialData.additionalDates)
      }
      if (initialData.additionalStartTimes) {
        handleInputChange("additionalStartTimes", initialData.additionalStartTimes)
      }
      if (initialData.additionalEndTimes) {
        handleInputChange("additionalEndTimes", initialData.additionalEndTimes)
      }
      if (initialData.locationType) {
        setLocationType(initialData.locationType)
        handleInputChange("isOnline", initialData.locationType === "virtual")
      } else {
        setLocationType(initialData.is_online ? "virtual" : "local")
      }
      if (initialData.gameType) handleInputChange("gameType", initialData.gameType)
      if (initialData.difficultyLevel) handleInputChange("difficultyLevel", initialData.difficultyLevel)
      // Map Supabase fields to form state
      if (initialData.approval_required !== undefined)
        handleInputChange("approvalRequired", initialData.approval_required)
      if (initialData.notes) handleInputChange("notes", initialData.notes)
    }

    // Initialize location type
    if (initialData?.is_online) {
      setLocationType("virtual")
    } else {
      setLocationType("local")
    }

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
  }, [initialData, friends, userGames]) // Add dependencies

  const handleInputChange = (field: string, value: any) => {
    console.log(`[v0] Input change - Field: ${field}, Value: ${value}`)
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }

      if (
        field === "weeklyDays" &&
        prev.frequency === "wöchentlich" &&
        prev.seriesMode === "series" &&
        prev.eventDate
      ) {
        const adjustedDate = adjustStartDateToMatchWeekdays(prev.eventDate, value)
        if (adjustedDate !== prev.eventDate) {
          newData.eventDate = adjustedDate
          toast.success(
            `Start-Datum wurde auf ${new Date(adjustedDate).toLocaleDateString("de-DE")} angepasst, um mit den ausgewählten Wochentagen übereinzustimmen.`,
          )
        }
      }

      console.log(`[v0] Updated form data for ${field}:`, newData[field])
      return newData
    })
  }

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
      isBggGame: game.isBggGame, // Ensure isBggGame is passed
    }

    setSelectedGames((prev) => {
      if (prev.some((g) => g.id === game.id)) {
        return prev // Game already selected
      }
      return [...prev, gameForEvent] // Add the game object
    })

    setShowGameShelfModal(false)
    setShowFriendGameDialog(null) // Close friend game dialog if open
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
    const files = event.target.files
    if (!files) return

    setImageError(null)
    setIsUploadingImage(true)

    try {
      const uploadedUrls: string[] = []

      for (const file of Array.from(files)) {
        // Validate each file
        const validationError = validateImageFile(file)
        if (validationError) {
          setImageError(`${file.name}: ${validationError}`)
          continue
        }

        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`)
        }

        const result = await response.json()
        uploadedUrls.push(result.url)
      }

      // Update form data with all uploaded image URLs
      setSelectedImages((prev) => [...prev, ...uploadedUrls])
      setFormData((prev) => ({
        ...prev,
        selectedImage: [...(prev.selectedImage ? [prev.selectedImage] : []), ...uploadedUrls][0], // Keep first as main
        selectedImages: [...(prev.selectedImages || []), ...uploadedUrls],
      }))
    } catch (error) {
      console.error("Error uploading images:", error)
      setImageError("Fehler beim Hochladen der Bilder. Bitte versuchen Sie es erneut.")
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setFormData((prev) => ({
      ...prev,
      selectedImage: index === 0 ? prev.selectedImages?.[1] || "" : prev.selectedImage,
      selectedImages: (prev.selectedImages || []).filter((_, i) => i !== index),
    }))
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
    console.log("[v0] handleSubmit called!")
    e.preventDefault()
    console.log("[v0] preventDefault called, starting submission...")
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

      console.log("[v0] Validation passed, creating event...")

      // Upload images to storage
      const uploadedImageUrls: string[] = []
      if (formData.selectedImages && formData.selectedImages.length > 0) {
        console.log("[v0] Uploading images:", formData.selectedImages.length)
        for (const imageUrl of formData.selectedImages) {
          // Assuming imageUrls are already resolved URLs from the upload process
          // If not, you'd need to re-upload here or use a service that handles URL resolution
          uploadedImageUrls.push(imageUrl)
        }
      }

      const eventData = {
        title: formData.title,
        description: formData.description,
        location: formData.isOnline ? "Online" : formData.location,
        location_details: formData.locationDetails,
        is_online: formData.isOnline,
        event_date: formData.eventDate,
        start_time: formData.startTime,
        end_time: formData.endTime,
        max_players: formData.maxPlayers ? Number.parseInt(formData.maxPlayers) : null,
        frequency: formData.frequency,
        series_mode: formData.seriesMode,
        custom_interval_number: formData.customIntervalNumber ? Number.parseInt(formData.customIntervalNumber) : null,
        custom_interval_unit: formData.customIntervalUnit,
        additional_dates: formData.additionalDates,
        notes: formData.notes,
        games: selectedGames.map((game) => ({
          // Map to include only necessary fields for Supabase
          id: game.id,
          title: game.title,
          image: game.image,
          is_bgg_game: game.isBggGame,
        })),
        invited_friends: selectedFriends.map((friend) => friend.id), // Store only IDs
        visibility: formData.visibility,
        approval_required: formData.requiresApproval, // Use the mapped state property
        images: uploadedImageUrls,
        created_by: authUser.id,
        game_type: formData.gameType, // Added for Supabase
        difficulty_level: formData.difficultyLevel, // Added for Supabase
        online_platform: formData.onlinePlatform, // Added for Supabase
        organizer_only: formData.organizerOnly, // Added for Supabase
        prize_info: formData.prizeInfo, // Added for Supabase
        rules: formData.rules, // Added for Supabase
      }

      console.log("[v0] Creating event with data:", eventData)

      // Assuming supabase client is available and configured
      // const { data: newEvent, error } = await supabase
      //   .from("ludo_events")
      //   .insert([eventData])
      //   .select()
      //   .single()

      // If you want to keep the existing createLudoEvent action for now,
      // you'd need to adapt the eventData to match LudoEventData interface.
      // For the purpose of this merge, we will use the existing action call.

      const result = await createLudoEvent(
        {
          ...eventData, // Pass the newly structured eventData
          // Map specific fields to match LudoEventData if they differ
          maxParticipants: eventData.max_players, // Assuming LudoEventData uses 'maxParticipants'
          selectedGames: eventData.games, // Assuming LudoEventData uses 'selectedGames'
          selectedFriends: eventData.invited_friends, // Assuming LudoEventData uses 'selectedFriends'
          seriesMode: formData.seriesMode, // Assuming LudoEventData uses 'seriesMode'
          customIntervalNumber: eventData.custom_interval_number,
          customIntervalUnit: eventData.customIntervalUnit,
          weeklyDays: formData.weeklyDays,
          monthlyType: formData.monthlyType,
          monthlyDay: formData.monthlyDay ? Number.parseInt(formData.monthlyDay) : null,
          monthlyWeekday: formData.monthlyWeekday,
          monthlyWeekdayPosition: formData.monthlyWeekdayPosition,
          seriesEndType: formData.seriesEndType,
          seriesEndDate: formData.seriesEndDate,
          seriesEndCount: formData.seriesEndCount ? Number.parseInt(formData.seriesEndCount) : null,
          additionalDates: formData.additionalDates,
          additionalStartTimes: formData.additionalStartTimes,
          additionalEndTimes: formData.additionalEndTimes,
          visibility: formData.visibility,
          requiresApproval: formData.approvalRequired, // Use mapped property
          imageUrl: uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : "", // Assuming main image
          images: uploadedImageUrls,
          gameType: formData.gameType,
          difficultyLevel: formData.difficultyLevel,
          onlinePlatform: formData.onlinePlatform,
          organizerOnly: formData.organizerOnly,
          prizeInfo: formData.prizeInfo,
          rules: formData.rules,
          notes: formData.notes,
        },
        authUser.id, // Pass creator ID
      )

      if (result.success) {
        console.log("[v0] Event created successfully!")
        console.log("[v0] Created event data:", JSON.stringify(result.data, null, 2))

        if (formData.visibility === "friends_only" && selectedFriends.length > 0) {
          toast.success("Viel Spass! Dein Event wurde erstellt und an die ausgewählten Freunde gesendet!")
        } else {
          toast.success("Viel Spass! Dein Event wurde erstellt!")
        }

        console.log("[v0] Event created successfully, calling onSuccess callback")
        // onSuccess(result.data) // Call the original onSuccess callback if needed

        // Call the new onEventCreated callback for Supabase integration
        if (onEventCreated) {
          onEventCreated(result.data)
        }
        onClose() // Close the dialog/modal

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
          locationDetails: "",
          isOnline: false,
          onlinePlatform: "",
          visibility: "public" as "public" | "friends_only",
          requiresApproval: false,
          organizerOnly: false,
          prizeInfo: "",
          rules: "",
          additionalInfo: "",
          selectedImage: "",
          selectedImages: [],
          selectedImageFile: null as File | null,
          invitedFriends: [] as string[],
          selectedGames: [] as string[],
          additionalStartTimes: [] as string[],
          additionalEndTimes: [] as string[],
          date: "",
          maxParticipants: "",
          gameType: "",
          difficultyLevel: "",
          isPublic: true,
          otherGames: "",
          notes: "",
          approvalRequired: false,
        })
        setSelectedFriends([])
        setSelectedGames([])
        setSelectedImages([])
        setCustomGames([])
        setFriendGameRequests({})
        setTimeSlots([])
        setUseTimeSlots(false)
        setLocationType("local")
        setCurrentStep(1)
        setIsSubmitting(false)
      } else {
        console.error("[v0] Event creation failed:", result.error)
        console.log("[v0] Full error result:", JSON.stringify(result, null, 2))
        setSubmitError(result.error || "Fehler beim Erstellen des Events")
      }

      // Show success message and close dialog
      // setSubmitError(null)
      // onEventCreated?.(newEvent) // Call the callback with the newly created event
      // onClose()
    } catch (error: any) {
      // Catch any errors during the process
      console.error("[v0] Error in handleSubmit:", error)
      // Check if it's a Supabase error and extract message
      const errorMessage = error?.message || error?.error_description || "Ein unerwarteter Fehler ist aufgetreten."
      setSubmitError(errorMessage)
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
        return "Basis"
      case 2:
        return "Details"
      case 3:
        return "Spiele"
      case 4:
        return "Häufigkeit"
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
    <div className="flex flex-col h-full">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Progress Bar */}
        <div className="mb-6 border-b border-gray-200 pb-4">
          <div className="flex items-start justify-between">
            {[
              { step: 1, label: "Basis" },
              { step: 2, label: "Details" },
              { step: 3, label: "Spiele" },
              { step: 4, label: "Häufigkeit" },
            ].map(({ step, label }, index) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div className="flex items-center w-full">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep >= step ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step}
                  </div>
                  {step < 4 && (
                    <div className={`flex-1 h-1 mx-2 ${currentStep > step ? "bg-teal-600" : "bg-gray-200"}`} />
                  )}
                </div>
                <span
                  className={`text-sm mt-2 text-center ${
                    currentStep === step ? "font-semibold text-teal-600" : "text-gray-600"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{getStepTitle(currentStep)}</h3>
        </div>

        {/* Step 1: Ludo Event Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Gamepad2 className="w-5 h-5 text-teal-600" />
                <h3 className="font-semibold text-lg">Grundinformationen</h3>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Bilder</Label>
                <p className="text-xs text-gray-600 mb-4">
                  Lade bis zu 5 Bilder hoch, um dein Event attraktiver zu gestalten (optional)
                </p>

                {selectedImages.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedImages.map((img, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg overflow-hidden border border-gray-200"
                        >
                          <img
                            src={img || "/placeholder.svg"}
                            alt={`Event ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          {index === 0 && (
                            <Badge className="absolute bottom-2 left-2 text-[8px] bg-teal-500 text-white">
                              Hauptbild
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={isUploadingImage}
                      variant="outline"
                      className="w-full border-2 border-dashed border-gray-300 hover:border-teal-500 hover:bg-teal-50 bg-transparent"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      {isUploadingImage ? "Bilder werden verarbeitet..." : "Weitere Bilder hinzufügen"}
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={handleImageUpload}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-all"
                  >
                    <div className="flex flex-col items-center space-y-3">
                      {isUploadingImage ? (
                        <Loader2 className="h-10 w-10 text-gray-900 animate-spin" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <SlPicture className="h-6 w-6 text-gray-700" />
                        </div>
                      )}
                      <div>
                        <p className="text-gray-700 font-medium text-base">
                          {isUploadingImage ? "Bilder werden verarbeitet..." : "Klicken zum Hochladen"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          JPG, PNG oder WebP (max. 5MB pro Bild, bis zu 5 Bilder)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />

                {imageError && (
                  <p className="text-red-500 text-sm mt-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {imageError}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Titel <span className="text-red-500">*</span>
                </Label>
                <span className="text-xs text-gray-500">{formData.title.length}/60</span>
              </div>
              <Input
                id="title"
                placeholder="z.B. Gemütlicher CATAN Abend..."
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="text-sm h-11 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                maxLength={60}
              />
              {fieldErrors.title && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {fieldErrors.title}
                </p>
              )}
              {errors.title && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {errors.title}
                </p>
              )}
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block">
                Beschreibung
              </Label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => handleInputChange("description", value)}
                placeholder="Beschreibe dein Event: was möchtest du veranstalten?"
                className="mt-1 text-sm"
                rows={5}
                maxLength={5000}
              />
            </div>
          </div>
        )}
        {/* Step 2: Date & Location */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <div className="flex items-start space-x-3">
                <input
                  id="organizerOnly"
                  type="checkbox"
                  checked={formData.organizerOnly}
                  onChange={(e) => handleInputChange("organizerOnly", e.target.checked)}
                  className="w-4 h-4 mt-1 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="organizerOnly"
                    className="text-sm font-medium text-gray-700 cursor-pointer block mb-1"
                  >
                    Veranstalter (Ich werde nicht als Teilnehmer gezählt)
                  </Label>
                  <p className="text-xs text-gray-600">
                    Aktiviere diese Option, wenn du das Event nur organisierst, aber nicht selbst teilnimmst.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <Label htmlFor="maxPlayers" className="text-sm font-medium text-gray-700 mb-2 block">
                Maximale Teilnehmeranzahl *
              </Label>
              <Input
                id="maxPlayers"
                type="number"
                min="2"
                placeholder="z.B. 6"
                value={formData.maxPlayers || ""}
                onChange={(e) => {
                  handleInputChange("maxPlayers", e.target.value)
                  handleInputChange("maxParticipants", e.target.value)
                }}
                className="h-11 text-sm border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              />
              <p className="text-xs text-gray-500 mt-2">Leer lassen für unbegrenzte Teilnehmerzahl</p>
              {fieldErrors.maxPlayers && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {fieldErrors.maxPlayers}
                </p>
              )}
              {errors.maxPlayers && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {errors.maxPlayers}
                </p>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <Label htmlFor="frequency" className="text-sm font-medium text-gray-700 mb-3 block">
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
                <SelectTrigger className="h-11 text-sm border-gray-300 focus:border-teal-500 bg-white">
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

              {formData.frequency === "andere" && (
                <div className="mt-5 space-y-4 bg-white rounded-lg p-5 border border-gray-300">
                  <Label className="text-sm font-medium text-gray-700 block">Rythmus</Label>
                  <div className="flex gap-3 items-center">
                    <span className="text-gray-700 font-medium">Alle</span>
                    <Input
                      type="number"
                      min="2"
                      placeholder="2"
                      value={formData.customIntervalNumber}
                      onChange={(e) => handleInputChange("customIntervalNumber", e.target.value)}
                      className={`w-24 h-11 text-sm ${errors.customIntervalNumber ? "border-red-300 focus:border-red-400" : "border-gray-300 focus:border-teal-500"}`}
                    />
                    <Select
                      value={formData.customIntervalUnit}
                      onValueChange={(value) => handleInputChange("customIntervalUnit", value)}
                    >
                      <SelectTrigger className="w-40 h-11 border-gray-300 focus:border-teal-500">
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
                  <p className="text-xs text-gray-600">
                    Beispiel: "Alle 3 Wochen" bedeutet, dass sich das Event alle 3 Wochen stattfindet.
                  </p>
                  {errors.customIntervalNumber && <p className="text-red-600 text-sm">{errors.customIntervalNumber}</p>}
                </div>
              )}

              {["täglich", "wöchentlich", "monatlich", "jährlich", "andere"].includes(formData.frequency) && (
                <div className="mt-5">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Terminplanung *</Label>
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
                    <SelectTrigger className="h-11 text-sm border-gray-300 focus:border-teal-500 bg-white">
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
                <div className="mt-5 bg-white rounded-lg p-5 border border-gray-300">
                  <Label className="text-sm font-medium text-gray-700 mb-4 block">Wochentage auswählen</Label>
                  <div className="grid grid-cols-7 gap-3">
                    {["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"].map((day) => (
                      <div key={day} className="flex flex-col items-center">
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
                          className="w-5 h-5 text-teal-600 focus:ring-teal-600"
                        />
                        <Label htmlFor={day} className="text-xs cursor-pointer mt-2 font-medium">
                          {day.slice(0, 2)}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-4">
                    Wähle die Wochentage aus, an denen das Event stattfinden soll
                  </p>
                </div>
              )}

              {formData.frequency === "monatlich" && formData.seriesMode === "series" && (
                <div className="mt-5 bg-white rounded-lg p-5 border border-gray-300 space-y-5">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">Monatliches Muster</Label>
                    <Select
                      value={formData.monthlyType}
                      onValueChange={(value) => handleInputChange("monthlyType", value)}
                    >
                      <SelectTrigger className="h-11 border-gray-300 focus:border-teal-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">An einem bestimmten Tag im Monats</SelectItem>
                        <SelectItem value="weekday">An einem bestimmten Wochentag</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.monthlyType === "day" && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">Tag des Monats</Label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="z.B. 7 für jeden 7. des Monats"
                        value={formData.monthlyDay}
                        onChange={(e) => handleInputChange("monthlyDay", e.target.value)}
                        className="h-11 text-sm border-gray-300 focus:border-teal-500"
                      />
                    </div>
                  )}

                  {formData.monthlyType === "weekday" && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">Wochentag auswählen</Label>
                      <div className="flex gap-3">
                        <Select
                          value={formData.monthlyWeekdayPosition}
                          onValueChange={(value) => handleInputChange("monthlyWeekdayPosition", value)}
                        >
                          <SelectTrigger className="h-11 border-gray-300 focus:border-teal-500">
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
                          <SelectTrigger className="h-11 border-gray-300 focus:border-teal-500">
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
                      <p className="text-xs text-gray-600 mt-3">
                        z.B. "Ersten Freitag" = jeden ersten Freitag im Monat
                      </p>
                    </div>
                  )}
                </div>
              )}

              {["täglich", "wöchentlich", "monatlich", "jährlich", "andere"].includes(formData.frequency) &&
                formData.seriesMode === "series" && (
                  <div className="mt-5 bg-white rounded-lg p-5 border border-gray-300 space-y-5">
                    <Label className="text-sm font-medium text-gray-700 block">Wann soll die Serie enden?</Label>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-teal-500 transition-colors text-xs">
                        <input
                          type="radio"
                          id="endByCount"
                          name="seriesEndType"
                          value="count"
                          checked={formData.seriesEndType === "count"}
                          onChange={(e) => {
                            handleInputChange("seriesEndType", e.target.value)
                            if (e.target.checked) {
                              handleInputChange("seriesEndDate", "")
                            }
                          }}
                          className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                        />
                        <Label htmlFor="endByCount" className="text-sm font-medium text-gray-700 flex-shrink-0">
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
                          className={`w-24 h-11 text-sm ${formData.seriesEndType !== "count" ? "opacity-50 cursor-not-allowed" : "border-gray-300 focus:border-teal-500"}`}
                          disabled={formData.seriesEndType !== "count"}
                        />
                        <Label className="text-sm font-medium text-gray-700">Terminen</Label>
                      </div>

                      <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-teal-500 transition-colors">
                        <input
                          type="radio"
                          id="endByDate"
                          name="seriesEndType"
                          value="date"
                          checked={formData.seriesEndType === "date"}
                          onChange={(e) => {
                            handleInputChange("seriesEndType", e.target.value)
                            if (e.target.checked) {
                              handleInputChange("seriesEndCount", "")
                            }
                          }}
                          className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                        />
                        <Label htmlFor="endByDate" className="text-sm font-medium text-gray-700 flex-shrink-0">
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
                          className={`h-11 ${formData.seriesEndType !== "date" ? "opacity-50 cursor-not-allowed" : "border-gray-300 focus:border-teal-500"}`}
                          disabled={formData.seriesEndType !== "date"}
                        />
                      </div>
                    </div>
                  </div>
                )}
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <Label htmlFor="eventDate" className="text-sm font-medium text-gray-700 mb-3 block">
                {formData.frequency === "einmalig"
                  ? "Datum *"
                  : formData.seriesMode === "series"
                    ? "Start-Datum *"
                    : "Datum *"}
              </Label>
              <Input
                id="eventDate"
                type="date"
                className="h-11 text-sm border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                value={formData.eventDate}
                onChange={(e) => {
                  handleInputChange("eventDate", e.target.value)
                  handleInputChange("date", e.target.value)
                }}
                required
              />
              {fieldErrors.eventDate ? (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {fieldErrors.eventDate}
                </p>
              ) : (
                <p className="text-xs text-gray-600 mt-2">Das Datum muss in der Zukunft liegen</p>
              )}
              {errors.eventDate && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {errors.eventDate}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime" className="text-sm font-medium text-gray-700 mb-3 block">
                  Startzeit *
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  className="h-11 text-sm border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange("startTime", e.target.value)}
                  required
                />
                {fieldErrors.startTime && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {fieldErrors.startTime}
                  </p>
                )}
                {errors.startTime && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.startTime}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="endTime" className="text-sm font-medium text-gray-700 mb-3 block">
                  Endzeit *
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  className="h-11 text-sm border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange("endTime", e.target.value)}
                  required
                />
                {fieldErrors.endTime && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {fieldErrors.endTime}
                  </p>
                )}
                {errors.endTime && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.endTime}
                  </p>
                )}
              </div>
            </div>

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
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                  <span className="text-lg">📅</span>
                  Terminvorschau
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {formData.frequency === "einmalig" ? (
                    <div className="flex justify-between items-center bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <span className="font-medium text-gray-800 text-xs">
                        {parseLocalDate(formData.eventDate).toLocaleDateString("de-DE", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                      <span className="font-medium bg-gray-100 px-3 py-1 rounded-full text-xs">
                        {formData.startTime} - {formData.endTime}
                      </span>
                    </div>
                  ) : formData.seriesMode === "manual" ? (
                    <>
                      {formData.eventDate && (
                        <div className="flex justify-between items-center bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                          <span className="font-medium text-gray-800">
                            {parseLocalDate(formData.eventDate).toLocaleDateString("de-DE", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                          <span className="text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">
                            {formData.startTime} - {formData.endTime}
                          </span>
                        </div>
                      )}
                      {formData.additionalDates.map((date, index) => {
                        if (!date) return null
                        return (
                          <div
                            key={index}
                            className="flex justify-between items-center bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                          >
                            <span className="font-medium text-gray-800">
                              {parseLocalDate(date).toLocaleDateString("de-DE", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                            <span className="text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">
                              {formData.additionalStartTimes?.[index] || formData.startTime} -{" "}
                              {formData.additionalEndTimes?.[index] || formData.endTime}
                            </span>
                          </div>
                        )
                      })}
                    </>
                  ) : (
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
                          className="flex justify-between items-center bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                        >
                          <span className="font-medium text-gray-800 text-xs">
                            {parseLocalDate(date).toLocaleDateString("de-DE", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                          <span className="font-medium text-gray-800 text-xs">
                            {formData.startTime} - {formData.endTime}
                          </span>
                        </div>
                      ))
                    })()
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-gray-800 font-semibold text-xs">
                    {" "}
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
                    Termin(e) insgesamt
                  </p>
                </div>
              </div>
            )}

            {["täglich", "wöchentlich", "monatlich", "jährlich", "andere"].includes(formData.frequency) &&
              formData.seriesMode === "manual" && (
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">Weitere Termine *</Label>
                    <p className="text-xs text-gray-600 mb-4">
                      Füge alle Termine hinzu, an denen das Event stattfinden soll. Jeder Termin muss in der Zukunft und
                      nach dem vorherigen Termin liegen.
                    </p>
                    {errors.additionalDates && <p className="text-red-600 text-xs mb-3">{errors.additionalDates}</p>}
                    <div className="space-y-3 mt-3">
                      {formData.additionalDates.map((date, index) => {
                        const previousDate = index === 0 ? formData.eventDate : formData.additionalDates[index - 1]
                        const isDateValid = !date || !previousDate || new Date(date) > new Date(previousDate)
                        const isFutureDate = !date || new Date(date) > new Date()

                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex gap-2 items-center">
                              <div className="flex-1">
                                <Input
                                  type="date"
                                  className={`h-11 text-sm ${!isDateValid || !isFutureDate ? "border-red-300 focus:border-red-400" : "border-gray-300 focus:border-teal-500"}`}
                                  value={date}
                                  onChange={(e) => {
                                    const newDates = [...formData.additionalDates]
                                    newDates[index] = e.target.value
                                    handleInputChange("additionalDates", newDates)
                                  }}
                                />
                                {date && !isFutureDate && (
                                  <p className="text-red-500 text-xs mt-1">Datum muss in der Zukunft liegen</p>
                                )}
                                {date && isFutureDate && !isDateValid && (
                                  <p className="text-red-500 text-xs mt-1">
                                    Datum muss nach dem {index === 0 ? "Start-Event" : "vorherigen Termin"} liegen
                                  </p>
                                )}
                              </div>
                              {date && (
                                <>
                                  <Input
                                    type="time"
                                    className="h-11 text-sm border-gray-300 focus:border-teal-500 w-32"
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
                                    className="h-11 text-sm border-gray-300 focus:border-teal-500 w-32"
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
                                variant="destructive"
                                size="icon"
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
                                className="bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 border-none"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          handleInputChange("additionalDates", [...formData.additionalDates, ""])
                        }}
                        className="h-11 px-5 text-sm border-2 border-dashed border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                      >
                        + Weiteren Termin hinzufügen
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <Label htmlFor="location" className="text-sm font-medium text-gray-700 mb-3 block">
                Treffpunkt *
              </Label>
              <div className="space-y-4">
                <Select
                  value={locationType}
                  onValueChange={(value: "local" | "virtual") => {
                    setLocationType(value)
                    handleInputChange("isOnline", value === "virtual")
                  }}
                >
                  <SelectTrigger className="h-11 text-sm border-gray-300 focus:border-teal-500">
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
                      placeholder="Location, Adresse, PLZ oder Ort eingeben..."
                      value={formData.location}
                      onChange={(value) => handleInputChange("location", value)}
                      className="h-11 text-sm border-gray-300 focus:border-teal-500"
                      error={fieldErrors.location || errors.location}
                    />
                  </div>
                )}

                {locationType === "virtual" && (
                  <Input
                    placeholder="Einladungslink (Discord, Zoom, etc.)"
                    value={formData.onlinePlatform}
                    onChange={(e) => handleInputChange("onlinePlatform", e.target.value)}
                    className="h-11 text-sm border-gray-300 focus:border-teal-500"
                  />
                )}
                {errors.onlinePlatform && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
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
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <p className="text-gray-700 mb-6 text-sm">
                Wähle Spiele aus deinem Spieleregal oder suche gerne andere aus der Datenbank
              </p>

              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-semibold text-gray-900">Dein Spieleregal</h4>
                    <Button
                      type="button"
                      onClick={() => setShowGameShelfModal(true)}
                      className="bg-teal-600 text-white hover:bg-teal-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Aus Spielregal auswählen
                    </Button>
                  </div>

                  {selectedGames.filter((game) => !game.isBggGame).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Library className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-xs">Klicke auf "Aus Spielregal auswählen", um Spiele hinzuzufügen</p>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4 text-sm">Aus der Datenbank suchen</h4>
                  <div className="relative mb-5">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Beliebiges Spiel suchen ..."
                      value={bggSearchTerm}
                      onChange={(e) => {
                        setBggSearchTerm(e.target.value)
                        searchBoardGameGeek(e.target.value)
                      }}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-xs"
                    />
                  </div>

                  {bggSearchLoading && (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-500 mx-auto"></div>
                      <p className="text-gray-600 mt-4 font-medium">Durchsuche Datenbank...</p>
                    </div>
                  )}

                  {bggSearchResults.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {bggSearchResults.map((game) => {
                        const isSelected = selectedGames.some((g) => g.id === game.id)
                        return (
                          <div
                            key={game.id}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                              isSelected
                                ? "border-teal-500 bg-teal-50 shadow-md"
                                : "border-gray-200 hover:border-teal-400"
                            }`}
                            onClick={() => handleGameShelfSelection(game)}
                          >
                            <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                              <img
                                src={game.image || "/placeholder.svg"}
                                alt={game.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                                }}
                              />
                            </div>
                            <h4 className="font-semibold text-gray-900 line-clamp-2 mb-1 text-xs">{game.title}</h4>
                            {game.year && <p className="text-xs text-gray-500">({game.year})</p>}
                            {game.publisher && <p className="text-xs text-gray-600 truncate">{game.publisher}</p>}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {bggSearchTerm && !bggSearchLoading && bggSearchResults.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Search className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="font-medium">Keine Spiele gefunden für "{bggSearchTerm}"</p>
                      <p className="text-xs mt-2">Versuche einen anderen Suchbegriff</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedGames.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
                    Ausgewählte Spiele für das Event: {selectedGames.length}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedGames.map((game) => (
                      <div key={game.id} className="bg-white border border-gray-200 rounded-lg p-4 relative shadow-sm">
                        <button
                          type="button"
                          onClick={() => handleRemoveGame(game.id)}
                          className="absolute -top-2.5 -right-2.5 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg font-bold text-xs"
                        >
                          ×
                        </button>
                        <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                          <img
                            src={game.image || "/placeholder.svg"}
                            alt={game.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h4 className="font-semibold text-gray-900 line-clamp-2 text-xs">{game.title}</h4>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Step 4: Settings & Publication */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <Label htmlFor="visibility" className="text-sm font-medium text-gray-700 mb-3 block">
                Sichtbarkeit *
              </Label>
              <Select value={formData.visibility} onValueChange={(value) => handleInputChange("visibility", value)}>
                <SelectTrigger className="h-11 text-sm border-gray-300 focus:border-teal-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    Für alle sichtbar (Jeder kann das Event sehen und sich hierfür anmelden)
                  </SelectItem>
                  <SelectItem value="friends_only">
                    Mit Einladung (Nur ausgewählte Freunde können das Event sehen)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.visibility === "friends_only" && (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Freunde einladen</Label>
                  <p className="text-xs text-gray-600 mb-4">
                    Wähle Freunde aus, die du zu diesem Event einladen möchtest.
                  </p>
                  <div className="mt-2 space-y-4">
                    <Button
                      type="button"
                      onClick={() => setShowFriendDialog(true)}
                      variant="outline"
                      className="h-11 w-full px-6 text-sm border-2 border-dashed border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <Users className="w-5 h-5 mr-2" />
                      Freunde auswählen ({selectedFriends.length} ausgewählt)
                    </Button>

                    {selectedFriends.length > 0 && (
                      <div className="space-y-4 pt-4 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-800">Ausgewählte Freunde:</p>
                        <div className="flex flex-wrap gap-3">
                          {selectedFriends.map((friend) => (
                            <div
                              key={friend.id}
                              className="flex items-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm font-medium shadow-sm"
                            >
                              <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {friend.name[0].toUpperCase()}
                              </div>
                              <span>{friend.name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSelectedFriend(friend.id)}
                                className="text-gray-600 hover:text-gray-800 ml-1 p-0.5 rounded-full hover:bg-gray-200 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Friend game requests section */}
                        <div className="mt-4 space-y-3 pt-4 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-800">Spiele von Freunden anfragen:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedFriends.map((friend) => (
                              <Button
                                key={friend.id}
                                type="button"
                                onClick={() =>
                                  setShowFriendGameDialog({ friendId: friend.id, friendName: friend.name })
                                }
                                variant="outline"
                                className="h-14 justify-start text-left text-sm border-2 border-gray-300 hover:bg-gray-50"
                              >
                                <span className="truncate font-medium text-gray-800">
                                  {friend.name}
                                  {friendGameRequests[friend.id]?.length > 0 && (
                                    <span className="ml-2 text-xs bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded-full">
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

            {formData.visibility !== "friends_only" && (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <Label htmlFor="requiresApproval" className="text-sm font-medium text-gray-700 mb-3 block">
                  Teilnahmemodus *
                </Label>
                <Select
                  value={formData.requiresApproval ? "manual" : "automatic"}
                  onValueChange={(value) => handleInputChange("requiresApproval", value === "manual")}
                >
                  <SelectTrigger className="h-11 text-sm border-gray-300 focus:border-teal-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatic">
                      Offene Teilnahme (Jeder kann teilnehmen)
                    </SelectItem>
                    <SelectItem value="manual">
                      Teilnahme erst nach Genehmigung (Du genehmigst jede Teilnahme-Anfrage)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <Label htmlFor="rules" className="text-sm font-medium text-gray-700 mb-3 block">
                Zusatzinfos
              </Label>
              <RichTextEditor
                value={formData.rules}
                onChange={(value) => handleInputChange("rules", value)}
                placeholder="z.B. Spezielle Hausregeln, Hinweise ..."
                rows={4}
                className="text-sm"
              />
            </div>
          </div>
        )}
        {submitError && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-5 flex items-start space-x-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 mb-1">Fehler beim Erstellen</h4>
              <p className="text-red-700 text-sm">{submitError}</p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="h-11 px-6 text-sm border-2 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                disabled={isSubmitting}
              >
                ← Zurück
              </Button>
            )}
          </div>

          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-11 px-6 text-sm border-2 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="h-11 px-8 text-sm bg-teal-600 text-white font-medium shadow-sm hover:bg-teal-700"
                disabled={isSubmitting}
              >
                Weiter →
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 px-8 text-sm bg-teal-600 text-white font-medium shadow-sm hover:bg-teal-700"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Erstelle Event...
                  </div>
                ) : (
                  <>
                    <Dice6 className="w-5 h-5 mr-2" />
                    Event erstellen
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Friend Selection Dialog */}
      <Dialog open={showFriendDialog} onOpenChange={setShowFriendDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Freunde auswählen</DialogTitle>
          </DialogHeader>

          {/* Search Field */}
          <div className="px-1 pb-4">
            <Input
              placeholder="Freunde suchen..."
              value={friendSearchTerm}
              onChange={(e) => setFriendSearchTerm(e.target.value)}
              className="border-2 border-gray-300 focus:border-teal-500 h-11 text-sm"
            />
          </div>

          <div className="overflow-y-auto max-h-96 px-1">
            {friends.length > 0 ? (
              filteredFriends.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleFriendToggle(friend)}
                    >
                      <Checkbox
                        checked={selectedFriends.some((f) => f.id === friend.id)}
                        onChange={() => handleFriendToggle(friend)}
                        className="w-5 h-5 text-teal-600 focus:ring-teal-500"
                      />
                      <div className="w-10 h-10 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {friend.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{friend.name}</h4>
                        {friend.email && <p className="text-xs text-gray-500">{friend.email}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">Keine Freunde gefunden für "{friendSearchTerm}"</p>
                  <p className="text-xs mt-2">Versuche einen anderen Suchbegriff</p>
                </div>
              )
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="font-medium">Du hast noch keine Freunde hinzugefügt</p>
                <p className="text-xs mt-2">Füge zuerst Freunde hinzu, um sie einladen zu können</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-5">
            <Button
              onClick={() => {
                setShowFriendDialog(false)
                setFriendSearchTerm("") // Reset search when closing
              }}
              variant="outline"
              className="h-11 px-6 text-sm border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Abbrechen
            </Button>
            <Button
              onClick={() => {
                setShowFriendDialog(false)
                setFriendSearchTerm("")
              }}
              className="h-11 px-8 text-sm bg-teal-600 text-white font-medium shadow-sm hover:bg-teal-700"
            >
              Fertig ({selectedFriends.length} ausgewählt)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!showFriendGameDialog} onOpenChange={() => setShowFriendGameDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl font-bold gap-2">
              <Gamepad2 className="h-6 w-6" />
              Spiele von {showFriendGameDialog?.friendName} anfragen
            </DialogTitle>
            <p className="text-xs text-gray-500 mt-2">
              Wähle Spiele aus dem Regal von {showFriendGameDialog?.friendName}, die zum Event mitgebracht werden sollen
            </p>
          </DialogHeader>

          <div className="space-y-5 pt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Spiele durchsuchen..."
                value={friendGameSearchTerm}
                onChange={(e) => setFriendGameSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {filteredFriendGames.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Gamepad2 className="w-20 h-20 mx-auto mb-5 opacity-20" />
                <p className="font-medium text-base">Keine Spiele gefunden</p>
                <p className="text-xs mt-2">
                  {friendGameSearchTerm
                    ? "Versuche einen anderen Suchbegriff"
                    : `${showFriendGameDialog?.friendName} hat noch keine Spiele im Spielregal`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filteredFriendGames.map((game) => {
                  const isRequested = friendGameRequests[showFriendGameDialog?.friendId || ""]?.some(
                    (g) => g.id === game.id,
                  )
                  const isAvailable = game.available?.includes("available")
                  const isSelected = selectedGames.some((g) => g.id === game.id)

                  return (
                    <div
                      key={game.id}
                      className={`border-2 rounded-lg p-4 relative transition-all ${
                        isAvailable ? "hover:shadow-lg cursor-pointer" : "opacity-60 cursor-not-allowed bg-gray-50"
                      } ${isSelected ? "border-teal-500 bg-teal-50 shadow-md" : "border-gray-200 hover:border-teal-400"}`}
                      onClick={() => isAvailable && handleGameShelfSelection(game)}
                    >
                      <div className="absolute top-3 left-3 z-10">
                        <div
                          className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                            isAvailable ? "bg-green-500" : "bg-red-500"
                          }`}
                          title={isAvailable ? "Verfügbar" : "Nicht verfügbar"}
                        />
                      </div>

                      <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                        <img
                          src={game.image || "/placeholder.svg"}
                          alt={game.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4
                        className={`font-semibold text-sm truncate ${isAvailable ? "text-gray-900" : "text-gray-500"}`}
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
      {/* Game Shelf Selection Modal */}
      <Dialog open={showGameShelfModal} onOpenChange={setShowGameShelfModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Spiele aus deinem Spielregal auswählen</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-4">
            <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex gap-2">
                <button
                  onClick={() => setAvailabilityFilter("all")}
                  className={`px-4 py-2 text-xs rounded-full font-medium transition-colors ${
                    availabilityFilter === "all"
                      ? "bg-teal-600 text-white shadow-md"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Alle
                </button>
                <button
                  onClick={() => setAvailabilityFilter("available")}
                  className={`px-4 py-2 text-xs rounded-full font-medium transition-colors flex items-center gap-1 ${
                    availabilityFilter === "available"
                      ? "bg-green-500 text-white shadow-md"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Verfügbar
                </button>
                <button
                  onClick={() => setAvailabilityFilter("unavailable")}
                  className={`px-4 py-2 text-xs rounded-full font-medium transition-colors flex items-center gap-1 ${
                    availabilityFilter === "unavailable"
                      ? "bg-red-500 text-white shadow-md"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Nicht verfügbar
                </button>
              </div>
            </div>

            {userGames.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Gamepad2 className="w-20 h-20 mx-auto mb-5 opacity-20" />
                <p className="font-medium text-base">Du hast noch keine Spiele in deinem Spielregal</p>
                <p className="text-xs mt-2">Füge zuerst Spiele zu deiner Bibliothek hinzu</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
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
                        className={`border-2 rounded-lg p-4 relative transition-all ${
                          isAvailable ? "hover:shadow-lg cursor-pointer" : "opacity-60 cursor-not-allowed bg-gray-50"
                        } ${isSelected ? "border-teal-500 bg-teal-50 shadow-md" : "border-gray-200 hover:border-teal-400"}`}
                        onClick={() => isAvailable && handleGameShelfSelection(game)}
                      >
                        <div className="absolute top-3 left-3 z-10">
                          <div
                            className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                              isAvailable ? "bg-green-500" : "bg-red-500"
                            }`}
                            title={isAvailable ? "Verfügbar" : "Nicht verfügbar"}
                          />
                        </div>

                        <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                          <img
                            src={game.image || "/placeholder.svg"}
                            alt={game.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h4
                          className={`font-semibold text-sm truncate ${isAvailable ? "text-gray-900" : "text-gray-500"}`}
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
