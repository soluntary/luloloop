"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Search,
  Plus,
  Calendar,
  MapPin,
  Users,
  UserPlus,
  Settings,
  Dices,
  UserCog,
  DicesIcon,
  Clock,
  UserMinus,
  Repeat,
  MessageCircle,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Navigation from "@/components/navigation"
import CreateLudoEventForm from "@/components/create-ludo-event-form-advanced"
import UserLink from "@/components/user-link"
import JoinEventDialog from "@/components/join-event-dialog"
import EventApprovalManagement from "@/components/event-approval-management"
import { joinLudoEvent, leaveLudoEvent } from "@/app/actions/ludo-event-participants"
import { SimpleLocationSearch } from "@/components/simple-location-search"
import { LocationSearchProvider } from "@/contexts/location-search-context"
import { GeolocationProvider } from "@/contexts/geolocation-context"
import { registerForInstance, unregisterFromInstance, type LudoEventInstance } from "@/app/actions/ludo-event-instances"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMessages } from "@/contexts/messages-context"
import { MessageComposerModal } from "@/components/message-composer-modal"
import { LeaderboardAd, MediumRectangleAd, WideSkyscraperAd } from "@/components/advertising/ad-placements"

interface LudoEvent {
  id: string
  creator_id: string
  title: string
  description: string | null
  max_participants: number
  event_date: string
  start_time: string | null
  end_time: string | null
  location: string | null
  is_public: boolean
  created_at: string
  selected_games: string[] | null
  frequency: string[] | null
  image_url: string | null
  approval_mode?: "automatic" | "manual"
  visibility?: "public" | "friends_only"
  creator?: {
    username: string | null
    avatar: string | null
  }
  participant_count?: number
  is_participant?: boolean
  is_pending?: boolean
  is_rejected?: boolean
  organizer_only?: boolean
  start_date?: string
  custom_dates?: string[]
  interval_type?: string
  custom_interval?: string
  users?: { username: string | null; avatar: string | null } // Added for message composer context
}

