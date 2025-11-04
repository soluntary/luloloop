"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Plus,
  MapPin,
  CalendarDaysIcon,
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
  CalendarPlus2Icon,
  ChevronDown,
  UserRoundCheck,
  UserRoundCog,
  UserX,
  UserRoundMinus,
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
import { ExpandableDescription } from "@/components/expandable-description"

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
  frequency:
    | "single"
    | "regular"
    | "recurring"
    | "täglich"
    | "wöchentlich"
    | "zweiwöchentlich"
    | "monatlich"
    | "jährlich"
    | "andere"
    | "einmalig"
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
  const [sortBy, setSortBy] = useState("date")
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

  const getNextUpcomingDate = (event: any, dates?: Array<{ event_date: string; start_time?: string }>) => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    if (dates && dates.length > 0) {
      const upcomingDate = dates.find((d) => {
        const dateObj = new Date(d.event_date)
        dateObj.setHours(0, 0, 0, 0)
        return dateObj >= now
      })

      if (upcomingDate) {
        return { event_date: upcomingDate.event_date, start_time: upcomingDate.start_time }
      }
      // If no upcoming dates found, return null (all dates are in the past)
      return null
    }

    if (event.first_instance_date) {
      return {
        event_date: event.first_instance_date,
        start_time: event.start_time,
      }
    }

    return null
  }

  const isNextUpcomingDate = (dateStr: string) => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const eventDate = new Date(dateStr)
    eventDate.setHours(0, 0, 0, 0)

    // Check if this is the first date that is today or in the future
    const upcomingDate = additionalDates.find((date) => {
      const d = new Date(date.event_date)
      d.setHours(0, 0, 0, 0)
      return d >= now
    })

    return upcomingDate && upcomingDate.event_date === dateStr
  }

  useEffect(() => {
    loadEvents()

    const channel = supabase
      .channel("ludo-event-participants-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ludo_event_participants",
        },
        (payload) => {
          loadEvents()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ludo_event_instance_participants",
        },
        (payload) => {
          loadEvents()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      console.log("[v0] Loading events for user:", user?.id || "not logged in")

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      console.log("[v0] Today's date for filtering:", today.toISOString().split("T")[0])

      // Build the base query
      let query = supabase
        .from("ludo_events")
        .select(`
          *,
          creator:users!creator_id(id, username, name, avatar),
          ludo_event_instances!inner(instance_date)
        `)
        .eq("visibility", "public")
        .gte("ludo_event_instances.instance_date", today.toISOString().split("T")[0])
        .order("created_at", { ascending: false })

      // Only exclude user's own events if user is logged in
      if (user?.id) {
        query = query.neq("creator_id", user.id)
        console.log("[v0] Excluding events created by user:", user.id)
      }

      const { data, error } = await query

      console.log("[v0] Events query returned:", data?.length || 0, "events")
      if (error) {
        console.log("[v0] Events query error:", error)
      }

      if (error) {
        toast.error("Fehler beim Laden der Events")
        setLoading(false)
        return
      }

      const processedEvents = data || []

      processedEvents.forEach((event, index) => {
        console.log(`[v0] Event ${index + 1}:`, {
          id: event.id,
          title: event.title,
          creator_id: event.creator_id,
          first_instance_date: event.first_instance_date,
        })
      })

      // If user is logged in, fetch their participation status and counts
      if (user) {
        const eventsWithStatus = await Promise.all(
          processedEvents.map(async (event) => {
            // Fetch the first upcoming instance date for this event
            const { data: instances } = await supabase
              .from("ludo_event_instances")
              .select("instance_date")
              .eq("event_id", event.id)
              .gte("instance_date", today.toISOString().split("T")[0])
              .order("instance_date", { ascending: true })
              .limit(1)

            console.log(`[v0] Event "${event.title}" (${event.id}):`)
            console.log(`[v0]   - Filtering instances >= ${today.toISOString().split("T")[0]}`)
            console.log(`[v0]   - Found instances:`, instances)
            console.log(`[v0]   - Setting first_instance_date to:`, instances?.[0]?.instance_date || null)

            // Check event-level participation
            const { data: eventParticipation } = await supabase
              .from("ludo_event_participants")
              .select("id, status")
              .eq("event_id", event.id)
              .eq("user_id", user.id)
              .maybeSingle()

            // Check instance-level participation for recurring events
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

            // Count approved participants for the event
            const { count: participantCount } = await supabase
              .from("ludo_event_participants")
              .select("*", { count: "exact", head: true })
              .eq("event_id", event.id)
              .eq("status", "approved")

            // Check if there are more than one instance for this event
            const { data: instancesData } = await supabase
              .from("ludo_event_instances")
              .select("id")
              .eq("event_id", event.id)

            // Determine user participation status
            let userStatus = null
            if (eventParticipation) {
              userStatus =
                eventParticipation.status === "approved"
                  ? "approved"
                  : eventParticipation.status === "pending"
                    ? "pending"
                    : "rejected"
            }

            if (instanceRegistrations && instanceRegistrations.length > 0) {
              const hasApprovedInstance = instanceRegistrations.some((r) => r.status === "approved")
              const hasPendingInstance = instanceRegistrations.some((r) => r.status === "pending")
              const hasRejectedInstance = instanceRegistrations.some((r) => r.status === "rejected")

              if (hasApprovedInstance) {
                userStatus = "approved"
              } else if (hasPendingInstance && userStatus !== "approved") {
                userStatus = "pending"
              } else if (hasRejectedInstance && userStatus !== "approved" && userStatus !== "pending") {
                userStatus = "rejected"
              }
            }

            return {
              ...event,
              first_instance_date: instances?.[0]?.instance_date || null,
              user_participation_status: userStatus,
              participant_count: participantCount || 0,
              has_additional_dates: (instancesData?.length || 0) > 1,
            }
          }),
        )
        setEvents(eventsWithStatus)
      } else {
        // If user is not logged in, just fetch counts and check for additional dates
        const eventsWithCounts = await Promise.all(
          processedEvents.map(async (event) => {
            const { count: participantCount } = await supabase
              .from("ludo_event_participants")
              .select("*", { count: "exact", head: true })
              .eq("event_id", event.id)
              .eq("status", "approved")

            const { data: instancesData } = await supabase
              .from("ludo_event_instances")
              .select("id")
              .eq("event_id", event.id)

            // Fetch first instance date
            const { data: firstInstance } = await supabase
              .from("ludo_event_instances")
              .select("instance_date")
              .eq("event_id", event.id)
              .gte("instance_date", today.toISOString().split("T")[0])
              .order("instance_date", { ascending: true })
              .limit(1)
              .single()

            console.log(`[v0] Event "${event.title}" (${event.id}) [non-logged-in]:`)
            console.log(`[v0]   - Filtering instances >= ${today.toISOString().split("T")[0]}`)
            console.log(`[v0]   - Found instance:`, firstInstance)
            console.log(`[v0]   - Setting first_instance_date to:`, firstInstance?.instance_date || null)

            return {
              ...event,
              first_instance_date: firstInstance?.instance_date || null,
              user_participation_status: null,
              participant_count: participantCount || 0,
              has_additional_dates: (instancesData?.length || 0) > 1,
            }
          }),
        )
        setEvents(eventsWithCounts)
      }
    } catch (error) {
      console.error("Error in loadEvents:", error)
      toast.error("Ein unerwarteter Fehler ist aufgetreten.")
    } finally {
      setLoading(false)
    }
  }

  const loadAdditionalDates = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from("ludo_event_instances")
        .select("*")
        .eq("event_id", eventId)
        .order("instance_date", { ascending: true })

      if (error) throw error

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

      setAdditionalDates(instancesWithCounts)
    } catch (error) {
      console.error("Error loading additional dates:", error)
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
      event.frequency === "jährlich" || // Added jährlich to recurring check
      event.frequency === "andere"

    if (isRecurring && event.has_additional_dates) {
      // If the event has multiple dates, open the date selection dialog
      setDateSelectionEvent(event)
      setIsDateSelectionOpen(true)
      return
    }

    // For single-date events or recurring events without explicit additional dates listed
    if (event.approval_mode === "manual") {
      setJoinEvent(event)
      setJoinMessage("")
      setIsJoinDialogOpen(true)
      return
    }

    await processJoinEvent(event, "")
  }

  const processJoinEvent = async (event: LudoEvent, message = "", selectedEventDates: string[] = []) => {
    if (!user) {
      return
    }

    const loadingToast = toast.loading("Anmeldung wird verarbeitet...")

    try {
      // Check if the user is already participating in the event at the event level
      const { data: existingParticipant } = await supabase
        .from("ludo_event_participants")
        .select("id, status")
        .eq("event_id", event.id)
        .eq("user_id", user.id)
        .maybeSingle()

      if (existingParticipant) {
        toast.dismiss(loadingToast)
        if (existingParticipant.status === "approved") {
          toast.info("Du bist bereits für dieses Event angemeldet")
        } else if (existingParticipant.status === "pending") {
          toast.info("Deine Anmeldung wartet noch auf Genehmigung")
        } else if (existingParticipant.status === "rejected") {
          toast.error("Deine Anmeldung für dieses Event wurde abgelehnt")
        }
        return
      }

      // Check for capacity on single-date events
      if (event.frequency === "single" && event.max_participants && event.participant_count >= event.max_participants) {
        toast.dismiss(loadingToast)
        toast.error("Das Event ist bereits ausgebucht")
        return
      }

      if (event.approval_mode === "manual") {
        // Check if a join request already exists
        const { data: existingRequest } = await supabase
          .from("ludo_event_join_requests")
          .select("id")
          .eq("event_id", event.id)
          .eq("user_id", user.id)
          .maybeSingle()

        if (existingRequest) {
          toast.dismiss(loadingToast)
          toast.info("Du hast bereits eine Anfrage für dieses Event gestellt")
          return
        }

        // Insert a new join request
        const { error } = await supabase.from("ludo_event_join_requests").insert({
          event_id: event.id,
          user_id: user.id,
          status: "pending",
          message: message || null,
          created_at: new Date().toISOString(),
        })

        if (error) {
          console.error("[v0] Error creating join request:", {
            error,
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          })
          toast.dismiss(loadingToast)
          toast.error(`Fehler beim Erstellen der Anfrage: ${error.message}`)
          return
        }

        toast.dismiss(loadingToast)
        toast.success("Anmeldung eingereicht! Warte auf Bestätigung des Organisators.")

        // Notify the organizer
        const { data: userData } = await supabase.from("users").select("username, name").eq("id", user.id).single()
        const userName = userData?.name || userData?.username || "Ein Teilnehmer"

        await supabase.from("notifications").insert({
          user_id: event.creator_id,
          type: "event_join_request",
          title: "Neue Teilnahmeanfrage",
          message: `${userName} möchte an deinem Event "${event.title}" teilnehmen`,
          data: {
            event_id: event.id,
            event_title: event.title,
            event_date: event.event_date, // Note: event_date might not be available here, consider using first_instance_date
            event_time: event.start_time,
            requester_id: user.id,
            requester_name: userName,
          },
          read: false,
          created_at: new Date().toISOString(),
        })
      } else {
        // Direct approval for manual approval events or automatic approval for single events
        if (selectedEventDates.length > 0) {
          // If specific dates are selected for a recurring event
          const participantEntries = selectedEventDates.map((date) => ({
            event_id: event.id,
            user_id: user.id,
            status: "approved", // Mark as approved for the selected instances
            joined_at: new Date().toISOString(),
          }))

          const { error } = await supabase.from("ludo_event_participants").insert(participantEntries)

          if (error) {
            console.error("[v0] Error creating participant entries:", {
              error,
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint,
              participantEntries,
            })
            toast.dismiss(loadingToast)
            toast.error(`Fehler beim Anmelden: ${error.message}`)
            return
          }

          toast.dismiss(loadingToast)
          toast.success(`Erfolgreich für ${selectedEventDates.length} Termin(e) angemeldet!`)
        } else {
          // For single-date events or recurring events where all dates are implicitly joined
          const participantData = {
            event_id: event.id,
            user_id: user.id,
            status: "approved",
            joined_at: new Date().toISOString(),
          }

          const { error } = await supabase.from("ludo_event_participants").insert(participantData)

          if (error) {
            console.error("[v0] Error creating participant entry:", {
              error,
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint,
              participantData,
            })
            toast.dismiss(loadingToast)
            toast.error(`Fehler beim Anmelden: ${error.message}`)
            return
          }

          toast.dismiss(loadingToast)
          toast.success("Erfolgreich für das Event angemeldet!")
        }

        // Notify the organizer about the new participant
        const { data: userData } = await supabase.from("users").select("username, name").eq("id", user.id).single()
        const userName = userData?.name || userData?.username || "Ein Teilnehmer"

        await supabase.from("notifications").insert({
          user_id: event.creator_id,
          type: "event_participant_joined",
          title: "Neuer Teilnehmer",
          message: `${userName} hat sich für dein Event "${event.title}" angemeldet`,
          data: {
            event_id: event.id,
            event_title: event.title,
            event_date: event.event_date, // Note: event_date might not be available here
            event_time: event.start_time,
            participant_id: user.id,
            participant_name: userName,
          },
          read: false,
          created_at: new Date().toISOString(),
        })
      }

      // Refresh data and close dialogs
      setIsJoinDialogOpen(false)
      setIsDateSelectionOpen(false)
      await loadEvents()

      // If details dialog is open, refresh the selected event data
      if (selectedEvent && isDetailsDialogOpen) {
        const updatedEvent = await supabase
          .from("ludo_events")
          .select(`
            *,
            creator:users!creator_id(id, username, name, avatar)
          `)
          .eq("id", selectedEvent.id)
          .single()

        if (updatedEvent.data) {
          setSelectedEvent(updatedEvent.data as LudoEvent)
        }
      }
    } catch (error) {
      console.error("Unexpected error joining event:", {
        error,
        errorType: typeof error,
        errorString: String(error),
      })
      toast.dismiss(loadingToast)
      toast.error("Fehler beim Anmelden für das Event")
    }
  }

  const leaveEvent = async (event: LudoEvent) => {
    if (!user) return

    try {
      // Delete participation record from ludo_event_participants
      const { error } = await supabase
        .from("ludo_event_participants")
        .delete()
        .eq("event_id", event.id)
        .eq("user_id", user.id)

      if (error) throw error

      toast.success("Erfolgreich vom Event abgemeldet")
      await loadEvents() // Refresh event list

      // If the details dialog is open for this event, refresh its data
      if (selectedEvent && isDetailsDialogOpen) {
        await loadAdditionalDates(selectedEvent.id) // Potentially needed if participant counts change
      }
    } catch (error) {
      console.error("Error leaving event:", error)
      toast.error("Fehler beim Abmelden vom Event")
    }
  }

  const getJoinButtonProps = (event: LudoEvent) => {
    if (!user) {
      return { text: "Teilnehmen", disabled: false, variant: "default" as const }
    }

    // If the current user is the organizer
    if (event.creator_id === user.id) {
      return { text: "Dein Event", disabled: true, variant: "secondary" as const, icon: UserRoundCog }
    }

    // If the user is already participating
    if (event.user_participation_status === "approved") {
      const isOneTimeEvent = event.frequency === "single" || event.frequency === "einmalig"

      if (isOneTimeEvent) {
        // For single events, provide an "Abmelden" button
        return {
          text: "Abmelden",
          disabled: false,
          variant: "destructive" as const,
          action: "leave",
          icon: UserRoundMinus,
        }
      }

      // For recurring events, show "Angemeldet" and allow management
      return {
        text: "Angemeldet",
        disabled: false,
        variant: "outline" as const,
        action: "manage",
        icon: UserRoundCheck,
      }
    }

    // If the user's participation is pending
    if (event.user_participation_status === "pending") {
      return { text: "Warte auf Genehmigung", disabled: true, variant: "outline" as const, icon: Clock }
    }

    // If the user's participation was rejected
    if (event.user_participation_status === "rejected") {
      return { text: "Abgelehnt", disabled: false, variant: "outline" as const, icon: UserX }
    }

    // If the event is full
    if (event.max_participants && event.participant_count >= event.max_participants) {
      return { text: "Ausgebucht", disabled: true, variant: "secondary" as const }
    }

    // Default: "Teilnehmen" button
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
      event.frequency === "jährlich" || // Added yıllık to recurring check
      event.frequency === "andere"

    // If it's a recurring event, load its additional dates
    if (isRecurring && event.has_additional_dates) {
      loadAdditionalDates(event.id)
    }
  }

  const openEventManagement = (event: LudoEvent, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation() // Prevent triggering showEventDetails
    }
    setManagementEvent(event)
    setIsManagementDialogOpen(true)
  }

  const openApprovalManagement = (event: LudoEvent, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation() // Prevent triggering showEventDetails
    }
    setApprovalEvent(event)
    setIsApprovalDialogOpen(true)
  }

  const openMessageComposer = (event: LudoEvent, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation() // Prevent triggering showEventDetails
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
        searchResults = [results] // Handle case where result is a single object
      } else {
        searchResults = [] // Ensure it's always an array
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
        const results = await searchEventsNearby(latitude, longitude, 50) // 50km radius
        setLocationSearchResults(results || [])
        setShowLocationResults(true)
        toast.success(`${results?.length || 0} Events in deiner Nähe gefunden`)
      },
      (error) => {
        console.error("[v0] Geolocation error:", error)
        toast.error("Standort konnte nicht ermittelt werden")
      },
    )
  }

  const getFilteredEvents = () => {
    // Use locationSearchResults if active, otherwise use the main events list
    const sourceEvents = showLocationResults ? locationSearchResults : events

    let filtered = sourceEvents.filter((event) => {
      // Search term filtering
      const searchMatch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.creator.username?.toLowerCase().includes(searchTerm.toLowerCase())

      if (!searchMatch) return false

      // Location type filter
      if (locationFilter !== "all") {
        if (locationFilter === "local" && event.location_type !== "local") return false
        if (locationFilter === "virtual" && event.location_type !== "virtual") return false
      }

      // Frequency filter
      if (frequencyFilter !== "all") {
        const eventFrequency = event.frequency

        if (frequencyFilter === "einmalig" && eventFrequency !== "einmalig" && eventFrequency !== "single") return false
        if (frequencyFilter === "täglich" && eventFrequency !== "täglich") return false
        if (frequencyFilter === "wöchentlich" && eventFrequency !== "wöchentlich" && eventFrequency !== "weekly")
          return false
        if (frequencyFilter === "monatlich" && eventFrequency !== "monatlich" && eventFrequency !== "monthly")
          return false
        if (frequencyFilter === "jährlich" && eventFrequency !== "jährlich") return false // CHANGE: Added condition for 'jährlich'
        if (frequencyFilter === "andere" && eventFrequency !== "andere" && eventFrequency !== "custom") return false
      }

      // Approval mode filter
      if (approvalModeFilter !== "all") {
        if (approvalModeFilter === "automatic" && event.approval_mode !== "automatic") return false
        if (approvalModeFilter === "manual" && event.approval_mode !== "manual") return false
      }

      // Time period filter
      if (timePeriodFilter !== "all") {
        // Ensure the event has a date to filter by
        if (!event.first_instance_date) return false

        const eventDate = new Date(event.first_instance_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1)

        const thisWeekEnd = new Date(today)
        thisWeekEnd.setDate(today.getDate() + (7 - today.getDay())) // Sunday of the current week
        // Ensure thisWeekEnd is not in the past if today is Sunday
        if (thisWeekEnd < today) {
          thisWeekEnd.setDate(thisWeekEnd.getDate() + 7)
        }

        const nextWeekStart = new Date(thisWeekEnd)
        nextWeekStart.setDate(thisWeekEnd.getDate() + 1) // Monday of next week
        const nextWeekEnd = new Date(nextWeekStart)
        nextWeekEnd.setDate(nextWeekStart.getDate() + 6) // Sunday of next week

        const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0) // Last day of current month
        const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1) // First day of next month
        const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0) // Last day of next month

        const weekendStart = new Date(today)
        weekendStart.setDate(today.getDate() + (6 - today.getDay())) // Saturday of the current week
        const weekendEnd = new Date(weekendStart)
        weekendEnd.setDate(weekendStart.getDate() + 1) // Sunday of the current week

        if (timePeriodFilter === "heute") {
          if (eventDate.toDateString() !== today.toDateString()) return false
        } else if (timePeriodFilter === "morgen") {
          if (eventDate.toDateString() !== tomorrow.toDateString()) return false
        } else if (timePeriodFilter === "wochenende") {
          // Ensure we are checking against the actual weekend dates for the current or next week if today is Friday/Saturday
          const currentDayOfWeek = today.getDay() // 0 for Sunday, 6 for Saturday
          const targetWeekendStart = new Date(today)
          const targetWeekendEnd = new Date(today)

          if (currentDayOfWeek === 6) {
            // Saturday
            targetWeekendStart.setDate(today.getDate())
            targetWeekendEnd.setDate(today.getDate() + 1)
          } else if (currentDayOfWeek === 0) {
            // Sunday
            targetWeekendStart.setDate(today.getDate() - 1)
            targetWeekendEnd.setDate(today.getDate())
          } else {
            // Friday or earlier in the week
            targetWeekendStart.setDate(today.getDate() + (6 - currentDayOfWeek)) // Saturday
            targetWeekendEnd.setDate(today.getDate() + (7 - currentDayOfWeek)) // Sunday
          }
          // Check if the event date falls within the calculated weekend range
          if (eventDate < targetWeekendStart || eventDate > targetWeekendEnd) {
            return false
          }
        } else if (timePeriodFilter === "diese-woche") {
          // Event date must be today or later, and on or before Sunday of this week
          const todayDayOfWeek = today.getDay() // 0 = Sunday, 6 = Saturday
          const daysUntilSunday = 6 - todayDayOfWeek
          const endOfWeek = new Date(today)
          endOfWeek.setDate(today.getDate() + daysUntilSunday)
          endOfWeek.setHours(23, 59, 59, 999) // End of the day

          if (eventDate < today || eventDate > endOfWeek) return false
        } else if (timePeriodFilter === "naechste-woche") {
          const todayDayOfWeek = today.getDay()
          const startOfNextWeek = new Date(today)
          startOfNextWeek.setDate(today.getDate() + (7 - todayDayOfWeek)) // Monday of next week
          const endOfNextWeek = new Date(startOfNextWeek)
          endOfNextWeek.setDate(startOfNextWeek.getDate() + 6) // Sunday of next week

          if (eventDate < startOfNextWeek || eventDate > endOfNextWeek) return false
        } else if (timePeriodFilter === "dieser-monat") {
          if (eventDate < today || eventDate > thisMonthEnd) return false
        } else if (timePeriodFilter === "naechster-monat") {
          if (eventDate < nextMonthStart || eventDate > nextMonthEnd) return false
        }
      }

      // Availability filter
      if (availabilityFilter !== "all") {
        const hasSpots = !event.max_participants || event.participant_count < event.max_participants
        if (availabilityFilter === "available" && !hasSpots) return false // Show only events with spots available
        if (availabilityFilter === "full" && hasSpots) return false // Show only events that are full
      }

      return true // Event passes all filters
    })

    // Sorting
    if (sortBy !== "all") {
      filtered = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          case "date":
            // Ensure we are comparing valid dates
            const dateA = a.first_instance_date ? new Date(a.first_instance_date) : new Date(0)
            const dateB = b.first_instance_date ? new Date(b.first_instance_date) : new Date(0)
            return dateA.getTime() - dateB.getTime()
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
    today.setHours(0, 0, 0, 0)
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
    const frequency = event.frequency
    const intervalType = event.interval_type

    if (frequency === "single" || frequency === "einmalig") {
      return "Einmalig"
    }

    // Direct mapping for common frequencies
    if (frequency === "täglich") return "Täglich"
    if (frequency === "wöchentlich") return "Wöchentlich"
    if (frequency === "zweiwöchentlich") return "Zweiwöchentlich"
    if (frequency === "monatlich") return "Monatlich"
    if (frequency === "jährlich") return "Jährlich" // CHANGE: Added annually to the frequency display
    if (frequency === "andere") return "Andere"

    // Handle regular/recurring events with interval_type
    if ((frequency === "regular" || frequency === "recurring") && event.interval_type) {
      const intervalMap: { [key: string]: string } = {
        weekly: "Wöchentlich",
        biweekly: "Zweiwöchentlich",
        monthly: "Monatlich",
        custom: event.custom_interval || "Benutzerdefiniert",
      }

      // Fallback to interval_type if not found in map, or use custom_interval if provided
      const result = intervalMap[event.interval_type] || event.interval_type
      return result
    }

    // If frequency is 'regular' or 'recurring' but interval_type is missing, maybe return null or a default
    return null
  }

  const formatParticipantCount = (event: LudoEvent) => {
    if (event.max_participants === null) {
      // Unrestricted participants
      return (
        <>
          {event.participant_count} Teilnehmer <span className="text-gray-500">(unbegrenzt)</span>
        </>
      )
    }

    const freeSpots = event.max_participants - event.participant_count
    if (freeSpots > 0) {
      // Spots available
      return (
        <>
          {event.participant_count} Teilnehmer (
          <span className="text-green-600 font-medium">{freeSpots} Plätze frei</span>)
        </>
      )
    } else {
      // No spots available
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
      jährlich: "Jährlich", // Added yıllık to frequency map
      andere: "Andere",
      einmalig: "Einmalig",
    }
    return frequencyMap[frequency] || frequency // Return mapped value or original if not found
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-teal-50">
      <Navigation currentPage="ludo-events" />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-handwritten text-4xl md:text-5xl text-gray-800 mb-4">Spielevents</h1>
          {user && (
            <Button
              onClick={() => {
                setIsCreateDialogOpen(true)
              }}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 font-handwritten"
            >
              <Plus className="h-4 w-4 mr-2" />
              Event erstellen
            </Button>
          )}
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg">
          <div className="space-y-6">
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
                      <SelectItem value="jährlich">Jährlich</SelectItem> {/* Added jährlich option */}
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
                      <SelectItem value="dieser-monat">Dieser Monat</SelectItem>
                      <SelectItem value="naechster-monat">Nächster Monat</SelectItem>
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
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Teilnahmemodus</Label>
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

        <div className="flex gap-8">
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                // Skeleton loader for events
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
                // Message for no events found
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
                // Render list of filtered events
                filteredEvents.map((event) => {
                  const buttonProps = getJoinButtonProps(event)
                  const IconComponent = buttonProps.icon
                  const intervalDisplay = getIntervalDisplay(event)

                  // Check if event is recurring for display purposes
                  const isRecurring =
                    event.frequency === "regular" ||
                    event.frequency === "recurring" ||
                    event.frequency === "täglich" ||
                    event.frequency === "wöchentlich" ||
                    event.frequency === "zweiwöchentlich" ||
                    event.frequency === "monatlich" ||
                    event.frequency === "jährlich" || // Added yıllık to recurring check
                    event.frequency === "andere"

                  return (
                    <Card
                      key={event.id}
                      onClick={() => showEventDetails(event)}
                      className="group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 cursor-pointer overflow-hidden"
                    >
                      {/* Event Image or Placeholder */}
                      {!event.image_url && (
                        <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
                          {isRecurring && (
                            <div className="absolute top-2 right-2 z-10">
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-blue-600 rounded-full border border-blue-200">
                                <CalendarPlus2Icon className="h-3.5 w-3.5" />
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
                                <CalendarPlus2Icon className="h-3.5 w-3.5" />
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
                            <h3 className="text-lg font-handwritten font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">
                              {event.title}
                            </h3>
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
                            <CalendarDaysIcon className="h-4 w-4 text-teal-600" />
                            <span>
                              {event.first_instance_date
                                ? formatEventDate(event.first_instance_date, event.start_time)
                                : "Keine bevorstehenden Termine"}
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
                              <CalendarPlus2Icon className="h-4 w-4 text-teal-600" />
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
                                onClick={(e) => e.stopPropagation()} // Prevent card click
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
                                      if (typeof game === "string") {
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
                                          return game // Return the string if parsing fails
                                        }
                                        return game // Return the string if not an object after parsing
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
                                      return "Unbekanntes Spiel" // Default for unexpected types
                                    })
                                    .filter(Boolean) // Remove any null/undefined values

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
                              {" "}
                              {/* Prevent card click */}
                              <UserLink
                                userId={event.creator.id}
                                className="text-gray-600 hover:text-teal-600 transition-colors"
                              >
                                <span className="text-sm hover:text-teal-600 cursor-pointer transition-colors">
                                  {event.creator.username}
                                </span>
                              </UserLink>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4 mt-auto">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation() // Prevent card click
                              if (!user) {
                                toast.info("Bitte melde dich an, um an Events teilzunehmen")
                                window.location.href = "/login"
                                return
                              }
                              if (buttonProps.action === "leave") {
                                leaveEvent(event)
                              } else if (buttonProps.action === "manage") {
                                // For recurring events with additional dates, open date selection
                                setDateSelectionEvent(event)
                                setIsDateSelectionOpen(true)
                              } else {
                                handleJoinEvent(event) // Handles both single and recurring join logic
                              }
                            }}
                            disabled={buttonProps.disabled}
                            variant={buttonProps.variant}
                            className={`flex-1 font-handwritten ${
                              buttonProps.action === "manage"
                                ? "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-blue-500"
                                : buttonProps.action === "leave"
                                  ? "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white border-red-500"
                                  : "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white disabled:from-gray-400 disabled:from-gray-400"
                            }`}
                          >
                            {IconComponent ? (
                              <IconComponent className="h-4 w-4 mr-2" />
                            ) : (
                              <UserPlus className="h-4 w-4 mr-2" /> // Default icon if none specified
                            )}
                            {buttonProps.text}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="px-3 bg-transparent font-handwritten"
                            onClick={(e) => {
                              e.stopPropagation() // Prevent card click
                              if (!user) {
                                toast.info("Bitte melde dich an, um Nachrichten zu senden")
                                window.location.href = "/login"
                                return
                              }
                              // If user is the organizer, open management; otherwise, open message composer
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
                {/* Event Image or Placeholder */}
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

                {/* Organizer Info */}
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
                      <span className="font-medium hover:text-teal-600 cursor-pointer transition-colors text-gray-600">
                        {selectedEvent.creator.username}
                      </span>
                    </UserLink>
                  </div>
                </div>

                {/* Recurring Event Tabs */}
                {selectedEvent.frequency === "regular" ||
                selectedEvent.frequency === "recurring" ||
                selectedEvent.frequency === "täglich" ||
                selectedEvent.frequency === "wöchentlich" ||
                selectedEvent.frequency === "zweiwöchentlich" ||
                selectedEvent.frequency === "monatlich" ||
                selectedEvent.frequency === "jährlich" || // CHANGE: added 'jährlich'
                selectedEvent.frequency === "andere" ? (
                  <div className="space-y-4">
                    {/* Tabs for recurring events */}
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

                    {/* Content for Info Tab */}
                    {detailViewTab === "info" && (
                      <div className="space-y-4">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 text-sm">
                            <CalendarDaysIcon className="h-5 w-5 text-teal-600" />
                            <div>
                              <div className="text-gray-600 text-sm font-medium">
                                {selectedEvent.first_instance_date
                                  ? formatEventDate(selectedEvent.first_instance_date, selectedEvent.start_time)
                                  : "Keine bevorstehenden Termine"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-sm">
                            <Clock className="h-5 w-5 text-teal-600" />
                            <div>
                              <div className="text-gray-600 text-sm font-medium">
                                {selectedEvent.start_time.slice(0, 5)}
                                {selectedEvent.end_time && ` - ${selectedEvent.end_time.slice(0, 5)}`}
                              </div>
                            </div>
                          </div>

                          {getIntervalDisplay(selectedEvent) && (
                            <div className="flex items-center gap-3 text-sm">
                              <CalendarPlus2Icon className="h-5 w-5 text-teal-600" />
                              <div>
                                <div className="text-gray-600 text-sm font-medium">
                                  {getIntervalDisplay(selectedEvent)}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3 text-sm">
                            <MapPin className="h-5 w-5 text-teal-600" />
                            <div>
                              <div className="text-gray-600 text-sm font-medium">
                                {selectedEvent.location_type === "virtual"
                                  ? "Online Event"
                                  : selectedEvent.location || "Ort wird bekannt gegeben"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-sm">
                            <Users className="h-5 w-5 text-teal-600" />
                            <div>
                              <div className="text-gray-600 text-sm font-medium">
                                {formatParticipantCount(selectedEvent)}
                              </div>
                            </div>
                          </div>

                          {selectedEvent.selected_games && selectedEvent.selected_games.length > 0 && (
                            <div className="flex items-start gap-3 text-sm">
                              <Dices className="h-5 w-5 text-teal-600 mt-0.5" />
                              <div>
                                <ul className="text-gray-600 space-y-1">
                                  {selectedEvent.selected_games.map((game: any, index: number) => (
                                    <li key={index} className="flex items-center gap-2 text-sm font-medium">
                                      {(() => {
                                        if (typeof game === "string") {
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
                            <ExpandableDescription text={selectedEvent.description} />
                          </div>
                        )}
                        {selectedEvent.additional_notes && (
                          <div>
                            <h4 className="text-gray-800 mb-2 font-semibold">Zusatzinfos</h4>
                            <p className="text-gray-600 leading-relaxed text-sm">{selectedEvent.additional_notes}</p>
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

                    {/* Content for Schedule Tab */}
                    {detailViewTab === "schedule" && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800 mb-3">Alle geplanten Termine</h3>
                        <div className="space-y-3">
                          {additionalDates.map((date, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-lg border-2 ${
                                isNextUpcomingDate(date.event_date)
                                  ? "bg-blue-50 border-blue-200"
                                  : index === 0
                                    ? "bg-teal-50 border-teal-200"
                                    : index === additionalDates.length - 1
                                      ? "bg-orange-50 border-orange-200"
                                      : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <div className="flex items-center gap-3 mb-2 text-sm">
                                <Calendar className="text-gray-600 h-4 w-4" />
                                <div className="font-medium text-gray-600">
                                  {formatEventDate(date.event_date, date.start_time)}
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                  {index === 0 && (
                                    <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">
                                      Startdatum
                                    </span>
                                  )}
                                  {isNextUpcomingDate(date.event_date) && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-normal">
                                      Nächster Termin
                                    </span>
                                  )}
                                  {index === additionalDates.length - 1 &&
                                    index !== 0 &&
                                    !isNextUpcomingDate(date.event_date) && (
                                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                                        Letzter Termin
                                      </span>
                                    )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <Clock className="text-gray-600 h-4 w-4" />
                                <div className="font-medium text-gray-600">
                                  {date.start_time.slice(0, 5)}
                                  {date.end_time && ` - ${date.end_time.slice(0, 5)}`}
                                </div>
                              </div>
                              <div
                                className={`flex items-center gap-3 mt-2 pt-2 border-t text-sm  text-sm ${
                                  isNextUpcomingDate(date.event_date)
                                    ? "border-blue-200"
                                    : index === 0
                                      ? "border-teal-200"
                                      : index === additionalDates.length - 1
                                        ? "border-orange-200"
                                        : "border-gray-200"
                                }`}
                              >
                                <Users className="text-gray-600 h-4 w-4" />
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
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Non-recurring event details
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-teal-600" />
                        <div>
                          <div className="font-normal text-sm text-gray-600">
                            {formatEventDate(selectedEvent.first_instance_date, selectedEvent.start_time)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <Clock className="h-5 w-5 text-teal-600" />
                        <div>
                          <div className="text-gray-600 text-sm">
                            {selectedEvent.start_time.slice(0, 5)}
                            {selectedEvent.end_time && ` - ${selectedEvent.end_time.slice(0, 5)}`}
                          </div>
                        </div>
                      </div>

                      {getIntervalDisplay(selectedEvent) && (
                        <div className="flex items-center gap-3">
                          <CalendarPlus2Icon className="h-5 w-5 text-teal-600" />
                          <div>
                            <div className="text-gray-600 text-sm">{getIntervalDisplay(selectedEvent)}</div>
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
                          <div className="text-gray-600 text-sm">{formatParticipantCount(selectedEvent)}</div>
                        </div>
                      </div>

                      {selectedEvent.selected_games && selectedEvent.selected_games.length > 0 && (
                        <div className="flex items-start gap-3">
                          <Dices className="h-5 w-5 text-teal-600 mt-0.5" />
                          <div>
                            <ul className="text-gray-600 space-y-1">
                              {selectedEvent.selected_games.map((game: any, index: number) => (
                                <li key={index} className="text-gray-600">
                                  {(() => {
                                    if (typeof game === "string") {
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
                            <span className="hover:text-teal-600 cursor-pointer transition-colors text-sm">
                              {selectedEvent.creator.username}
                            </span>
                          </UserLink>
                        </div>
                      </div>
                    </div>

                    {selectedEvent.description && (
                      <div>
                        <h4 className="text-gray-800 mb-2 font-semibold">Beschreibung</h4>
                        <ExpandableDescription text={selectedEvent.description} />
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
                          if (buttonProps.action === "leave") {
                            leaveEvent(selectedEvent)
                          } else if (buttonProps.action === "manage") {
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
                            : buttonProps.action === "leave"
                              ? "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white border-red-500"
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
                    className="px-4 bg-transparent font-handwritten ml-auto"
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

        {/* Join Event Dialog */}
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

        {/* Date Selection Dialog */}
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
              loadEvents() // Refresh event list on successful date selection
            }}
          />
        )}

        {/* Message Composer Modal */}
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

        {/* Ludo Event Management Dialog */}
        {managementEvent && (
          <LudoEventManagementDialog
            isOpen={isManagementDialogOpen}
            onClose={() => {
              setIsManagementDialogOpen(false)
              setManagementEvent(null)
              loadEvents() // Refresh event list after management actions
            }}
            event={managementEvent}
          />
        )}

        {/* Create Event Dialog */}
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
                toast.success("Viel Spass! Dein Event wurde erstellt!")
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
