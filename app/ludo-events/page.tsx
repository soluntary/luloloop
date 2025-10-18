"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Plus,
  MapPin,
  Calendar,
  Clock,
  UserPlus,
  MessageCircle,
  Settings,
  Filter,
  Users,
  UserCog,
  Dices,
  UserCheck,
  Spade,
  CalendarSearch as CalendarSync,
  ChevronDown,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Navigation from "@/components/navigation"
import UserLink from "@/components/user-link"
import { SkyscraperAd } from "@/components/advertising/ad-placements"
import DateSelectionDialog from "@/components/date-selection-dialog"
import { MessageComposerModal } from "@/components/message-composer-modal"
import { LudoEventManagementDialog } from "@/components/ludo-event-management-dialog"
import { ShareButton } from "@/components/share-button"
import { SimpleLocationSearch } from "@/components/simple-location-search"
import { useLocationSearch } from "@/contexts/location-search-context"
import { DistanceBadge } from "@/components/distance-badge"
import { LocationMap } from "@/components/location-map"
import CreateLudoEventForm from "@/components/create-ludo-event-form-advanced"

interface LudoEvent {
  id: string
  title: string
  description: string
  creator_id: string
  max_participants: number | null
  start_time: string
  end_time: string
  location: string
  location_type: "local" | "virtual"
  virtual_link: string | null
  frequency: "single" | "regular" | "recurring" | "täglich" | "wöchentlich" | "zweiwöchentlich" | "monatlich" | "andere"
  interval_type: string | null
  custom_interval: string | null
  visibility: "public" | "friends_only" | "private"
  approval_mode: "automatic" | "manual"
  organizer_only: boolean
  image_url: string | null
  selected_games: any[]
  additional_notes: string | null
  created_at: string
  participant_count: number
  user_participation_status: string | null
  has_additional_dates: boolean
  first_instance_date?: string
  creator: {
    id: string
    username: string
    name: string | null
    avatar: string | null
  }
  // Add distance property for location-based filtering
  distance?: number
}