function LudoEventsContent() {
  const { user } = useAuth()
  const [ludoEvents, setLudoEvents] = useState<LudoEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [timeFilter, setTimeFilter] = useState("all")
  const [frequencyFilter, setFrequencyFilter] = useState("all")
  const [sortBy, setSortBy] = useState("all")
  const [availableSpotsFilter, setAvailableSpotsFilter] = useState("all")
  const [locationSearchActive, setLocationSearchActive] = useState(false)
  const [locationResults, setLocationResults] = useState<LudoEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<LudoEvent | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null)
  const [leavingEventId, setLeavingEventId] = useState<string | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [eventInstances, setEventInstances] = useState<Record<string, LudoEventInstance[]>>({})
  const [loadingInstances, setLoadingInstances] = useState<Record<string, boolean>>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("grundinformationen")
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [messageRecipient, setMessageRecipient] = useState<{
    id: string
    name: string
    avatar?: string
    context: { title: string; image: string; type: "group" | "event" | "member" }
  } | null>(null)

  const supabase = createClient()
  const { sendMessage } = useMessages()

  useEffect(() => {
    loadLudoEvents()
  }, [user])

  useEffect(() => {
    if (showDetailsDialog && selectedEvent && isRecurringEvent(selectedEvent)) {
      console.log("[v0] Details dialog opened for recurring event, loading instances")
      loadEventInstances(selectedEvent.id)
    }
  }, [showDetailsDialog, selectedEvent])

  const loadLudoEvents = async () => {
    try {
      console.log("[v0] Loading ludo events...")
      setLoading(true)

      const supabase = createClient()

      const { data: events, error } = await supabase
        .from("ludo_events")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error loading ludo events:", error)
        throw error
      }

      console.log("[v0] Raw events loaded:", events?.length || 0)

      if (!events) {
        setLudoEvents([])
        return
      }

      // Get participant counts, user participation status, and creator info separately
      const ludoEventsData: LudoEvent[] = await Promise.all(
        events.map(async (event) => {
          const { data: creator } = await supabase
            .from("users")
            .select("username, avatar")
            .eq("id", event.creator_id)
            .single()

          // Get participant count
          const { count: participantCount } = await supabase
            .from("ludo_event_participants")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id)

          // Check if current user is a participant
          let isParticipant = false
          if (user?.id) {
            const { data: participantData } = await supabase
              .from("ludo_event_participants")
              .select("id")
              .eq("event_id", event.id)
              .eq("user_id", user.id)
              .single()

            isParticipant = !!participantData
          }

          // Check if current user has pending invitation
          let isPending = false
          if (user?.id) {
            const { data: invitationData } = await supabase
              .from("ludo_event_invitations")
              .select("id")
              .eq("event_id", event.id)
              .eq("invitee_id", user.id)
              .eq("status", "pending")
              .single()

            isPending = !!invitationData
          }

          return {
            ...event,
            participant_count: participantCount || 0,
            is_participant: isParticipant,
            is_pending: isPending,
            creator: creator || { username: "Unbekannt", avatar: null },
          }
        }),
      )

      console.log("[v0] Processed events:", ludoEventsData.length)
      setLudoEvents(ludoEventsData)
    } catch (error) {
      console.error("[v0] Error in loadLudoEvents:", error)
      setLudoEvents([])
    } finally {
      setLoading(false)
    }
  }

  const getFriendsOnlyEventIds = async (userId: string): Promise<string[]> => {
    try {
      const { data } = await supabase
        .from("ludo_event_invitations")
        .select("event_id")
        .eq("invitee_id", userId)
        .eq("status", "accepted")

      const eventIds = data?.map((inv) => inv.event_id) || []
      return eventIds
    } catch (error) {
      console.error("Error fetching friends-only event IDs:", error)
      return []
    }
  }

  const getEventImage = (event: LudoEvent) => {
    // First priority: custom uploaded event image
    if (event.image_url) {
      return event.image_url
    }

    // Second priority: extract image from selected games
    if (event.selected_games && event.selected_games.length > 0) {
      for (const game of event.selected_games) {
        if (typeof game === "string") {
          try {
            const gameObj = JSON.parse(game)
            if (gameObj.image) {
              return gameObj.image
            }
          } catch {
            // Not a JSON string, continue
          }
        } else if (typeof game === "object" && game.image) {
          return game.image
        }
      }
    }

    // No image found
    return null
  }

  const isEventSoldOut = (event: LudoEvent) => {
    return event.participant_count >= event.max_participants
  }

  const isEventCreator = (event: LudoEvent) => {
    return user && event.creator_id === user.id
  }

  const getParticipantText = (event: LudoEvent) => {
    console.log(`[v0] Getting participant text for event: ${event.title}`)
    console.log(`[v0] Max participants: ${event.max_participants}, Current: ${event.participant_count}`)
    console.log(`[v0] Event object:`, {
      id: event.id,
      title: event.title,
      max_participants: event.max_participants,
      participant_count: event.participant_count,
      creator_id: event.creator_id,
    })

    const freePlaces = event.max_participants - (event.participant_count || 0)
    console.log(`[v0] Free places calculated: ${freePlaces}`)

    const displayText =
      freePlaces <= 0
        ? "Ausgebucht"
        : `${event.participant_count || 0} Teilnehmer (${freePlaces} ${freePlaces === 1 ? "Platz frei" : "Plätze frei"})`

    console.log(`[v0] Final display text: "${displayText}"`)
    return displayText
  }

  const formatDateForDisplay = (dateString: string | undefined): string => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatRecurringDates = (event: LudoEvent) => {
    const dates = []
    const startDate = new Date(event.event_date)

    // Add main event date
    dates.push({
      date: event.event_date,
      startTime: event.start_time,
      endTime: event.end_time,
    })

    // Generate additional dates based on frequency
    if (event.frequency === "regular") {
      // Generate weekly recurring dates for the next 8 weeks
      for (let i = 1; i <= 8; i++) {
        const nextDate = new Date(startDate)
        nextDate.setDate(startDate.getDate() + i * 7)
        dates.push({
          date: nextDate.toISOString().split("T")[0],
          startTime: event.start_time,
          endTime: event.end_time,
        })
      }
    } else if (event.frequency === "recurring") {
      // Generate monthly recurring dates for the next 6 months
      for (let i = 1; i <= 6; i++) {
        const nextDate = new Date(startDate)
        nextDate.setMonth(startDate.getMonth() + i)
        dates.push({
          date: nextDate.toISOString().split("T")[0],
          startTime: event.start_time,
          endTime: event.end_time,
        })
      }
    }

    return dates
  }

  const formatEventTime = (event: LudoEvent) => {
    if (event.start_time && event.end_time) {
      const timeFrom = event.start_time.split(":").slice(0, 2).join(":")
      const timeTo = event.end_time.split(":").slice(0, 2).join(":")
      return `${timeFrom} - ${timeTo}`
    } else if (event.start_time) {
      const timeFrom = event.start_time.split(":").slice(0, 2).join(":")
      return `ab ${timeFrom}`
    }
    return null
  }

  const formatTimeForDate = (startTime?: string, endTime?: string) => {
    if (startTime && endTime) {
      const timeFrom = startTime.split(":").slice(0, 2).join(":")
      const timeTo = endTime.split(":").slice(0, 2).join(":")
      return `${timeFrom} - ${timeTo}`
    } else if (startTime) {
      const timeFrom = startTime.split(":").slice(0, 2).join(":")
      return `ab ${timeFrom}`
    }
    return null
  }

  const formatSingleDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric", // Added year
    })
  }

  const getFrequencyText = (event: LudoEvent) => {
    console.log("[v0] Getting frequency text for event:", event.title)
    console.log("[v0] Event frequency from database:", event.frequency)
    console.log("[v0] Event interval_type from database:", event.interval_type)
    console.log("[v0] Event custom_interval from database:", event.custom_interval)

    if (event.frequency === "regular" && event.interval_type) {
      switch (event.interval_type) {
        case "weekly":
          return "Wöchentlich"
        case "biweekly":
          return "Zweiwöchentlich"
        case "monthly":
          return "Monatlich"
        case "other":
          return event.custom_interval || "Andere"
        default:
          return "Regelmässig"
      }
    }

    // Handle legacy combined format for backward compatibility
    if (event.frequency && event.frequency.startsWith("regular-")) {
      const interval = event.frequency.replace("regular-", "")
      switch (interval) {
        case "weekly":
          return "Wöchentlich"
        case "biweekly":
          return "Zweiwöchentlich"
        case "monthly":
          return "Monatlich"
        default:
          return interval
      }
    }

    // Handle standard frequency values
    switch (event.frequency) {
      case "single":
      case "einmalig":
        return "Einmalig"
      case "wöchentlich":
      case "weekly":
        return "Wöchentlich"
      case "zweitwöchentlich":
      case "zweiwöchentlich":
        return "Zweiwöchentlich"
      case "monatlich":
      case "monthly":
        return "Monatlich"
      case "andere":
      case "other":
      case "custom":
        return "Andere"
      case "zweimonatlich":
      case "bimonthly":
        return "Zweimonatlich"
      case "vierteljährlich":
      case "quarterly":
        return "Vierteljährlich"
      case "halbjährlich":
      case "semiannually":
        return "Halbjährlich"
      case "jährlich":
      case "annually":
        return "Jährlich"
      case "regular":
        return "Regelmässig"
      case "recurring":
        return "Wiederholend"
      default:
        return event.frequency && event.frequency.length > 20 ? "Andere" : event.frequency || "Einmalig"
    }
  }

  const isRecurringEvent = (event: LudoEvent) => {
    const frequency = event.frequency || "single"
    return (
      frequency === "regular" ||
      frequency === "recurring" ||
      frequency === "wöchentlich" ||
      frequency === "weekly" ||
      frequency === "monatlich" ||
      frequency === "monthly"
    )
  }

  const getFrequencyBadgeColor = (event: LudoEvent) => {
    const frequency = event.frequency || "single"

    switch (frequency) {
      case "single":
      case "einmalig":
        return "bg-green-500" // Green for single events
      case "wöchentlich":
      case "weekly":
      case "zweitwöchentlich":
      case "biweekly":
        return "bg-blue-500" // Blue for weekly events
      case "monatlich":
      case "monthly":
      case "zweimonatlich":
      case "bimonthly":
      case "vierteljährlich":
      case "quarterly":
        return "bg-purple-500" // Purple for monthly events
      case "halbjährlich":
      case "semiannually":
      case "jährlich":
      case "annually":
        return "bg-indigo-500" // Indigo for longer intervals
      case "regular":
        return "bg-blue-500" // Blue for regular events
      case "recurring":
        return "bg-orange-500" // Orange for recurring events
      default:
        return "bg-green-500" // Default to green
    }
  }

  const getGamesText = (event: LudoEvent) => {
    console.log("[v0] Getting games text for event:", event.title)
    console.log("[v0] Event selected_games:", event.selected_games)

    if (!event.selected_games || event.selected_games.length === 0) {
      console.log("[v0] No selected_games found")
      return "Spiele werden bekannt gegeben"
    }

    console.log("[v0] Processing selected_games:", event.selected_games)

    const games = []
    for (const game of event.selected_games) {
      if (typeof game === "string") {
        try {
          // Try to parse as JSON first (for game objects)
          const gameObj = JSON.parse(game)
          if (gameObj.title) {
            games.push(gameObj.title)
          } else {
            // If no title property, use the string as-is
            games.push(game)
          }
        } catch {
          // If parsing fails, it's just a plain game name
          games.push(game)
        }
      } else if (typeof game === "object" && game.title) {
        // Handle direct game objects
        games.push(game.title)
      } else {
        // Fallback for any other format
        games.push(String(game))
      }
    }

    console.log("[v0] Final games array:", games)

    if (games.length > 0) {
      const result = games.join(", ")
      console.log("[v0] Returning games text:", result)
      return result
    }

    console.log("[v0] No games found, returning fallback text")
    return "Spiele werden bekannt gegeben"
  }

  const getFilteredEvents = () => {
    let filtered = locationSearchActive ? locationResults : ludoEvents

    console.log("[v0] Starting getFilteredEvents with", filtered.length, "events")
    console.log("[v0] Search term:", searchTerm)
    console.log("[v0] Time filter:", timeFilter)
    console.log("[v0] Frequency filter:", frequencyFilter)
    console.log("[v0] Sort by:", sortBy)
    console.log("[v0] Available spots filter:", availableSpotsFilter)
    console.log("[v0] Location search active:", locationSearchActive)

    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.location?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      console.log("[v0] After search filter:", filtered.length, "events")
    }

    if (frequencyFilter !== "all") {
      filtered = filtered.filter((event) => {
        const eventFrequency = event.frequency || "single"
        console.log("[v0] Checking event frequency:", eventFrequency, "against filter:", frequencyFilter)
        return eventFrequency === frequencyFilter
      })
      console.log("[v0] After frequency filter:", filtered.length, "events")
    }

    if (availableSpotsFilter !== "all") {
      filtered = filtered.filter((event) => {
        const availableSpots = event.max_participants - event.participant_count
        return availableSpots > 0
      })
      console.log("[v0] After available spots filter:", filtered.length, "events")
    }

    if (timeFilter !== "all") {
      const now = new Date()
      console.log("[v0] Current date for filtering:", now)

      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.event_date)
        console.log("[v0] Checking event date:", event.event_date, "parsed as:", eventDate)

        switch (timeFilter) {
          case "today":
            const isToday = eventDate.toDateString() === now.toDateString()
            console.log("[v0] Is today?", isToday)
            return isToday
          case "tomorrow":
            const tomorrow = new Date(now)
            tomorrow.setDate(tomorrow.getDate() + 1)
            const isTomorrow = eventDate.toDateString() === tomorrow.toDateString()
            console.log("[v0] Is tomorrow?", isTomorrow)
            return isTomorrow
          case "week":
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            const isThisWeek = eventDate >= now && eventDate <= weekFromNow
            console.log("[v0] Is this week?", isThisWeek, "Event date:", eventDate, "Week end:", weekFromNow)
            return isThisWeek
          case "weekend":
            const startOfWeek = new Date(now)
            const dayOfWeek = startOfWeek.getDay()
            const daysUntilSaturday = (6 - dayOfWeek + 7) % 7
            const thisSaturday = new Date(startOfWeek.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000)
            const thisSunday = new Date(thisSaturday.getTime() + 24 * 60 * 60 * 1000)
            const isThisWeekend = eventDate >= thisSaturday && eventDate <= thisSunday
            console.log(
              "[v0] Is this weekend?",
              isThisWeekend,
              "Event date:",
              eventDate,
              "Saturday:",
              thisSaturday,
              "Sunday:",
              thisSunday,
            )
            return isThisWeekend
          case "nextweek":
            const nextWeekStart = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            const nextWeekEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
            const isNextWeek = eventDate >= nextWeekStart && eventDate <= nextWeekEnd
            console.log(
              "[v0] Is next week?",
              isNextWeek,
              "Event date:",
              eventDate,
              "Next week start:",
              nextWeekStart,
              "Next week end:",
              nextWeekEnd,
            )
            return isNextWeek
          case "month":
            const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            const isThisMonth = eventDate >= now && eventDate <= monthFromNow
            console.log("[v0] Is this month?", isThisMonth, "Event date:", eventDate, "Month end:", monthFromNow)
            return isThisMonth
          case "nextmonth":
            const nextMonthStart = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            const nextMonthEnd = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
            const isNextMonth = eventDate >= nextMonthStart && eventDate <= nextMonthEnd
            console.log(
              "[v0] Is next month?",
              isNextMonth,
              "Event date:",
              eventDate,
              "Next month start:",
              nextMonthStart,
              "Next month end:",
              nextMonthEnd,
            )
            return isNextMonth
          default:
            return true
        }
      })
      console.log("[v0] After time filter:", filtered.length, "events")
    }

    if (sortBy !== "all") {
      filtered = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          case "nearest":
            const now = new Date()
            const aTime = new Date(a.event_date).getTime() - now.getTime()
            const bTime = new Date(b.event_date).getTime() - now.getTime()
            // Only consider future events for "nearest" sorting
            if (aTime < 0 && bTime < 0) return 0
            if (aTime < 0) return 1
            if (bTime < 0) return -1
            return aTime - bTime
          default:
            return 0
        }
      })
      console.log("[v0] After sorting:", filtered.length, "events")
    }

    console.log("[v0] Final filtered events:", filtered.length)
    return filtered
  }

  const handleEventCreated = () => {
    console.log("[v0] Event created successfully, reloading events...")
    toast.success("Event wurde erfolgreich erstellt!")
    loadLudoEvents()
    setShowCreateDialog(false)
  }

  const handleJoinEvent = async (eventId: string, message?: string) => {
    if (!user) {
      toast.error("Du musst angemeldet sein, um an einem Event teilzunehmen")
      return
    }

    setJoiningEventId(eventId)
    try {
      const result = await joinLudoEvent(eventId, user.id, message)

      if (result.success) {
        if (result.message) {
          toast.success(result.message)
        } else {
          toast.success("Du nimmst an dem Event teil!")
        }
        await loadLudoEvents() // Reload events to update participant count
      } else {
        toast.error(result.error || "Fehler bei Teilnahme zum Event")
      }
    } catch (error) {
      console.error("Error joining event:", error)
      toast.error("Ein unerwarteter Fehler ist aufgetreten")
    } finally {
      setJoiningEventId(null)
    }
  }

  const openJoinDialog = (event: LudoEvent) => {
    setSelectedEvent(event)
    setShowJoinDialog(true)
  }

  const handleLeaveEvent = async (eventId: string) => {
    if (!user) return

    setLeavingEventId(eventId)
    try {
      const result = await leaveLudoEvent(eventId, user.id)

      if (result.success) {
        toast.success("Du hast das Event erfolgreich verlassen")
        await loadLudoEvents() // Reload events to update participant count
      } else {
        toast.error(result.error || "Fehler beim Verlassen des Events")
      }
    } catch (error) {
      console.error("Error leaving event:", error)
      toast.error("Ein unerwarteter Fehler ist aufgetreten")
    } finally {
      setLeavingEventId(null)
    }
  }

  const handleManageEvent = (event: LudoEvent) => {
    setSelectedEvent(event)
    setShowApprovalDialog(true)
  }

  const handleLocationSearch = (location: string, radius: number) => {
    console.log("[v0] Location search triggered:", location, radius)
    setLocationSearchActive(true)
    // Filter events by location - this would need to be enhanced with actual coordinate-based filtering
    const filtered = ludoEvents.filter((event) => event.location?.toLowerCase().includes(location.toLowerCase()))
    setLocationResults(filtered)
  }

  const resetLocationSearch = () => {
    setLocationSearchActive(false)
    setLocationResults([])
  }

  const loadEventInstances = async (eventId: string) => {
    if (loadingInstances[eventId]) return

    console.log("[v0] Loading event instances for eventId:", eventId)
    setLoadingInstances((prev) => ({ ...prev, [eventId]: true }))

    try {
      const supabase = createClient()

      // Get instances with participant count
      const { data: instances, error } = await supabase
        .from("ludo_event_instances")
        .select(`
          *,
          participant_count:ludo_event_instance_participants(count)
        `)
        .eq("event_id", eventId)
        .order("instance_date", { ascending: true })

      if (error) {
        console.error("[v0] Error fetching event instances:", error)
        throw new Error(error.message)
      }

      console.log("[v0] Raw instances from database:", instances)
      console.log("[v0] Number of instances found:", instances?.length || 0)

      // Check user registration status if authenticated
      let instancesWithRegistration = instances || []
      if (user && instances) {
        const { data: userRegistrations } = await supabase
          .from("ludo_event_instance_participants")
          .select("instance_id")
          .eq("user_id", user.id)
          .in(
            "instance_id",
            instances.map((i) => i.id),
          )

        const registeredInstanceIds = new Set(userRegistrations?.map((r) => r.instance_id) || [])

        instancesWithRegistration = instances.map((instance) => ({
          ...instance,
          participant_count: instance.participant_count?.[0]?.count || 0,
          user_registered: registeredInstanceIds.has(instance.id),
        }))
      } else {
        instancesWithRegistration = instances.map((instance) => ({
          ...instance,
          participant_count: instance.participant_count?.[0]?.count || 0,
          registered: false,
        }))
      }

      console.log("[v0] Loaded instances:", instancesWithRegistration)
      setEventInstances((prev) => ({ ...prev, [eventId]: instancesWithRegistration }))
    } catch (error) {
      console.error("[v0] Error loading event instances:", error)
      alert(`Fehler beim Laden der Termine: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`)
    } finally {
      setLoadingInstances((prev) => ({ ...prev, [eventId]: false }))
    }
  }

  const handleInstanceRegistration = async (instanceId: string, eventId: string, isRegistered: boolean) => {
    try {
      if (isRegistered) {
        await unregisterFromInstance(instanceId)
      } else {
        await registerForInstance(instanceId)
      }
      // Reload instances to update registration status
      await loadEventInstances(eventId)
    } catch (error) {
      console.error("Error handling instance registration:", error)
    }
  }

  const formatRecurringEventDisplay = (event: LudoEvent) => {
    const instances = eventInstances[event.id] || []
    const recurringDates = formatRecurringDates(event)

    if (instances.length === 0) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-teal-600" />
            <span className="truncate">{formatSingleDate(event.event_date)}</span>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span className="truncate text-sm">
              {event.start_time && formatTimeForDate(event.start_time, event.end_time)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Weitere Termine verfügbar</span>
            <button
              onClick={() => {
                loadEventInstances(event.id)
                setActiveTab("terminuebersicht")
              }}
              className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded transition-colors"
            >
              Termine ansehen
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <div className="bg-gray-50 rounded-lg p-3 border">
          <div className="text-sm font-medium text-gray-700 mb-2">Weitere Termine</div>
          <div className="space-y-2">
            {eventInstances[selectedEvent.id].map((instance, index) => (
              <div key={instance.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-teal-600" />
                      <span className="font-medium">{formatSingleDate(instance.instance_date)}</span>
                    </div>
                    {instance.start_time && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4 text-teal-600" />
                        <span>{formatTimeForDate(instance.start_time, instance.end_time)}</span>
                      </div>
                    )}
                    {selectedEvent.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-teal-600" />
                        <span>{selectedEvent.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-2">
                      <Users className="h-4 w-4 inline mr-1" />
                      {(() => {
                        const maxParticipants = instance.max_participants || selectedEvent.max_participants
                        const currentParticipants = instance.participant_count || 0
                        const freePlaces = maxParticipants - currentParticipants

                        return freePlaces <= 0
                          ? "Ausgebucht"
                          : `${currentParticipants} Teilnehmer (${freePlaces} ${freePlaces === 1 ? "Platz frei" : "Plätze frei"})`
                      })()}
                    </div>
                    {user ? (
                      <Button
                        size="sm"
                        variant={instance.user_registered ? "outline" : "default"}
                        onClick={() =>
                          handleInstanceRegistration(instance.id, selectedEvent.id, instance.user_registered)
                        }
                        disabled={loadingInstances[selectedEvent.id]}
                        className="w-full"
                      >
                        {loadingInstances[selectedEvent.id]
                          ? "Laden..."
                          : instance.user_registered
                            ? "Abmelden"
                            : "Teilnehmen"}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setShowLoginPrompt(true)} className="w-full">
                        Anmelden zum Teilnehmen
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const filteredEvents = getFilteredEvents()

  const formatEventDate = (dateString: string | undefined): string => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", weekday: "short" })
  }

  const getDayName = (dateString: string | undefined): string => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("de-DE", { weekday: "long" })
  }

  const handleSendEventMessage = async (event: LudoEvent) => {
    if (!user) {
      window.location.href = "/login"
      return
    }

    setMessageRecipient({
      id: event.creator_id,
      name: event.creator?.username || "Unbekannt",
      avatar: event.creator?.avatar,
      context: {
        title: event.title,
        image: "/community-event.png",
        type: "event",
      },
    })
    setIsMessageModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-teal-50">
      <Navigation currentPage="ludo-events" />

      <div className="container mx-auto px-4 py-8">

        <div className="text-center mb-8">
          <h1 className="font-handwritten text-4xl md:text-5xl text-gray-800 mb-4">Events</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{"Entdecke spannende Spiel-Events!"}</p>
        </div>

        <div className="flex justify-end mb-4">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-handwritten">
                <Plus className="h-4 w-4 mr-2" />
                Neues Event erstellen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <CreateLudoEventForm onSuccess={handleEventCreated} onCancel={() => setShowCreateDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/50 rounded-lg p-4 border border-orange-200 mb-8">
          <div className="space-y-4">
            <SimpleLocationSearch onLocationSearch={handleLocationSearch} className="mb-4" />

            {locationSearchActive && (
              <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
                <span>Standortsuche aktiv</span>
                <Button variant="ghost" size="sm" onClick={resetLocationSearch} className="h-6 px-2 text-xs">
                  Zurücksetzen
                </Button>
              </div>
            )}

            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Events, Orte oder Veranstalter durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-2 border-orange-200 focus:border-orange-400"
                />
              </div>
              <Button
                variant="outline"
                className="border-2 border-orange-400 text-orange-600 hover:bg-orange-400 hover:text-white font-handwritten bg-transparent"
              >
                <Search className="w-5 h-5 mr-2" />
                Suchen
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Sortieren nach</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      Alle
                    </SelectItem>
                    <SelectItem value="newest" className="text-xs">
                      Neueste zuerst
                    </SelectItem>
                    <SelectItem value="nearest" className="text-xs">
                      Zeitlich nächstgelegenes Event
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Häufigkeit Filter */}
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Häufigkeit</Label>
                <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      Alle Häufigkeiten
                    </SelectItem>
                    <SelectItem value="single" className="text-xs">
                      Einmalig
                    </SelectItem>
                    <SelectItem value="regular" className="text-xs">
                      Regelmässig
                    </SelectItem>
                    <SelectItem value="recurring" className="text-xs">
                      Wiederholend
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Zeit Filter */}
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Zeitraum</Label>
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      Alle
                    </SelectItem>
                    <SelectItem value="today" className="text-xs">
                      Heute
                    </SelectItem>
                    <SelectItem value="tomorrow" className="text-xs">
                      Morgen
                    </SelectItem>
                    <SelectItem value="week" className="text-xs">
                      Diese Woche
                    </SelectItem>
                    <SelectItem value="weekend" className="text-xs">
                      Dieses Wochenende
                    </SelectItem>
                    <SelectItem value="nextweek" className="text-xs">
                      Nächste Woche
                    </SelectItem>
                    <SelectItem value="month" className="text-xs">
                      Dieser Monat
                    </SelectItem>
                    <SelectItem value="nextmonth" className="text-xs">
                      Nächster Monat
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/*  Added available spots filter */}
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Verfügbarkeit</Label>
                <Select value={availableSpotsFilter} onValueChange={setAvailableSpotsFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      Alle Events
                    </SelectItem>
                    <SelectItem value="available" className="text-xs">
                      Freie Plätze
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setTimeFilter("all")
                    setFrequencyFilter("all")
                    setSortBy("all")
                    setAvailableSpotsFilter("all")
                    resetLocationSearch()
                  }}
                  className="h-8 text-xs border-2 border-gray-400 text-gray-600 hover:bg-gray-400 hover:text-white font-handwritten bg-transparent"
                >
                  Filter zurücksetzen
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600 font-body">
            {loading ? (
              "Lade Events..."
            ) : (
              <>
                <span className="font-bold text-orange-600">{filteredEvents.length}</span>{" "}
                {filteredEvents.length === 1 ? "Event" : "Events"} gefunden
                {searchTerm && ` für "${searchTerm}"`}
                {sortBy !== "all" &&
                  ` • Sortiert: ${sortBy === "newest" ? "Neueste zuerst" : "Zeitlich nächstgelegenes Event"}`}
                {frequencyFilter !== "all" &&
                  ` • Häufigkeit: ${frequencyFilter === "single" ? "Einmalig" : frequencyFilter === "regular" ? "Regelmässig" : "Wiederholend"}`}
                {timeFilter !== "all" &&
                  ` • Zeit: ${timeFilter === "today" ? "Heute" : timeFilter === "tomorrow" ? "Morgen" : timeFilter === "week" ? "Diese Woche" : timeFilter === "weekend" ? "Dieses Wochenende" : timeFilter === "nextweek" ? "Nächste Woche" : timeFilter === "month" ? "Dieser Monat" : "Nächster Monat"}`}
                {availableSpotsFilter !== "all" && ` • Nur Events mit freien Plätzen`}
                {locationSearchActive && ` • Standort: ${locationResults.length} Ergebnisse`}
              </>
            )}
          </p>
        </div>

        <div className="flex gap-8">
          <div className="flex-1">
            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredEvents.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Keine Events gefunden</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? "Versuche einen anderen Suchbegriff" : "Sei der Erste und erstelle ein neues Event!"}
                  </p>
                  {!searchTerm && (
                    <Button
                      onClick={() => setShowCreateDialog(true)}
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Erstes Event erstellen
                    </Button>
                  )}
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 cursor-pointer relative"
                    onClick={() => {
                      setSelectedEvent(event)
                      setShowDetailsDialog(true)
                    }}
                  >
                    {getEventImage(event) ? (
                      <div className="relative h-48 overflow-hidden rounded-t-lg">
                        <img
                          src={getEventImage(event) || "/placeholder.svg"}
                          alt={event.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                            e.currentTarget.nextElementSibling?.classList.remove("hidden")
                          }}
                        />
                        \
                        <div className="hidden w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <DicesIcon className="h-16 w-16 text-teal-600" />
                        </div>
                        <div className="absolute top-2 right-2 z-50">
                          <div
                            className={`${getFrequencyBadgeColor(event)} text-white px-3 py-1 rounded-full border-2 border-white shadow-lg font-thin text-xs`}
                          >
                            {getFrequencyText(event)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg flex items-center justify-center relative">
                        <DicesIcon className="h-16 w-16 text-teal-600" />
                        <div className="absolute top-2 right-2 z-50">
                          <div
                            className={`${getFrequencyBadgeColor(event)} text-white px-3 py-1 rounded-full border-2 border-white shadow-lg text-xs font-thin`}
                          >
                            {getFrequencyText(event)}
                          </div>
                        </div>
                      </div>
                    )}

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="font-handwritten text-lg text-gray-800 mb-1 group-hover:text-teal-600 transition-colors">
                            {event.title}
                          </CardTitle>
                        </div>
                        <div className="flex flex-col gap-1">
                          {/* Removed rules property as it doesn't exist in database */}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {event.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                      )}

                      <div className="space-y-2">
                        {isRecurringEvent(event) ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-teal-600" />
                              <span className="truncate text-sm">{formatDateForDisplay(event.event_date)}</span>
                              <div className="flex items-center gap-1 ml-2">
                                <Repeat className="h-4 w-4 text-teal-600" />
                                <span className="truncate text-sm">{getFrequencyText(event)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-teal-600" />
                              <span className="truncate text-sm">
                                {event.start_time && formatTimeForDate(event.start_time, event.end_time)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">Weitere Termine verfügbar</div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-teal-600" />
                            <span className="truncate">{formatEventDate(event)}</span>
                          </div>
                        )}

                        {formatEventTime(event) && !isRecurringEvent(event) && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span className="truncate">{formatEventTime(event)}</span>
                          </div>
                        )}

                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-teal-600" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <Dices className="h-4 w-4 text-teal-600" />
                          <span className={isEventSoldOut(event) ? "text-red-600 font-medium" : ""}>
                            {getParticipantText(event)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <UserCog className="h-4 w-4 text-teal-600" />
                          <div className="flex items-center gap-3">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={event.creator?.avatar || "/placeholder.svg"} />
                              <AvatarFallback className>{event.creator?.username?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div onClick={(e) => e.stopPropagation()}>
                              <UserLink
                                userId={event.creator_id}
                                className="font-medium text-gray-800 hover:text-teal-600 transition-colors"
                              >
                                {event.creator?.username}
                              </UserLink>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => {
                            setSelectedEvent(event)
                            setShowDetailsDialog(true)
                          }}
                        >
                          Details
                        </Button>

                        {isEventCreator(event) ? (
                          <Button
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                            onClick={() => handleManageEvent(event)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Verwalten
                          </Button>
                        ) : event.is_participant ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={leavingEventId === event.id}
                            onClick={() => handleLeaveEvent(event.id)}
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                          >
                            {leavingEventId === event.id ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-1"></div>
                                Verlassen...
                              </div>
                            ) : (
                              <>
                                <UserMinus className="h-4 w-4 mr-1" />
                                Verlassen
                              </>
                            )}
                          </Button>
                        ) : event.is_pending ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={leavingEventId === event.id}
                            onClick={() => handleLeaveEvent(event.id)}
                            className="flex-1 border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                          >
                            {leavingEventId === event.id ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600 mr-1"></div>
                                Stornieren...
                              </div>
                            ) : (
                              <>
                                <Clock className="h-4 w-4 mr-1" />
                                Ausstehend
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={isEventSoldOut(event) || joiningEventId === event.id}
                            onClick={() => {
                              if (!user) {
                                window.location.href = "/login"
                                return
                              }

                              if (isRecurringEvent(event)) {
                                // For recurring events, show date selection dialog
                                setSelectedEvent(event)
                                loadEventInstances(event.id)
                              } else if (event.approval_mode === "manual") {
                                openJoinDialog(event)
                              } else {
                                handleJoinEvent(event.id)
                              }
                            }}
                            className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white disabled:opacity-50"
                          >
                            {joiningEventId === event.id ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                Teilnehmen...
                              </div>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-1" />
                                {!user ? "Teilnehmen" : isEventSoldOut(event) ? "Ausgebucht" : "Teilnehmen"}
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSendEventMessage(event)
                          }}
                          className="px-3 bg-transparent"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="hidden xl:block w-44">
            <div className="sticky top-8">
              <WideSkyscraperAd />
            </div>
          </div>
        </div>

        {/* Event Details Dialog */}
        {selectedEvent && (
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-handwritten text-gray-800">{selectedEvent.title}</DialogTitle>
              </DialogHeader>

              {isRecurringEvent(selectedEvent) ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="grundinformationen">Grundinformationen</TabsTrigger>
                    <TabsTrigger value="terminuebersicht">Terminübersicht</TabsTrigger>
                  </TabsList>

                  <TabsContent value="grundinformationen" className="space-y-6">
                    {getEventImage(selectedEvent) ? (
                      <img
                        src={getEventImage(selectedEvent) || "/placeholder.svg"}
                        alt={selectedEvent.title}
                        className="w-full h-64 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                          e.currentTarget.nextElementSibling?.classList.remove("hidden")
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center ${getEventImage(selectedEvent) ? "hidden" : ""}`}
                    >
                      <DicesIcon className="h-20 w-20 text-teal-600" />
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Organisiert von</span>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={selectedEvent.creator?.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{selectedEvent.creator?.username?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div>
                            <UserLink
                              userId={selectedEvent.creator_id}
                              className="font-medium text-gray-800 hover:text-teal-600 transition-colors"
                            >
                              {selectedEvent.creator?.username}
                            </UserLink>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedEvent.description && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-800">Beschreibung</h3>
                        <p className="text-gray-600">{selectedEvent.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-teal-600" />
                          <span>{formatEventDate(selectedEvent.event_date)}</span>
                        </div>
                        {selectedEvent.start_time && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-teal-600" />
                            <span>{formatTimeForDate(selectedEvent.start_time, selectedEvent.end_time)}</span>
                          </div>
                        )}
                        {selectedEvent.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-teal-600" />
                            <span>{selectedEvent.location}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Repeat className="h-4 w-4 text-teal-600" />
                          <span>{getFrequencyText(selectedEvent)}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Dices className="h-4 w-4 text-teal-600" />
                          <span>{getGamesText(selectedEvent)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-teal-600" />
                          <span>{getParticipantText(selectedEvent)}</span>
                        </div>
                        {isRecurringEvent(selectedEvent) && (
                          <div className="flex items-center gap-2">
                            <Repeat className="h-4 w-4 text-teal-600" />
                            <span>{getFrequencyText(selectedEvent)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="terminuebersicht" className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800">Weitere Termine</h3>

                      {console.log("[v0] Rendering Terminübersicht for event:", selectedEvent.id)}
                      {console.log("[v0] Event instances available:", eventInstances[selectedEvent.id])}
                      {console.log("[v0] Instance count:", eventInstances[selectedEvent.id]?.length || 0)}

                      {eventInstances[selectedEvent.id] && eventInstances[selectedEvent.id].length > 0 ? (
                        <div className="space-y-2">
                          {eventInstances[selectedEvent.id].map((instance, index) => (
                            <div key={instance.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-teal-600" />
                                    <span className="font-medium">{formatSingleDate(instance.instance_date)}</span>
                                  </div>
                                  {instance.start_time && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <Clock className="h-4 w-4 text-teal-600" />
                                      <span>{formatTimeForDate(instance.start_time, instance.end_time)}</span>
                                    </div>
                                  )}
                                  {selectedEvent.location && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <MapPin className="h-4 w-4 text-teal-600" />
                                      <span>{selectedEvent.location}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-gray-600 mb-2">
                                    <Users className="h-4 w-4 inline mr-1" />
                                    {(() => {
                                      const maxParticipants =
                                        instance.max_participants || selectedEvent.max_participants
                                      const currentParticipants = instance.participant_count || 0
                                      const freePlaces = maxParticipants - currentParticipants

                                      return freePlaces <= 0
                                        ? "Ausgebucht"
                                        : `${currentParticipants} Teilnehmer (${freePlaces} ${freePlaces === 1 ? "Platz frei" : "Plätze frei"})`
                                    })()}
                                  </div>
                                  {user ? (
                                    <Button
                                      size="sm"
                                      variant={instance.user_registered ? "outline" : "default"}
                                      onClick={() =>
                                        handleInstanceRegistration(
                                          instance.id,
                                          selectedEvent.id,
                                          instance.user_registered,
                                        )
                                      }
                                      disabled={loadingInstances[selectedEvent.id]}
                                      className="w-full"
                                    >
                                      {loadingInstances[selectedEvent.id]
                                        ? "Laden..."
                                        : instance.user_registered
                                          ? "Abmelden"
                                          : "Teilnehmen"}
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        if (!user) {
                                          window.location.href = "/login"
                                          return
                                        }
                                        setShowLoginPrompt(true)
                                      }}
                                      className="w-full"
                                    >
                                      Anmelden zum Teilnehmen
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>Keine weiteren Termine verfügbar</p>
                          <p className="text-sm">Der Ersteller hat noch keine zusätzlichen Termine hinzugefügt.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                /* Single events now also show creator information */
                <div className="space-y-6">
                  {getEventImage(selectedEvent) ? (
                    <img
                      src={getEventImage(selectedEvent) || "/placeholder.svg"}
                      alt={selectedEvent.title}
                      className="w-full h-64 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                        e.currentTarget.nextElementSibling?.classList.remove("hidden")
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center ${getEventImage(selectedEvent) ? "hidden" : ""}`}
                  >
                    <DicesIcon className="h-20 w-20 text-gray-400" />
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Organisiert von</span>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={selectedEvent.creator?.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{selectedEvent.creator?.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div>
                          <UserLink
                            userId={selectedEvent.creator_id}
                            className="font-medium text-gray-800 hover:text-teal-600 transition-colors"
                          >
                            {selectedEvent.creator?.username}
                          </UserLink>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedEvent.description && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-800">Beschreibung</h3>
                      <p className="text-gray-600">{selectedEvent.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-teal-600" />
                        <span>{formatEventDate(selectedEvent.event_date)}</span>
                        {isRecurringEvent(selectedEvent) && (
                          <>
                            <Repeat className="h-4 w-4 text-teal-600 ml-4" />
                            <span>{getFrequencyText(selectedEvent)}</span>
                          </>
                        )}
                      </div>

                      {selectedEvent.start_time && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-teal-600" />
                          <span>{formatTimeForDate(selectedEvent.start_time, selectedEvent.end_time)}</span>
                        </div>
                      )}

                      {selectedEvent.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-teal-600" />
                          <span>{selectedEvent.location}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Dices className="h-4 w-4 text-teal-600" />
                        <span>{getGamesText(selectedEvent)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-teal-600" />
                        <span>{getParticipantText(selectedEvent)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                {isEventCreator(selectedEvent) ? (
                  <Button
                    className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                    onClick={() => handleManageEvent(selectedEvent)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Event verwalten
                  </Button>
                ) : selectedEvent.is_participant ? (
                  <Button
                    variant="outline"
                    disabled={leavingEventId === selectedEvent.id}
                    onClick={() => handleLeaveEvent(selectedEvent.id)}
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    {leavingEventId === selectedEvent.id ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                        Verlassen...
                      </div>
                    ) : (
                      <>
                        <UserMinus className="h-4 w-4 mr-1" />
                        Event verlassen
                      </>
                    )}
                  </Button>
                ) : selectedEvent.is_pending ? (
                  <Button
                    variant="outline"
                    disabled={leavingEventId === selectedEvent.id}
                    onClick={() => handleLeaveEvent(selectedEvent.id)}
                    className="flex-1 border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                  >
                    {leavingEventId === selectedEvent.id ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                        Stornieren...
                      </div>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 mr-1" />
                        Anfrage ausstehend
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={isEventSoldOut(selectedEvent) || joiningEventId === selectedEvent.id}
                    onClick={() => {
                      if (!user) {
                        window.location.href = "/login"
                        return
                      }

                      if (selectedEvent.approval_mode === "manual") {
                        openJoinDialog(selectedEvent)
                      } else {
                        handleJoinEvent(selectedEvent.id)
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white disabled:opacity-50"
                  >
                    {joiningEventId === selectedEvent.id ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Teilnehmen...
                      </div>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1" />
                        {!user ? "Anmelden" : isEventSoldOut(selectedEvent) ? "Ausgebucht" : "Teilnehmen"}
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="px-4 bg-transparent"
                  onClick={() => {
                    if (!user) {
                      window.location.href = "/login"
                      return
                    }
                    if (selectedEvent) {
                      handleSendEventMessage(selectedEvent)
                      setShowDetailsDialog(false)
                    }
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Nachricht
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Join Event Dialog */}
        {selectedEvent && (
          <JoinEventDialog
            isOpen={showJoinDialog}
            onClose={() => setShowJoinDialog(false)}
            onJoin={(message) => handleJoinEvent(selectedEvent.id, message)}
            eventTitle={selectedEvent.title}
            approvalMode={selectedEvent.approval_mode || "automatic"}
            isLoading={joiningEventId === selectedEvent.id}
          />
        )}

        {/* Event Approval Management Dialog */}
        {selectedEvent && (
          <EventApprovalManagement
            eventId={selectedEvent.id}
            eventTitle={selectedEvent.title}
            creatorId={selectedEvent.creator_id}
            approvalMode={selectedEvent.approval_mode || "automatic"}
            isOpen={showApprovalDialog}
            onClose={() => setShowApprovalDialog(false)}
            onUpdate={loadLudoEvents}
          />
        )}

        <MessageComposerModal
          isOpen={isMessageModalOpen}
          onClose={() => {
            setIsMessageModalOpen(false)
            setMessageRecipient(null)
          }}
          recipientId={messageRecipient?.id || ""}
          recipientName={messageRecipient?.name || ""}
          recipientAvatar={messageRecipient?.avatar}
          context={messageRecipient?.context || { title: "", type: "event" }}
        />
      </div>
    </div>
  )
}

export default function LudoEventsPage() {
  return (
    <GeolocationProvider>
      <LocationSearchProvider>
        <LudoEventsContent />
      </LocationSearchProvider>
    </GeolocationProvider>
  )
}