export default function LudoEventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<LudoEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [frequencyFilter, setFrequencyFilter] = useState("all")
  const [timePeriodFilter, setTimePeriodFilter] = useState("all")
  const [availabilityFilter, setAvailabilityFilter] = useState("all")
  const [approvalModeFilter, setApprovalModeFilter] = useState("all")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<LudoEvent | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [managementEvent, setManagementEvent] = useState<LudoEvent | null>(null)
  const [isManagementDialogOpen, setIsManagementDialogOpen] = useState(false)
  const [approvalEvent, setApprovalEvent] = useState<LudoEvent | null>(null)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [joinEvent, setJoinEvent] = useState<LudoEvent | null>(null)
  const [joinMessage, setJoinMessage] = useState("")
  const [isDateSelectionOpen, setIsDateSelectionOpen] = useState(false)
  const [dateSelectionEvent, setDateSelectionEvent] = useState<LudoEvent | null>(null)
  const [detailViewTab, setDetailViewTab] = useState<"info" | "schedule">("info")
  // const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [additionalDates, setAdditionalDates] = useState<any[]>([])
  const [isMessageComposerOpen, setIsMessageComposerOpen] = useState(false)
  const [messageRecipient, setMessageRecipient] = useState<{
    id: string
    name: string
    avatar: string | null
  } | null>(null)
  const [messageContext, setMessageContext] = useState<{
    title: string
    image?: string
    type: "event"
  } | null>(null)
  const [locationSearchResults, setLocationSearchResults] = useState<any[]>([])
  const [showLocationResults, setShowLocationResults] = useState(false)
  const { searchByAddress, searchEventsNearby } = useLocationSearch()

  const supabase = createClient()

  useEffect(() => {
    loadEvents()
  }, [user])

  const loadEvents = async () => {
    try {
      console.log("[v0] Loading ludo events...")

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from("ludo_events")
        .select(`
          *,
          creator:users!creator_id(id, username, name, avatar),
          ludo_event_instances!inner(instance_date)
        `)
        .eq("visibility", "public")
        .gte("ludo_event_instances.instance_date", today.toISOString().split("T")[0])
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error loading events:", error)
        toast.error("Fehler beim Laden der Events")
        return
      }

      const processedEvents = await Promise.all(
        (data || []).map(async (event: any) => {
          // Get the earliest instance date for this event
          const { data: instances } = await supabase
            .from("ludo_event_instances")
            .select("instance_date")
            .eq("event_id", event.id)
            .gte("instance_date", today.toISOString().split("T")[0])
            .order("instance_date", { ascending: true })
            .limit(1)

          return {
            ...event,
            first_instance_date: instances?.[0]?.instance_date || null,
          }
        }),
      )

      if (user) {
        const eventsWithStatus = await Promise.all(
          processedEvents.map(async (event) => {
            // Check if user is registered for any instances of this event
            const { data: instanceRegistrations } = await supabase
              .from("ludo_event_instance_participants")
              .select("instance_id, status")
              .eq("user_id", user.id)
              .in(
                "instance_id",
                await supabase
                  .from("ludo_event_instances")
                  .select("id")
                  .eq("event_id", event.id)
                  .then((res) => (res.data || []).map((i) => i.id)),
              )

            const { count: participantCount } = await supabase
              .from("ludo_event_participants")
              .select("*", { count: "exact", head: true })
              .eq("event_id", event.id)
              .eq("status", "confirmed")

            const { data: instancesData } = await supabase
              .from("ludo_event_instances")
              .select("id")
              .eq("event_id", event.id)

            // Determine user participation status based on instance registrations
            let userStatus = null
            if (instanceRegistrations && instanceRegistrations.length > 0) {
              // If user is registered for any instance, show as "approved"
              const hasRegistered = instanceRegistrations.some((r) => r.status === "registered")
              const hasPending = instanceRegistrations.some((r) => r.status === "pending")

              if (hasRegistered) {
                userStatus = "approved"
              } else if (hasPending) {
                userStatus = "pending"
              }
            }

            return {
              ...event,
              user_participation_status: userStatus,
              participant_count: participantCount || 0,
              has_additional_dates: (instancesData?.length || 0) > 1,
            }
          }),
        )

        setEvents(eventsWithStatus)
      } else {
        const eventsWithCounts = await Promise.all(
          processedEvents.map(async (event) => {
            const { count: participantCount } = await supabase
              .from("ludo_event_participants")
              .select("*", { count: "exact", head: true })
              .eq("event_id", event.id)
              .eq("status", "confirmed")

            const { data: instancesData } = await supabase
              .from("ludo_event_instances")
              .select("id")
              .eq("event_id", event.id)

            return {
              ...event,
              user_participation_status: null,
              participant_count: participantCount || 0,
              has_additional_dates: (instancesData?.length || 0) > 1,
            }
          }),
        )

        setEvents(eventsWithCounts)
      }

      console.log("[v0] Events loaded successfully:", processedEvents.length)
    } catch (error) {
      console.error("[v0] Error in loadEvents:", error)
      toast.error("Fehler beim Laden der Events")
    } finally {
      setLoading(false)
    }
  }

  const loadAdditionalDates = async (eventId: string) => {
    try {
      console.log("[v0] Loading additional dates for event:", eventId)

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from("ludo_event_instances")
        .select("*")
        .eq("event_id", eventId)
        .gte("instance_date", today.toISOString().split("T")[0])
        .order("instance_date", { ascending: true })

      if (error) throw error

      console.log("[v0] Loaded event instances from database:", data)
      console.log("[v0] Number of instances loaded:", data?.length || 0)

      // Get participant counts for each instance
      const instancesWithCounts = await Promise.all(
        (data || []).map(async (instance) => {
          const { count } = await supabase
            .from("ludo_event_instance_participants")
            .select("*", { count: "exact", head: true })
            .eq("instance_id", instance.id)
            .eq("status", "registered")

          return {
            event_date: instance.instance_date,
            start_time: instance.start_time,
            end_time: instance.end_time,
            max_participants: instance.max_participants,
            notes: instance.notes,
            participant_count: count || 0,
          }
        }),
      )

      console.log("[v0] All dates from ludo_event_instances (sorted):", instancesWithCounts)
      setAdditionalDates(instancesWithCounts)
    } catch (error) {
      console.error("[v0] Error loading additional dates:", error)
      setAdditionalDates([])
    }
  }

  const handleJoinEvent = async (event: LudoEvent) => {
    if (!user) {
      toast.info("Bitte melde dich an, um an Events teilzunehmen")
      window.location.href = "/login"
      return
    }

    const isRecurring =
      event.frequency === "regular" ||
      event.frequency === "recurring" ||
      event.frequency === "täglich" ||
      event.frequency === "wöchentlich" ||
      event.frequency === "zweiwöchentlich" ||
      event.frequency === "monatlich" ||
      event.frequency === "andere"

    // For recurring events with additional dates, show date selection
    if (isRecurring && event.has_additional_dates) {
      setDateSelectionEvent(event)
      // Reset selectedDates state as it's handled by DateSelectionDialog component
      // setSelectedDates([])
      setIsDateSelectionOpen(true)
      return
    }

    // For events requiring approval, show join dialog
    if (event.approval_mode === "manual") {
      setJoinEvent(event)
      setJoinMessage("")
      setIsJoinDialogOpen(true)
      return
    }

    // Direct participation for automatic approval single events
    await processJoinEvent(event, "")
  }

  const processJoinEvent = async (event: LudoEvent, message = "", selectedEventDates: string[] = []) => {
    if (!user) return

    try {
      // Check if event is full (for single events)
      if (event.frequency === "single" && event.max_participants && event.participant_count >= event.max_participants) {
        toast.error("Das Event ist bereits ausgebucht")
        return
      }

      if (event.approval_mode === "manual") {
        // For manual approval, create a join request
        const { error } = await supabase.from("ludo_event_join_requests").insert({
          event_id: event.id,
          user_id: user.id,
          status: "pending",
          message: message || null,
          created_at: new Date().toISOString(),
        })

        if (error) {
          if (error.code === "23505") {
            toast.error("Du hast bereits eine Anfrage für dieses Event gestellt")
            return
          }
          throw error
        }

        toast.success("Anmeldung eingereicht! Warte auf Bestätigung des Organisators.")
      } else {
        // For automatic approval, add directly to participants
        if (selectedEventDates.length > 0) {
          // We'll handle this by creating separate participant entries for each date
          const participantEntries = selectedEventDates.map((date) => ({
            event_id: event.id,
            user_id: user.id,
            status: "approved",
            joined_at: new Date().toISOString(),
          }))

          const { error } = await supabase.from("ludo_event_participants").insert(participantEntries)

          if (error) {
            if (error.code === "23505") {
              toast.error("Du bist bereits für einige dieser Termine angemeldet")
              return
            }
            throw error
          }

          toast.success(`Erfolgreich für ${selectedEventDates.length} Termin(e) angemeldet!`)
        } else {
          // Single event participation
          const { error } = await supabase.from("ludo_event_participants").insert({
            event_id: event.id,
            user_id: user.id,
            status: "approved",
            joined_at: new Date().toISOString(),
          })

          if (error) {
            if (error.code === "23505") {
              toast.error("Du bist bereits für dieses Event angemeldet")
              return
            }
            throw error
          }

          toast.success("Erfolgreich für das Event angemeldet!")
        }
      }

      // Close dialogs and refresh
      setIsJoinDialogOpen(false)
      setIsDateSelectionOpen(false)
      loadEvents()
    } catch (error) {
      console.error("Error joining event:", error)
      toast.error("Fehler beim Anmelden für das Event")
    }
  }

  const leaveEvent = async (event: LudoEvent) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("ludo_event_participants")
        .delete()
        .eq("event_id", event.id)
        .eq("user_id", user.id)

      if (error) throw error

      toast.success("Erfolgreich vom Event abgemeldet")
      loadEvents() // Refresh events
    } catch (error) {
      console.error("Error leaving event:", error)
      toast.error("Fehler beim Abmelden vom Event")
    }
  }

  const getJoinButtonProps = (event: LudoEvent) => {
    if (!user) {
      return { text: "Teilnehmen", disabled: false, variant: "default" as const }
    }

    if (event.creator_id === user.id) {
      return { text: "Dein Event", disabled: true, variant: "secondary" as const }
    }

    if (event.user_participation_status === "approved") {
      return { text: "Angemeldet", disabled: false, variant: "outline" as const, action: "manage" }
    }

    if (event.user_participation_status === "pending") {
      return { text: "Warte auf Genehmigung", disabled: true, variant: "outline" as const, icon: Clock }
    }

    if (event.max_participants && event.participant_count >= event.max_participants) {
      return { text: "Ausgebucht", disabled: true, variant: "secondary" as const }
    }

    return { text: "Teilnehmen", disabled: false, variant: "default" as const }
  }

  const showEventDetails = (event: LudoEvent, targetTab: "info" | "schedule" = "info") => {
    setSelectedEvent(event)
    setDetailViewTab(targetTab)
    setIsDetailsDialogOpen(true)

    const isRecurring =
      event.frequency === "regular" ||
      event.frequency === "recurring" ||
      event.frequency === "täglich" ||
      event.frequency === "wöchentlich" ||
      event.frequency === "zweiwöchentlich" ||
      event.frequency === "monatlich" ||
      event.frequency === "andere"

    if (isRecurring) {
      loadAdditionalDates(event.id)
    }
  }

  const openEventManagement = (event: LudoEvent, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    console.log("[v0] Opening event management for event:", event.id, event.title)
    setManagementEvent(event)
    setIsManagementDialogOpen(true)
  }

  const openApprovalManagement = (event: LudoEvent, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setApprovalEvent(event)
    setIsApprovalDialogOpen(true)
  }

  const openMessageComposer = (event: LudoEvent, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setMessageRecipient({
      id: event.creator_id,
      name: event.creator.name || event.creator.username,
      avatar: event.creator.avatar,
    })
    setMessageContext({
      title: event.title,
      image: event.image_url || undefined,
      type: "event",
    })
    setIsMessageComposerOpen(true)
  }

  const handleLocationSearch = async (address: string, radius: number) => {
    try {
      const results = await searchByAddress(address, radius)
      let searchResults: any[] = []
      if (Array.isArray(results)) {
        searchResults = results
      } else if (results && typeof results === "object") {
        searchResults = [results]
      } else {
        searchResults = []
      }
      setLocationSearchResults(searchResults)
      setShowLocationResults(true)
    } catch (error) {
      console.error("Location search error:", error)
      setLocationSearchResults([])
      setShowLocationResults(false)
    }
  }

  const handleNearbySearch = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation wird von deinem Browser nicht unterstützt")
      return
    }

    toast.info("Standort wird ermittelt...")

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        console.log("[v0] User location:", { latitude, longitude })

        try {
          const results = await searchEventsNearby(latitude, longitude, 50) // 50km radius
          console.log("[v0] Nearby events found:", results)

          setLocationSearchResults(results || [])
          setShowLocationResults(true)
          toast.success(`${results?.length || 0} Events in deiner Nähe gefunden`)
        } catch (error) {
          console.error("[v0] Error searching nearby events:", error)
          toast.error("Fehler bei der Standortsuche")
        }
      },
      (error) => {
        console.error("[v0] Geolocation error:", error)
        toast.error("Standort konnte nicht ermittelt werden")
      },
    )
  }

  const getFilteredEvents = () => {
    const sourceEvents = showLocationResults ? locationSearchResults : events

    let filtered = sourceEvents.filter((event) => {
      // Search filter
      const searchMatch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.creator.username?.toLowerCase().includes(searchTerm.toLowerCase())

      if (!searchMatch) return false

      // Location filter
      if (locationFilter !== "all") {
        if (locationFilter === "local" && event.location_type !== "local") return false
        if (locationFilter === "virtual" && event.location_type !== "virtual") return false
      }

      // Frequency filter
      if (frequencyFilter !== "all") {
        // Map old frequency values to new ones for backwards compatibility
        const eventFrequency = event.frequency

        if (frequencyFilter === "einmalig" && eventFrequency !== "einmalig" && eventFrequency !== "single") return false
        if (frequencyFilter === "täglich" && eventFrequency !== "täglich") return false
        if (frequencyFilter === "wöchentlich" && eventFrequency !== "wöchentlich" && eventFrequency !== "weekly")
          return false
        if (frequencyFilter === "monatlich" && eventFrequency !== "monatlich" && eventFrequency !== "monthly")
          return false
        if (frequencyFilter === "jährlich" && eventFrequency !== "jährlich") return false
        if (frequencyFilter === "andere" && eventFrequency !== "andere" && eventFrequency !== "custom") return false
      }

      if (approvalModeFilter !== "all") {
        if (approvalModeFilter === "automatic" && event.approval_mode !== "automatic") return false
        if (approvalModeFilter === "manual" && event.approval_mode !== "manual") return false
      }

      // Time period filter
      if (timePeriodFilter !== "all") {
        if (!event.first_instance_date) return false

        const eventDate = new Date(event.first_instance_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const thisWeekEnd = new Date(today)
        thisWeekEnd.setDate(today.getDate() + (7 - today.getDay()))

        const nextWeekStart = new Date(thisWeekEnd)
        nextWeekStart.setDate(thisWeekEnd.getDate() + 1)
        const nextWeekEnd = new Date(nextWeekStart)
        nextWeekEnd.setDate(nextWeekStart.getDate() + 6)

        const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1)
        const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0)

        const weekendStart = new Date(today)
        weekendStart.setDate(today.getDate() + (6 - today.getDay())) // Saturday
        const weekendEnd = new Date(weekendStart)
        weekendEnd.setDate(weekendStart.getDate() + 1) // Sunday

        if (timePeriodFilter === "heute") {
          if (eventDate.toDateString() !== today.toDateString()) return false
        } else if (timePeriodFilter === "morgen") {
          if (eventDate.toDateString() !== tomorrow.toDateString()) return false
        } else if (timePeriodFilter === "wochenende") {
          if (eventDate < weekendStart || eventDate > weekendEnd) return false
        } else if (timePeriodFilter === "diese-woche") {
          if (eventDate < today || eventDate > thisWeekEnd) return false
        } else if (timePeriodFilter === "naechste-woche") {
          if (eventDate < nextWeekStart || eventDate > nextWeekEnd) return false
        } else if (timePeriodFilter === "dieser-monat") {
          if (eventDate < today || eventDate > thisMonthEnd) return false
        } else if (timePeriodFilter === "naechster-monat") {
          if (eventDate < nextMonthStart || eventDate > nextMonthEnd) return false
        }
      }

      // Availability filter
      if (availabilityFilter !== "all") {
        const hasSpots = !event.max_participants || event.participant_count < event.max_participants
        if (availabilityFilter === "available" && !hasSpots) return false
        if (availabilityFilter === "full" && hasSpots) return false
      }

      return true
    })

    // Sort events
    if (sortBy !== "all") {
      filtered = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          case "date":
            // Use first_instance_date for sorting
            return new Date(a.first_instance_date || "").getTime() - new Date(b.first_instance_date || "").getTime()
          case "participants":
            return b.participant_count - a.participant_count
          default:
            return 0
        }
      })
    }

    return filtered
  }

  const filteredEvents = getFilteredEvents()

  const formatEventDate = (dateStr: string, timeStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)

    const isToday = date.toDateString() === today.toDateString()
    const isTomorrow = date.toDateString() === tomorrow.toDateString()

    if (isToday) return `Heute`
    if (isTomorrow) return `Morgen`

    return date.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const getIntervalDisplay = (event: LudoEvent) => {
    console.log("[v0] Event interval data:", {
      frequency: event.frequency,
      interval_type: event.interval_type,
      custom_interval: event.custom_interval,
    })

    // New German frequency values
    if (event.frequency === "täglich") return "Täglich"
    if (event.frequency === "wöchentlich") return "Wöchentlich"
    if (event.frequency === "zweiwöchentlich") return "Zweiwöchentlich"
    if (event.frequency === "monatlich") return "Monatlich"
    if (event.frequency === "andere" && event.custom_interval) return event.custom_interval

    // Old frequency values with interval_type
    if (event.frequency !== "regular" && event.frequency !== "recurring") return null
    if (!event.interval_type) return null

    const intervalMap: { [key: string]: string } = {
      weekly: "Wöchentlich",
      biweekly: "Zweiwöchentlich",
      monthly: "Monatlich",
      custom: event.custom_interval || "Benutzerdefiniert",
    }

    const result = intervalMap[event.interval_type] || event.interval_type
    console.log("[v0] Interval display result:", result)
    return result
  }

  const formatParticipantCount = (event: LudoEvent) => {
    if (event.max_participants === null) {
      return (
        <>
          {event.participant_count} Teilnehmer <span className="text-gray-500">(unbegrenzt)</span>
        </>
      )
    }

    const freeSpots = event.max_participants - event.participant_count
    if (freeSpots > 0) {
      return (
        <>
          {event.participant_count} Teilnehmer (
          <span className="text-green-600 font-medium">{freeSpots} Plätze frei</span>)
        </>
      )
    } else {
      return (
        <>
          {event.participant_count} Teilnehmer (<span className="text-red-600 font-medium">Ausgebucht</span>)
        </>
      )
    }
  }

  const getFrequencyBadge = (frequency: string) => {
    const frequencyMap: { [key: string]: string } = {
      single: "Einmalig",
      regular: "Regelmässig",
      recurring: "Wiederholend",
      täglich: "Täglich",
      wöchentlich: "Wöchentlich",
      zweiwöchentlich: "Zweiwöchentlich",
      monatlich: "Monatlich",
      andere: "Andere",
    }
    return frequencyMap[frequency] || frequency
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-teal-50">
      <Navigation currentPage="ludo-events" />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-handwritten text-4xl md:text-5xl text-gray-800 mb-4">Spielevents</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Entdecke spannende Spielevents und verbinde dich mit anderen Spielern
          </p>
          {user && (
            <Button
              onClick={() => {
                console.log("[v0] Event erstellen button clicked")
                console.log("[v0] User:", user)
                console.log("[v0] Opening create dialog...")
                setIsCreateDialogOpen(true)
                console.log("[v0] isCreateDialogOpen state set to true")
              }}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 font-handwritten"
            >
              <Plus className="h-4 w-4 mr-2" />
              Event erstellen
            </Button>
          )}
          {!user && console.log("[v0] Create button not shown - user not logged in")}
        </div>

        {/* Updated filter section with professional, unified design */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg">
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Events durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 bg-white/80 border-gray-200 focus:border-teal-500 text-base"
                />
              </div>
            </div>

            {/* Location Search */}
            <div className="space-y-3">
              <SimpleLocationSearch onLocationSearch={handleLocationSearch} onNearbySearch={handleNearbySearch} />
            </div>

            {showLocationResults && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-blue-800 font-medium">
                    Zeige Ergebnisse in der Nähe ({locationSearchResults.length})
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowLocationResults(false)
                    setLocationSearchResults([])
                  }}
                  className="text-blue-600 border-blue-300 hover:bg-blue-100"
                >
                  Alle Events zeigen
                </Button>
              </div>
            )}

            {/* Basic Filters */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Sortieren nach</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-teal-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="newest">Neueste</SelectItem>
                      <SelectItem value="date">Datum</SelectItem>
                      <SelectItem value="participants">Teilnehmer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Häufigkeit</Label>
                  <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
                    <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-teal-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="einmalig">Einmalig</SelectItem>
                      <SelectItem value="täglich">Täglich</SelectItem>
                      <SelectItem value="wöchentlich">Wöchentlich</SelectItem>
                      <SelectItem value="monatlich">Monatlich</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Zeitpunkt</Label>
                  <Select value={timePeriodFilter} onValueChange={setTimePeriodFilter}>
                    <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-teal-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="heute">Heute</SelectItem>
                      <SelectItem value="morgen">Morgen</SelectItem>
                      <SelectItem value="wochenende">Wochenende</SelectItem>
                      <SelectItem value="diese-woche">Diese Woche</SelectItem>
                      <SelectItem value="naechste-woche">Nächste Woche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="h-12 w-full border-2 border-teal-500 text-teal-600 hover:bg-teal-50 font-medium"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Erweiterte Filter
                    <ChevronDown
                      className={`w-4 h-4 ml-2 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`}
                    />
                  </Button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="pt-6 border-t border-gray-200 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                    <Filter className="w-4 h-4 mr-2" />
                    Erweiterte Filter
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Ort</Label>
                      <Select value={locationFilter} onValueChange={setLocationFilter}>
                        <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-teal-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle</SelectItem>
                          <SelectItem value="local">Vor Ort</SelectItem>
                          <SelectItem value="virtual">Online</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Kapazität</Label>
                      <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                        <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-teal-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle</SelectItem>
                          <SelectItem value="available">Freie Plätze</SelectItem>
                          <SelectItem value="full">Ausgebucht</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Teilnahme</Label>
                      <Select value={approvalModeFilter} onValueChange={setApprovalModeFilter}>
                        <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-teal-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle</SelectItem>
                          <SelectItem value="automatic">Direkte Teilnahme</SelectItem>
                          <SelectItem value="manual">Teilnahme erst nach Genehmigung</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Reset Button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setSortBy("all")
                    setLocationFilter("all")
                    setFrequencyFilter("all")
                    setTimePeriodFilter("all")
                    setAvailabilityFilter("all")
                    setApprovalModeFilter("all")
                    setShowLocationResults(false)
                    setLocationSearchResults([])
                  }}
                  className="h-12 px-6 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 font-medium"
                >
                  Filter zurücksetzen
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="flex gap-8">
          <div className="flex-1">
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
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 font-handwritten"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Erstes Event erstellen
                    </Button>
                  )}
                </div>
              ) : (
                filteredEvents.map((event) => {
                  const buttonProps = getJoinButtonProps(event)
                  const IconComponent = buttonProps.icon
                  const intervalDisplay = getIntervalDisplay(event)

                  const isRecurring =
                    event.frequency === "regular" ||
                    event.frequency === "recurring" ||
                    event.frequency === "täglich" ||
                    event.frequency === "wöchentlich" ||
                    event.frequency === "zweiwöchentlich" ||
                    event.frequency === "monatlich" ||
                    event.frequency === "andere"

                  return (
                    <Card
                      key={event.id}
                      onClick={() => showEventDetails(event)}
                      className="group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 cursor-pointer overflow-hidden"
                    >
                      {!event.image_url && (
                        <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
                          {isRecurring && (
                            <div className="absolute top-2 right-2 z-10">
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-blue-600 rounded-full border border-blue-200">
                                <CalendarSync className="h-3.5 w-3.5" />
                                <span>Serientermine</span>
                              </div>
                            </div>
                          )}
                          <div className="absolute top-2 left-2 z-10">
                            {event.approval_mode === "automatic" ? (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-green-100 backdrop-blur-sm text-xs font-medium text-green-700 rounded-full border border-green-300">
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>Direkte Teilnahme</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-100 backdrop-blur-sm text-xs font-medium text-orange-700 rounded-full border border-orange-300">
                                <Clock className="h-3.5 w-3.5" />
                                <span>Genehmigung erforderlich</span>
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <Spade className="h-12 w-12 text-teal-400 mx-auto mb-1" />
                          </div>
                        </div>
                      )}

                      {event.image_url && (
                        <div className="relative h-32 w-full overflow-hidden">
                          <img
                            src={event.image_url || "/placeholder.svg"}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                          {isRecurring && (
                            <div className="absolute top-2 right-2 z-10">
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-blue-600 rounded-full border border-blue-200">
                                <CalendarSync className="h-3.5 w-3.5" />
                                <span>Serientermine</span>
                              </div>
                            </div>
                          )}
                          <div className="absolute top-2 left-2 z-10">
                            {event.approval_mode === "automatic" ? (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-green-100 backdrop-blur-sm text-xs font-medium text-green-700 rounded-full border border-green-300">
                                <UserPlus className="h-3.5 w-3.5" />
                                <span>Direkte Teilnahme</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-100 backdrop-blur-sm text-xs font-medium text-orange-700 rounded-full border border-orange-300">
                                <Clock className="h-3.5 w-3.5" />
                                <span>Genehmigung erforderlich</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="font-handwritten text-lg text-gray-800 mb-1 group-hover:text-teal-600 transition-colors line-clamp-2">
                              {event.title}
                            </CardTitle>
                            {event.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{event.description}</p>
                            )}
                          </div>
                          {event.distance !== undefined && <DistanceBadge distance={event.distance} className="ml-2" />}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 text-teal-600" />
                            <span>
                              {event.first_instance_date
                                ? formatEventDate(event.first_instance_date, event.start_time)
                                : "Keine Termine"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4 text-teal-600" />
                            <span>
                              {event.start_time.slice(0, 5)}
                              {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
                            </span>
                          </div>

                          {intervalDisplay && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <CalendarSync className="h-4 w-4 text-teal-600" />
                              <span>{intervalDisplay}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 text-teal-600" />
                            {event.location_type === "virtual" ? (
                              <span className="truncate">Online Event</span>
                            ) : event.location ? (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="truncate text-teal-600 hover:text-teal-700 hover:underline cursor-pointer transition-colors"
                              >
                                {event.location}
                              </a>
                            ) : (
                              <span className="truncate">Ort wird bekannt gegeben</span>
                            )}
                          </div>

                          {event.selected_games && event.selected_games.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Dices className="h-4 w-4 text-teal-600" />
                              <span className="truncate">
                                {(() => {
                                  const gameNames = event.selected_games
                                    .map((game: any, index: number) => {
                                      // Handle string games that might be JSON strings
                                      if (typeof game === "string") {
                                        // Try to parse as JSON first
                                        try {
                                          const parsedGame = JSON.parse(game)
                                          if (parsedGame && typeof parsedGame === "object") {
                                            return (
                                              parsedGame.title ||
                                              parsedGame.name ||
                                              parsedGame.game_name ||
                                              parsedGame.gameName ||
                                              "Unbekanntes Spiel"
                                            )
                                          }
                                        } catch (e) {
                                          // If parsing fails, treat as regular string
                                          return game
                                        }
                                        return game
                                      }

                                      // Handle object games - extract title with fallbacks
                                      if (typeof game === "object" && game !== null) {
                                        return (
                                          game.title ||
                                          game.name ||
                                          game.game_name ||
                                          game.gameName ||
                                          "Unbekanntes Spiel"
                                        )
                                      }

                                      // Fallback for any other type
                                      return "Unbekanntes Spiel"
                                    })
                                    .filter(Boolean) // Remove any empty/null values

                                  return gameNames.length > 0 ? gameNames.join(", ") : "Keine Spiele ausgewählt"
                                })()}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="h-4 w-4 text-teal-600" />
                            <span>{formatParticipantCount(event)}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <UserCog className="h-4 w-4 text-teal-600" />
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={event.creator.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs">
                                {event.creator.username?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div onClick={(e) => e.stopPropagation()}>
                              <UserLink
                                userId={event.creator.id}
                                className="text-gray-600 hover:text-teal-600 transition-colors"
                              >
                                <span className="text-sm hover:text-teal-600 cursor-pointer transition-colors">
                                  {event.creator.name || event.creator.username}
                                </span>
                              </UserLink>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4 mt-auto">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!user) {
                                toast.info("Bitte melde dich an, um an Events teilzunehmen")
                                window.location.href = "/login"
                                return
                              }
                              if (buttonProps.action === "manage") {
                                // Open date selection dialog to manage registrations
                                setDateSelectionEvent(event)
                                setIsDateSelectionOpen(true)
                              } else {
                                handleJoinEvent(event)
                              }
                            }}
                            disabled={buttonProps.disabled}
                            variant={buttonProps.variant}
                            className={`flex-1 font-handwritten ${
                              buttonProps.action === "manage"
                                ? "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-blue-500"
                                : "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white disabled:from-gray-400 disabled:to-gray-400"
                            }`}
                          >
                            {IconComponent ? (
                              <IconComponent className="h-4 w-4 mr-2" />
                            ) : (
                              <UserPlus className="h-4 w-4 mr-2" />
                            )}
                            {buttonProps.text}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="px-3 bg-transparent font-handwritten"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!user) {
                                toast.info("Bitte melde dich an, um Nachrichten zu senden")
                                window.location.href = "/login"
                                return
                              }
                              if (user && event.creator_id === user.id) {
                                openEventManagement(event)
                              } else {
                                openMessageComposer(event)
                              }
                            }}
                          >
                            {user && event.creator_id === user.id ? (
                              <Settings className="h-4 w-4" />
                            ) : (
                              <MessageCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>

          <div className="hidden lg:block w-40">
            <div className="sticky top-8">
              <SkyscraperAd />
            </div>
          </div>
        </div>

        {/* Event Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-handwritten text-2xl text-gray-800 flex items-center justify-between">
                {selectedEvent?.title}
                {user && selectedEvent && selectedEvent.creator_id === user.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEventManagement(selectedEvent, e)
                    }}
                    className="ml-2"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Verwalten
                  </Button>
                )}
              </DialogTitle>
              <DialogDescription>Event Details und Informationen</DialogDescription>
            </DialogHeader>

            {selectedEvent && (
              <div className="space-y-6">
                {!selectedEvent.image_url && (
                  <div className="w-full h-48 rounded-lg overflow-hidden bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
                    <div className="text-center">
                      <Spade className="h-16 w-16 text-teal-400 mx-auto mb-2" />
                    </div>
                  </div>
                )}
                {selectedEvent.image_url && (
                  <div className="w-full h-48 rounded-lg overflow-hidden">
                    <img
                      src={selectedEvent.image_url || "/placeholder.svg"}
                      alt={selectedEvent.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Organizer information frame */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 font-medium">Organisiert von</span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedEvent.creator.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-sm">
                        {selectedEvent.creator.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <UserLink
                      userId={selectedEvent.creator.id}
                      className="text-gray-800 hover:text-teal-600 transition-colors"
                    >
                      <span className="font-medium hover:text-teal-600 cursor-pointer transition-colors">
                        {selectedEvent.creator.name || selectedEvent.creator.username}
                      </span>
                    </UserLink>
                  </div>
                </div>

                {selectedEvent.frequency === "regular" ||
                selectedEvent.frequency === "recurring" ||
                selectedEvent.frequency === "täglich" ||
                selectedEvent.frequency === "wöchentlich" ||
                selectedEvent.frequency === "zweiwöchentlich" ||
                selectedEvent.frequency === "monatlich" ||
                selectedEvent.frequency === "andere" ? (
                  <div className="space-y-4">
                    <div className="flex border-b border-gray-200">
                      <button
                        onClick={() => setDetailViewTab("info")}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                          detailViewTab === "info"
                            ? "border-teal-500 text-teal-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Grundinformationen
                      </button>
                      <button
                        onClick={() => setDetailViewTab("schedule")}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                          detailViewTab === "schedule"
                            ? "border-teal-500 text-teal-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Terminübersicht
                      </button>
                    </div>

                    {detailViewTab === "info" && (
                      <div className="space-y-4">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-teal-600" />
                            <div>
                              <div className="font-medium text-gray-600">
                                {selectedEvent.first_instance_date
                                  ? formatEventDate(selectedEvent.first_instance_date, selectedEvent.start_time)
                                  : "Keine Termine"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-teal-600" />
                            <div>
                              <div className="text-gray-600">
                                {selectedEvent.start_time.slice(0, 5)}
                                {selectedEvent.end_time && ` - ${selectedEvent.end_time.slice(0, 5)}`}
                              </div>
                            </div>
                          </div>

                          {getIntervalDisplay(selectedEvent) && (
                            <div className="flex items-center gap-3">
                              <CalendarSync className="h-5 w-5 text-teal-600" />
                              <div>
                                <div className="text-gray-600">{getIntervalDisplay(selectedEvent)}</div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-teal-600" />
                            <div>
                              <div className="text-gray-600">
                                {selectedEvent.location_type === "virtual"
                                  ? "Online Event"
                                  : selectedEvent.location || "Ort wird bekannt gegeben"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-teal-600" />
                            <div>
                              <div className="text-gray-600">{formatParticipantCount(selectedEvent)}</div>
                            </div>
                          </div>

                          {selectedEvent.selected_games && selectedEvent.selected_games.length > 0 && (
                            <div className="flex items-start gap-3">
                              <Dices className="h-5 w-5 text-teal-600 mt-0.5" />
                              <div>
                                <ul className="text-gray-600 space-y-1">
                                  {selectedEvent.selected_games.map((game: any, index: number) => (
                                    <li key={index} className="flex items-center gap-2">
                                      {(() => {
                                        if (typeof game === "string") {
                                          // Try to parse as JSON first
                                          try {
                                            const parsedGame = JSON.parse(game)
                                            if (parsedGame && typeof parsedGame === "object") {
                                              return (
                                                parsedGame.title ||
                                                parsedGame.name ||
                                                parsedGame.game_name ||
                                                parsedGame.gameName ||
                                                "Unbekanntes Spiel"
                                              )
                                            }
                                          } catch (e) {
                                            // If parsing fails, treat as regular string
                                            return game
                                          }
                                          return game
                                        }
                                        if (typeof game === "object" && game !== null) {
                                          return (
                                            game.title ||
                                            game.name ||
                                            game.game_name ||
                                            game.gameName ||
                                            "Unbekanntes Spiel"
                                          )
                                        }
                                        return "Unbekanntes Spiel"
                                      })()}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>

                        {selectedEvent.description && (
                          <div>
                            <h4 className="text-gray-800 mb-2 font-semibold">Beschreibung</h4>
                            <p className="text-gray-600 leading-relaxed">{selectedEvent.description}</p>
                          </div>
                        )}
                        {selectedEvent.additional_notes && (
                          <div>
                            <h4 className="text-gray-800 mb-2 font-semibold">Zusatzinfos</h4>
                            <p className="text-gray-600 leading-relaxed">{selectedEvent.additional_notes}</p>
                          </div>
                        )}

                        <div className="bg-white border border-slate-200 rounded-2xl p-6">
                          {selectedEvent.location_type === "virtual" ? (
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-blue-800 text-sm">
                                Dies ist ein virtuelles Event (Online). Keine Karte verfügbar.
                              </p>
                            </div>
                          ) : !selectedEvent.location ? (
                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                              <p className="text-yellow-800 text-sm">
                                Kein Standort angegeben. Karte kann nicht angezeigt werden.
                              </p>
                            </div>
                          ) : (
                            <>
                              <LocationMap location={selectedEvent.location} className="h-64 w-full rounded-lg" />
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* DETAIL VIEW TAB SCHEDULE START */}
                    {detailViewTab === "schedule" && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800 mb-3">Alle geplanten Termine</h3>
                        <div className="space-y-3">
                          {console.log("[v0] Rendering schedule tab with additionalDates:", additionalDates)}
                          {console.log("[v0] Number of dates to display:", additionalDates.length)}
                          {additionalDates.length === 0 ? (
                            <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-600">
                              <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p>Keine Termine verfügbar</p>
                            </div>
                          ) : (
                            additionalDates.map((date, index) => (
                              <div
                                key={index}
                                className={`p-3 rounded-lg border-2 ${
                                  index === 0
                                    ? "bg-teal-50 border-teal-200"
                                    : index === additionalDates.length - 1
                                      ? "bg-orange-50 border-orange-200"
                                      : "bg-gray-50 border-gray-200"
                                }`}
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <Calendar className="h-5 w-5 text-gray-600" />
                                  <div className="font-medium text-gray-600">
                                    {formatEventDate(date.event_date, date.start_time)}
                                  </div>
                                  {index === 0 && (
                                    <span className="ml-auto px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">
                                      Startdatum
                                    </span>
                                  )}
                                  {index === additionalDates.length - 1 && index !== 0 && (
                                    <span className="ml-auto px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                                      Enddatum
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <Clock className="h-5 w-5 text-gray-600" />
                                  <div className="font-medium text-gray-600">
                                    {date.start_time.slice(0, 5)}
                                    {date.end_time && ` - ${date.end_time.slice(0, 5)}`}
                                  </div>
                                </div>
                                <div
                                  className={`flex items-center gap-3 mt-2 pt-2 border-t ${
                                    index === 0
                                      ? "border-teal-200"
                                      : index === additionalDates.length - 1
                                        ? "border-orange-200"
                                        : "border-gray-200"
                                  }`}
                                >
                                  <Users className="h-5 w-5 text-gray-600" />
                                  <div className="font-medium text-gray-600">
                                    {date.participant_count || 0} Teilnehmer
                                    {date.max_participants && (
                                      <span className="ml-1">
                                        (
                                        {date.max_participants - (date.participant_count || 0) > 0 ? (
                                          <span className="text-green-600 font-medium">
                                            {date.max_participants - (date.participant_count || 0)} Plätze frei
                                          </span>
                                        ) : (
                                          <span className="text-red-600 font-medium">Ausgebucht</span>
                                        )}
                                        )
                                      </span>
                                    )}
                                    {!date.max_participants && <span className="ml-1 text-gray-500">(unbegrenzt)</span>}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                    {/* DETAIL VIEW TAB SCHEDULE END */}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-teal-600" />
                        <div>
                          <div className="font-medium text-gray-800">
                            {selectedEvent.first_instance_date
                              ? formatEventDate(selectedEvent.first_instance_date, selectedEvent.start_time)
                              : "Keine Termine"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-teal-600" />
                        <div>
                          <div className="text-gray-600">
                            {selectedEvent.start_time.slice(0, 5)}
                            {selectedEvent.end_time && ` - ${selectedEvent.end_time.slice(0, 5)}`}
                          </div>
                        </div>
                      </div>

                      {getIntervalDisplay(selectedEvent) && (
                        <div className="flex items-center gap-3">
                          <CalendarSync className="h-5 w-5 text-teal-600" />
                          <div>
                            <div className="text-gray-600">{getIntervalDisplay(selectedEvent)}</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-teal-600" />
                        <div>
                          <div className="text-gray-600">
                            {selectedEvent.location_type === "virtual"
                              ? "Online Event"
                              : selectedEvent.location || "Ort wird bekannt gegeben"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-teal-600" />
                        <div>
                          <div className="text-gray-600">{formatParticipantCount(selectedEvent)}</div>
                        </div>
                      </div>

                      {selectedEvent.selected_games && selectedEvent.selected_games.length > 0 && (
                        <div className="flex items-start gap-3">
                          <Dices className="h-5 w-5 text-teal-600 mt-0.5" />
                          <div>
                            <ul className="text-gray-600 space-y-1">
                              {selectedEvent.selected_games.map((game: any, index: number) => (
                                <li key={index} className="flex items-center gap-2">
                                  {(() => {
                                    if (typeof game === "string") {
                                      // Try to parse as JSON first
                                      try {
                                        const parsedGame = JSON.parse(game)
                                        if (parsedGame && typeof parsedGame === "object") {
                                          return (
                                            parsedGame.title ||
                                            parsedGame.name ||
                                            parsedGame.game_name ||
                                            parsedGame.gameName ||
                                            "Unbekanntes Spiel"
                                          )
                                        }
                                      } catch (e) {
                                        // If parsing fails, treat as regular string
                                        return game
                                      }
                                      return game
                                    }
                                    if (typeof game === "object" && game !== null) {
                                      return (
                                        game.title ||
                                        game.name ||
                                        game.game_name ||
                                        game.gameName ||
                                        "Unbekanntes Spiel"
                                      )
                                    }
                                    return "Unbekanntes Spiel"
                                  })()}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <UserCog className="h-5 w-5 text-teal-600" />
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={selectedEvent.creator.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">
                              {selectedEvent.creator.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <UserLink
                            userId={selectedEvent.creator.id}
                            className="text-gray-600 hover:text-teal-600 transition-colors"
                          >
                            <span className="hover:text-teal-600 cursor-pointer transition-colors">
                              {selectedEvent.creator.name || selectedEvent.creator.username}
                            </span>
                          </UserLink>
                        </div>
                      </div>
                    </div>

                    {selectedEvent.description && (
                      <div>
                        <h4 className="text-gray-800 mb-2 font-semibold">Beschreibung</h4>
                        <p className="text-gray-600 leading-relaxed">{selectedEvent.description}</p>
                      </div>
                    )}

                    {selectedEvent.additional_notes && (
                      <div>
                        <h4 className="text-gray-800 mb-2 font-semibold">Zusatzinfos</h4>
                        <p className="text-gray-600 leading-relaxed">{selectedEvent.additional_notes}</p>
                      </div>
                    )}

                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                      {selectedEvent.location_type === "virtual" ? (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-blue-800 text-sm">
                            Dies ist ein virtuelles Event (Online). Keine Karte verfügbar.
                          </p>
                        </div>
                      ) : !selectedEvent.location ? (
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-yellow-800 text-sm">
                            Kein Standort angegeben. Karte kann nicht angezeigt werden.
                          </p>
                        </div>
                      ) : (
                        <>
                          <LocationMap location={selectedEvent.location} className="h-64 w-full rounded-lg" />
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Join button */}
                <div className="flex gap-3 pt-4 border-t">
                  {(() => {
                    const buttonProps = getJoinButtonProps(selectedEvent)
                    const IconComponent = buttonProps.icon

                    return (
                      <Button
                        onClick={() => {
                          if (!user) {
                            toast.info("Bitte melde dich an, um an Events teilzunehmen")
                            window.location.href = "/login"
                            return
                          }
                          if (buttonProps.action === "manage") {
                            // Open date selection dialog to manage registrations
                            setDateSelectionEvent(selectedEvent)
                            setIsDateSelectionOpen(true)
                          } else {
                            handleJoinEvent(selectedEvent)
                          }
                        }}
                        disabled={buttonProps.disabled}
                        variant={buttonProps.variant}
                        className={`flex-1 font-handwritten ${
                          buttonProps.action === "manage"
                            ? "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-blue-500"
                            : "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white disabled:from-gray-400 disabled:to-gray-400"
                        }`}
                      >
                        {IconComponent ? (
                          <IconComponent className="h-4 w-4 mr-2" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-2" />
                        )}
                        {buttonProps.text}
                      </Button>
                    )
                  })()}

                  <ShareButton
                    url={`${typeof window !== "undefined" ? window.location.origin : ""}/ludo-events/${selectedEvent.id}`}
                    title={selectedEvent.title}
                    description={selectedEvent.description || "Schau dir dieses Event an!"}
                    variant="outline"
                    className="px-4 bg-transparent font-handwritten"
                  />

                  <Button
                    variant="outline"
                    className="px-4 bg-transparent font-handwritten"
                    onClick={(e) => {
                      if (!user) {
                        toast.info("Bitte melde dich an, um Nachrichten zu senden")
                        window.location.href = "/login"
                        return
                      }
                      if (user && selectedEvent.creator_id === user.id) {
                        openEventManagement(selectedEvent)
                      } else {
                        openMessageComposer(selectedEvent)
                      }
                    }}
                  >
                    {user && selectedEvent.creator_id === user.id ? (
                      <Settings className="h-4 w-4" />
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Nachricht
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-handwritten text-xl text-gray-800">Event beitreten</DialogTitle>
              <DialogDescription>Dieses Event erfordert eine Genehmigung des Organisators.</DialogDescription>
            </DialogHeader>

            {joinEvent && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="join-message" className="text-sm font-medium text-gray-700">
                    Nachricht an den Organisator (optional)
                  </Label>
                  <textarea
                    id="join-message"
                    value={joinMessage}
                    onChange={(e) => setJoinMessage(e.target.value)}
                    placeholder="Warum möchtest du an diesem Event teilnehmen?"
                    className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsJoinDialogOpen(false)}
                    className="flex-1 font-handwritten"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={() => processJoinEvent(joinEvent, joinMessage)}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-handwritten"
                  >
                    Anfrage senden
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {dateSelectionEvent && (
          <DateSelectionDialog
            isOpen={isDateSelectionOpen}
            onClose={() => {
              setIsDateSelectionOpen(false)
              setDateSelectionEvent(null)
            }}
            event={{
              id: dateSelectionEvent.id,
              title: dateSelectionEvent.title,
              location: dateSelectionEvent.location,
              max_participants: dateSelectionEvent.max_participants || 0,
              event_date: dateSelectionEvent.first_instance_date || "",
              start_time: dateSelectionEvent.start_time,
              end_time: dateSelectionEvent.end_time,
            }}
            user={user}
            onSuccess={() => {
              loadEvents()
            }}
          />
        )}

        {messageRecipient && messageContext && (
          <MessageComposerModal
            isOpen={isMessageComposerOpen}
            onClose={() => {
              setIsMessageComposerOpen(false)
              setMessageRecipient(null)
              setMessageContext(null)
            }}
            recipientId={messageRecipient.id}
            recipientName={messageRecipient.name}
            recipientAvatar={messageRecipient.avatar || undefined}
            context={messageContext}
          />
        )}

        {managementEvent && (
          <LudoEventManagementDialog
            isOpen={isManagementDialogOpen}
            onClose={() => {
              setIsManagementDialogOpen(false)
              setManagementEvent(null)
              loadEvents() // Refresh events after management changes
            }}
            event={managementEvent}
          />
        )}

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-handwritten text-2xl text-gray-800">Neues Event erstellen</DialogTitle>
              <DialogDescription>Erstelle ein neues Spielevent und lade andere Spieler ein</DialogDescription>
            </DialogHeader>

            <CreateLudoEventForm
              onSuccess={() => {
                setIsCreateDialogOpen(false)
                loadEvents()
                toast.success("Event erfolgreich erstellt!")
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
