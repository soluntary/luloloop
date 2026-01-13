"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { useSearchParams, useRouter } from "next/navigation" // Changed to useSearchParams and useRouter

import {
  FaPlus,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaCalendar,
  FaClock,
  FaUserCheck,
  FaUserPlus,
  FaComment,
  FaUsers,
  FaUserCog,
  FaDice,
  FaChevronDown,
  FaUserTimes,
  FaUserMinus,
  FaBullhorn, // Added for broadcast
} from "react-icons/fa"
import { MdEventRepeat, MdOutlineManageSearch } from "react-icons/md"
import { FiFilter } from "react-icons/fi"
// </CHANGE>

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// </CHANGE> REMOVED lucide-react imports
// import { Search, Plus, MapPin, CalendarDaysIcon, Calendar, Clock, UserCheckIcon, UserPlus, MessageCircle, Settings, Filter, Users, UserCog, Dices, UserCheck, Spade, CalendarPlus2Icon, ChevronDown, UserRoundCheck, UserRoundCog, UserX, UserRoundMinus } from 'lucide-react'
// </CHANGE>
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Navigation from "@/components/navigation"
import UserLink from "@/components/user-link"
import { SkyscraperAd } from "@/components/advertising/ad-placements"
import DateSelectionDialog from "@/components/date-selection-dialog"
import { MessageComposerModal } from "@/components/message-composer-modal"
// Removed LudoEventManagementDialog import
// import { LudoEventManagementDialog } from "@/components/ludo-event-management-dialog"
// </CHANGE>
import { ShareButton } from "@/components/share-button"
import { SimpleLocationSearch } from "@/components/simple-location-search"
import { useLocationSearch } from "@/contexts/location-search-context"
import { DistanceBadge } from "@/components/distance-badge"
import { LocationMap } from "@/components/location-map"
import { ExpandableDescription } from "@/components/expandable-description"
import { convertMarkdownToHtml } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion" // Import motion
import { UserProfileModal } from "@/components/user-profile-modal"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
// </CHANGE>
// Import for new management dropdown
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, Trash2, Settings, UserPlus, MessageCircle } from "lucide-react"
import { CreateLudoEventFormDialog } from "@/components/forms/create-ludo-event-form-dialog"

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
  // Add images property for event carousel
  images?: string[]
}

export default function LudoEventsPage() {
  const searchParams = useSearchParams() // Changed to useSearchParams
  const router = useRouter() // Initialize router
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
  const [isManagementDialogOpen, setIsManagementDialogOpen] = useState(false)
  const [managementEvent, setManagementEvent] = useState<LudoEvent | null>(null)
  const [eventParticipants, setEventParticipants] = useState<any[]>([])
  const [loadingParticipants, setLoadingParticipants] = useState(false)
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false)
  const [broadcastMessage, setBroadcastMessage] = useState("")
  // </CHANGE>
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
  const [profileModalUserId, setProfileModalUserId] = useState<string | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  // </CHANGE>

  // State for event editing and inviting friends
  const [selectedCommunity, setSelectedCommunity] = useState<LudoEvent | null>(null) // Assuming this should be LudoEvent based on usage
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  const [hasProcessedURLParams, setHasProcessedURLParams] = useState(false)

  const supabase = createClient()
  const { user } = useAuth() // Correctly access user from useAuth

  useEffect(() => {
    loadEvents()
  }, [])
  // </CHANGE>

  useEffect(() => {
    if (!events.length) return

    const viewId = searchParams.get("view")
    const shouldManage = searchParams.get("manage") === "true"
    const shouldBroadcast = searchParams.get("broadcast") === "true"

    console.log("[v0] Events URL params:", { viewId, shouldManage, shouldBroadcast })

    if (viewId && !hasProcessedURLParams) {
      const event = events.find((e) => e.id === viewId)
      if (event) {
        console.log("[v0] Found event from URL param:", event.title)
        setSelectedEvent(event)
        setIsDetailsDialogOpen(true)
        setHasProcessedURLParams(true)

        // Open specific management dialogs based on URL params
        if (shouldManage) {
          console.log("[v0] Opening management dialog from URL param")
          openEventManagement(event)
        } else if (shouldBroadcast) {
          console.log("[v0] Opening broadcast dialog from URL param")
          setManagementEvent(event)
          loadEventParticipants(event.id)
          setIsBroadcastModalOpen(true)
        }
      }
    }

    if (!viewId && hasProcessedURLParams) {
      setHasProcessedURLParams(false)
    }
  }, [searchParams, events, hasProcessedURLParams])
  // </CHANGE>

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

  const openEventManagement = (event: LudoEvent) => {
    setManagementEvent(event)
    setIsManagementDialogOpen(true)
    loadEventParticipants(event.id)
  }

  const loadEventParticipants = async (eventId: string) => {
    setLoadingParticipants(true)
    try {
      const { data, error } = await supabase
        .from("ludo_event_participants")
        .select(`
          *,
          user:users!ludo_event_participants_user_id_fkey(id, username, avatar, name)
        `)
        .eq("event_id", eventId)

      if (error) throw error
      setEventParticipants(data || [])
    } catch (error) {
      console.error("Error loading participants:", error)
      toast.error("Fehler beim Laden der Teilnehmer")
    } finally {
      setLoadingParticipants(false)
    }
  }

  const removeParticipant = async (participantId: string, username: string) => {
    try {
      const { error } = await supabase.from("ludo_event_participants").delete().eq("id", participantId)

      if (error) throw error

      toast.success(`${username} wurde entfernt`)
      if (managementEvent) loadEventParticipants(managementEvent.id)
      loadEvents()
    } catch (error) {
      console.error("Error removing participant:", error)
      toast.error("Fehler beim Entfernen des Teilnehmers")
    }
  }

  const sendEventBroadcast = async () => {
    if (!user || !managementEvent || !broadcastMessage.trim()) return

    try {
      // Send notification to all participants
      for (const participant of eventParticipants) {
        await supabase.from("notifications").insert({
          user_id: participant.user_id,
          type: "event_broadcast",
          title: `Nachricht von ${managementEvent.title}`,
          message: broadcastMessage,
          data: {
            event_id: managementEvent.id,
            event_title: managementEvent.title,
          },
        })
      }

      toast.success("Nachricht wurde an alle Teilnehmer gesendet")
      setIsBroadcastModalOpen(false)
      setBroadcastMessage("")
    } catch (error) {
      console.error("Error sending broadcast:", error)
      toast.error("Fehler beim Senden der Nachricht")
    }
  }
  // </CHANGE>

  // Function to load friends (needed for invite dialog)
  const loadFriends = async () => {
    // Placeholder: Implement logic to fetch friends if needed
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("ludo_events").delete().eq("id", eventId)
      if (error) throw error

      toast.success("Event erfolgreich gelöscht!")
      loadEvents() // Refresh the event list
      setIsDetailsDialogOpen(false) // Close the dialog if it was open
    } catch (error) {
      console.error("Error deleting event:", error)
      toast.error("Fehler beim Löschen des Events")
    }
  }

  useEffect(() => {
    // </CHANGE>

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
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, "0")
      const day = String(today.getDate()).padStart(2, "0")
      const todayString = `${year}-${month}-${day}`

      console.log("[v0] Today's date for filtering:", todayString)

      // Build the base query
      const query = supabase
        .from("ludo_events")
        .select(`
          *,
          creator:users!creator_id(id, username, name, avatar),
          ludo_event_instances!inner(instance_date)
        `)
        .eq("visibility", "public")
        .gte("ludo_event_instances.instance_date", todayString)
        .order("created_at", { ascending: false })

      // </CHANGE> Removed the filter that excludes user's own events so users can see all events including their own
      // Users should be able to see and manage their own events
      // The following line was removed: .neq("creator_id", user.id)

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
              .gte("instance_date", todayString)
              .order("instance_date", { ascending: true })
              .limit(1)

            console.log(`[v0] Event "${event.title}" (${event.id}):`)
            console.log(`[v0]   - Filtering instances >= ${todayString}`)
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
              .gte("instance_date", todayString)
              .order("instance_date", { ascending: true })
              .limit(1)
              .single()

            console.log(`[v0] Event "${event.title}" (${event.id}) [non-logged-in]:`)
            console.log(`[v0]   - Filtering instances >= ${todayString}`)
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
      return {
        text: "Dein Event",
        disabled: true,
        variant: "secondary" as const,
        className: "border-2",
      }
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
          icon: FaUserMinus,
        }
      }

      // For recurring events, show "Angemeldet" and allow management
      return {
        text: "Angemeldet",
        disabled: false,
        variant: "outline" as const,
        action: "manage",
        icon: FaUserCheck,
      }
    }

    // If the user's participation is pending
    if (event.user_participation_status === "pending") {
      return { text: "Warte auf Genehmigung", disabled: true, variant: "outline" as const, icon: FaClock }
    }

    // If the user's participation was rejected
    if (event.user_participation_status === "rejected") {
      return { text: "Abgelehnt", disabled: false, variant: "outline" as const, icon: FaUserTimes }
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
  // </CHANGE>

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
          {event.participant_count} Teilnehmer (<span className="text-green-600 font-medium">unbegrenzt</span>)
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50 to-cyan-50">
      <Navigation currentPage="ludo-events" />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-handwritten text-3xl sm:text-4xl md:text-5xl text-gray-800 mb-4">Spielevents</h1>
          {user && (
            <Button
              onClick={() => {
                setIsCreateDialogOpen(true)
              }}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 font-handwritten"
            >
              <FaPlus className="h-4 w-4 mr-2" /> {/* Changed to FaPlus */}
              Event erstellen
            </Button>
          )}
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-gray-100 shadow-sm mb-8">
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <MdOutlineManageSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Events durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 bg-white/80 border-gray-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-xs"
                />
              </div>
            </div>

            <SimpleLocationSearch onLocationSearch={handleLocationSearch} onNearbySearch={handleNearbySearch} />

            {showLocationResults && (
              // Changed blue to teal for clear location button
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <FaMapMarkerAlt className="h-4 w-4 text-gray-600" /> {/* Changed to FaMapMarkerAlt */}
                  <span className="text-xs text-gray-800 font-medium">
                    Zeige Ergebnisse in der Nähe ({locationSearchResults.length})
                  </span>
                </div>
                {/* Changed blue to teal for clear location button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowLocationResults(false)
                    setLocationSearchResults([])
                  }}
                  className="text-gray-600 border-gray-200 hover:bg-gray-100 h-7 text-xs"
                >
                  Alle Events zeigen
                </Button>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1.5 block font-medium">Sortieren nach</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-9 bg-white/80 border-gray-200 focus:border-teal-400 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">
                        Alle
                      </SelectItem>
                      <SelectItem value="newest" className="text-xs">
                        Neueste
                      </SelectItem>
                      <SelectItem value="date" className="text-xs">
                        Datum
                      </SelectItem>
                      <SelectItem value="participants" className="text-xs">
                        Teilnehmer
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1.5 block font-medium">Häufigkeit</Label>
                  <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
                    <SelectTrigger className="h-9 bg-white/80 border-gray-200 focus:border-teal-400 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">
                        Alle
                      </SelectItem>
                      <SelectItem value="einmalig" className="text-xs">
                        Einmalig
                      </SelectItem>
                      <SelectItem value="täglich" className="text-xs">
                        Täglich
                      </SelectItem>
                      <SelectItem value="wöchentlich" className="text-xs">
                        Wöchentlich
                      </SelectItem>
                      <SelectItem value="monatlich" className="text-xs">
                        Monatlich
                      </SelectItem>
                      <SelectItem value="jährlich" className="text-xs">
                        Jährlich
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1.5 block font-medium">Zeitpunkt</Label>
                  <Select value={timePeriodFilter} onValueChange={setTimePeriodFilter}>
                    <SelectTrigger className="h-9 bg-white/80 border-gray-200 focus:border-teal-400 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">
                        Alle
                      </SelectItem>
                      <SelectItem value="heute" className="text-xs">
                        Heute
                      </SelectItem>
                      <SelectItem value="morgen" className="text-xs">
                        Morgen
                      </SelectItem>
                      <SelectItem value="wochenende" className="text-xs">
                        Wochenende
                      </SelectItem>
                      <SelectItem value="diese-woche" className="text-xs">
                        Diese Woche
                      </SelectItem>
                      <SelectItem value="naechste-woche" className="text-xs">
                        Nächste Woche
                      </SelectItem>
                      <SelectItem value="dieser-monat" className="text-xs">
                        Dieser Monat
                      </SelectItem>
                      <SelectItem value="naechster-monat" className="text-xs">
                        Nächster Monat
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1.5 block font-medium">Filter</Label>
                  <Button
                    variant="outline"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="h-9 w-full border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 text-xs"
                  >
                    <FiFilter className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Mehr Filter</span>
                    <span className="sm:hidden">Filter</span>
                    <FaChevronDown
                      className={`w-3 h-3 ml-1 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`}
                    />
                  </Button>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1.5 block font-medium invisible">Zurücksetzen</Label>
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
                    className="h-9 w-full border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 text-xs"
                  >
                    <span className="hidden sm:inline">Filter zurücksetzen</span>
                    <span className="sm:hidden">Reset</span>
                  </Button>
                </div>
              </div>

              {showAdvancedFilters && (
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500 flex items-center">
                    <FiFilter className="w-3 h-3 mr-2" />
                    Mehr Filter
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1.5 block font-medium">Ort</Label>
                      <Select value={locationFilter} onValueChange={setLocationFilter}>
                        <SelectTrigger className="h-9 bg-white/80 border-gray-200 focus:border-teal-400 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-xs">
                            Alle
                          </SelectItem>
                          <SelectItem value="local" className="text-xs">
                            Vor Ort
                          </SelectItem>
                          <SelectItem value="virtual" className="text-xs">
                            Online
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500 mb-1.5 block font-medium">Kapazität</Label>
                      <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                        <SelectTrigger className="h-9 bg-white/80 border-gray-200 focus:border-teal-400 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-xs">
                            Alle
                          </SelectItem>
                          <SelectItem value="available" className="text-xs">
                            Freie Plätze
                          </SelectItem>
                          <SelectItem value="full" className="text-xs">
                            Ausgebucht
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500 mb-1.5 block font-medium">Teilnahmemodus</Label>
                      <Select value={approvalModeFilter} onValueChange={setApprovalModeFilter}>
                        <SelectTrigger className="h-9 bg-white/80 border-gray-200 focus:border-teal-400 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-xs">
                            Alle
                          </SelectItem>
                          <SelectItem value="automatic" className="text-xs">
                            Direkte Teilnahme
                          </SelectItem>
                          <SelectItem value="manual" className="text-xs">
                            Teilnahme erst nach Genehmigung
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                  <FaCalendar className="h-16 w-16 text-gray-300 mx-auto mb-4" /> {/* Changed to FaCalendar */}
                  <h3 className="font-semibold text-gray-600 mb-2">Keine Events gefunden</h3>
                  <p className="text-gray-600 mb-2 font-extralight text-sm">
                    {searchTerm ? "Versuche einen anderen Suchbegriff" : "Sei der Erste und erstelle ein neues Event!"}
                  </p>
                  {!searchTerm && (
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 font-handwritten"
                    >
                      <FaPlus className="h-4 w-4 mr-2" /> {/* Changed to FaPlus */}
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
                      className="group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 cursor-pointer overflow-hidden flex flex-col"
                    >
                      {/* Event Image or Placeholder */}
                      {!event.image_url && (
                        <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
                          {isRecurring && (
                            <div className="absolute top-2 right-2 z-10">
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-teal-50 backdrop-blur-sm text-xs font-medium text-teal-600 rounded-full border border-teal-200 shadow-sm">
                                <MdEventRepeat className="h-3 w-3" />
                                <span>Serientermine</span>
                              </div>
                            </div>
                          )}
                          <div className="absolute top-2 left-2 z-10">
                            {event.approval_mode === "automatic" ? (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-teal-50 backdrop-blur-sm text-xs font-medium text-teal-600 rounded-full border border-teal-200 shadow-sm">
                                <FaUserCheck className="h-3 w-3" />
                                <span>Direkte Teilnahme</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-100 backdrop-blur-sm text-xs font-medium text-amber-800 rounded-full border border-amber-200 shadow-sm">
                                <FaClock className="h-3 w-3" />
                                <span>Genehmigung erforderlich</span>
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <FaDice className="h-12 w-12 text-teal-400 mx-auto mb-1" />
                          </div>
                        </div>
                      )}

                      {event.image_url && (
                        <div className="relative aspect-[16/9] w-full overflow-hidden">
                          <img
                            src={event.image_url || "/placeholder.svg"}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                          {isRecurring && (
                            <div className="absolute top-2 right-2 z-10">
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-teal-50 backdrop-blur-sm text-xs font-medium text-teal-600 rounded-full border border-teal-200 shadow-sm">
                                <MdEventRepeat className="h-3 w-3" />
                                <span className="">Serientermine</span>
                              </div>
                            </div>
                          )}
                          <div className="absolute top-2 left-2 z-10">
                            {event.approval_mode === "automatic" ? (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-teal-50 backdrop-blur-sm text-xs font-medium text-teal-600 rounded-full border border-teal-200 shadow-sm">
                                <FaUserCheck className="h-3 w-3" />
                                <span>Direkte Teilnahme</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-100 backdrop-blur-sm text-xs font-medium text-amber-800 rounded-full border border-amber-200 shadow-sm">
                                <FaClock className="h-3 w-3" />
                                <span>Genehmigung erforderlich</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <CardHeader className="pb-2 px-4 mt-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-handwritten font-bold text-gray-900 mb-0 group-hover:text-teal-600 transition-colors text-xs truncate">
                              {event.title}
                            </h3>
                          </div>
                          {event.distance !== undefined && <DistanceBadge distance={event.distance} className="ml-2" />}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-2 flex-1 flex flex-col px-4 pb-4">
                        {event.description && (
                          <p
                            className="text-xs text-gray-600 line-clamp-2 font-normal mb-2"
                            dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(event.description) }}
                          />
                        )}
                        <div className="space-y-1.5 mt-auto border-t border-gray-100 pt-2">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <FaCalendarAlt className="text-teal-600 h-3.5 w-3.5" /> {/* Changed to FaCalendarAlt */}
                            <span className="text-xs">
                              {(() => {
                                console.log(`[v0] Card view for event "${event.title}":`, {
                                  first_instance_date: event.first_instance_date,
                                  formatted: event.first_instance_date
                                    ? formatEventDate(event.first_instance_date, event.start_time)
                                    : "Keine bevorstehenden Termine",
                                })
                                return event.first_instance_date
                                  ? formatEventDate(event.first_instance_date, event.start_time)
                                  : "Keine bevorstehenden Termine"
                              })()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <FaClock className="text-teal-600 h-3.5 w-3.5" /> {/* Changed to FaClock */}
                            <span className="text-xs">
                              {event.start_time.slice(0, 5)}
                              {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
                            </span>
                          </div>

                          {intervalDisplay && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <MdEventRepeat className="h-3.5 w-3.5 text-teal-600" /> {/* Changed to FaCalendarPlus */}
                              <span className="text-xs">{intervalDisplay}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <FaMapMarkerAlt className="text-teal-600 h-3.5 w-3.5" /> {/* Changed to FaMapMarkerAlt */}
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
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <FaDice className="text-teal-600 h-3.5 w-3.5" /> {/* Changed to FaDice */}
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

                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <FaUsers className="text-teal-600 h-3.5 w-3.5" /> {/* Changed to FaUsers */}
                            <span>{formatParticipantCount(event)}</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <FaUserCog className="text-teal-600 h-3.5 w-3.5" /> {/* Changed to FaUserCog */}
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
                                <span className="hover:text-teal-600 cursor-pointer transition-colors text-xs">
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
                              e.stopPropagation()
                              if (!user) {
                                toast.info("Bitte melde dich an, um an Events teilzunehmen")
                                window.location.href = "/login"
                                return
                              }
                              if (buttonProps.action === "leave") {
                                leaveEvent(event)
                              } else if (buttonProps.action === "manage") {
                                setDateSelectionEvent(event)
                                setIsDateSelectionOpen(true)
                              } else {
                                handleJoinEvent(event)
                              }
                            }}
                            disabled={buttonProps.disabled}
                            variant={buttonProps.variant}
                            className={`font-handwritten ${
                              user && event.creator_id === user.id ? "flex-1" : "flex-1"
                            } ${
                              buttonProps.action === "manage"
                                ? "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-blue-500"
                                : buttonProps.action === "leave"
                                  ? "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-500 text-white border-red-500"
                                  : "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white disabled:from-gray-400 disabled:from-gray-400"
                            }`}
                          >
                            {IconComponent ? (
                              <IconComponent className="h-4 w-4 mr-2" />
                            ) : (
                              <FaUserPlus className="h-4 w-4 mr-2" />
                            )}
                            {buttonProps.text}
                          </Button>

                          {user && event.creator_id !== user.id && (
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
                                openMessageComposer(event)
                              }}
                            >
                              <FaComment className="h-4 w-4 mr-2" />
                            </Button>
                          )}
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
        <Dialog
          open={isDetailsDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              // First clear the dialog state
              setIsDetailsDialogOpen(false)
              setSelectedEvent(null)
              // Don't reset hasProcessedURLParams here - let useEffect handle it when URL changes
              // Update URL to remove parameters
              router.push("/ludo-events", { scroll: false })
            } else {
              setIsDetailsDialogOpen(true)
            }
            // </CHANGE>
          }}
        >
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="px-4 pt-4 pb-3 border-b">
              <div className="flex justify-end mb-3">
                {user && selectedEvent && selectedEvent.creator_id === user.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="h-9 px-3 bg-transparent">
                        <Settings className="h-4 w-4 mr-2" />
                        Verwalten
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem
                        onClick={() => {
                          router.push(`/edit/event/${selectedEvent.id}`)
                          setIsDetailsDialogOpen(false)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Event bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          openEventManagement(selectedEvent)
                        }}
                      >
                        <FaUsers className="h-4 w-4 mr-2" />
                        Teilnehmer verwalten
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCommunity(selectedEvent) // Assuming setSelectedCommunity should be LudoEvent
                          loadFriends()
                          setShowInviteDialog(true)
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Freunde einladen
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteEvent(selectedEvent.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Event löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <DialogTitle className="font-handwritten text-base text-gray-800">{selectedEvent?.title}</DialogTitle>
              <DialogDescription>Event Details und Informationen</DialogDescription>
            </DialogHeader>
            {/* </CHANGE> */}

            {selectedEvent && (
              <div className="space-y-6">
                {/* Event Image or Placeholder - MERGED UPDATE */}
                {selectedEvent.images && selectedEvent.images.length > 1 ? (
                  <Carousel className="w-full">
                    <CarouselContent>
                      {selectedEvent.images.map((image: string, index: number) => (
                        <CarouselItem key={index}>
                          <div className="w-full h-48 rounded-lg overflow-hidden">
                            <img
                              src={image || "/placeholder.svg"}
                              alt={`${selectedEvent.title} - Bild ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </Carousel>
                ) : !selectedEvent.image_url ? (
                  <div className="w-full h-48 rounded-lg overflow-hidden bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
                    <div className="text-center">
                      <FaDice className="h-16 w-16 text-teal-400 mx-auto mb-2" />
                    </div>
                  </div>
                ) : (
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
                    <span className="text-gray-600 font-medium text-xs">Organisiert von</span>
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={selectedEvent.creator.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-gray-50 text-xs">
                        {selectedEvent.creator.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <UserLink
                      userId={selectedEvent.creator.id}
                      className="text-gray-800 hover:text-teal-600 transition-colors"
                    >
                      <span className="font-medium hover:text-teal-600 cursor-pointer transition-colors text-gray-600 text-xs">
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
                    <div className="flex border-b border-gray-200 text-xs">
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
                        <div className="space-y-3.5">
                          <div className="flex items-center gap-3 text-xs">
                            <FaCalendarAlt className="text-teal-600 h-4 w-4" /> {/* Changed to FaCalendarAlt */}
                            <div>
                              <div className="text-gray-600 text-xs font-medium">
                                {selectedEvent.first_instance_date
                                  ? formatEventDate(selectedEvent.first_instance_date, selectedEvent.start_time)
                                  : "Keine bevorstehenden Termine"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs">
                            <FaClock className="text-teal-600 h-4 w-4" /> {/* Changed to FaClock */}
                            <div>
                              <div className="text-gray-600 text-xs font-medium">
                                {selectedEvent.start_time.slice(0, 5)}
                                {selectedEvent.end_time && ` - ${selectedEvent.end_time.slice(0, 5)}`}
                              </div>
                            </div>
                          </div>

                          {getIntervalDisplay(selectedEvent) && (
                            <div className="flex items-center gap-3 text-xs">
                              <MdEventRepeat className="h-4 w-4 text-teal-600" /> {/* Changed to FaCalendarPlus */}
                              <div>
                                <div className="text-gray-600 text-xs font-medium">
                                  {getIntervalDisplay(selectedEvent)}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3 text-xs">
                            <FaMapMarkerAlt className="text-teal-600 h-4 w-4" /> {/* Changed to FaMapMarkerAlt */}
                            <div>
                              <div className="text-gray-600 font-medium text-xs">
                                {selectedEvent.location_type === "virtual"
                                  ? "Online Event"
                                  : selectedEvent.location || "Ort wird bekannt gegeben"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs">
                            <FaUsers className="text-teal-600 h-4 w-4" /> {/* Changed to FaUsers */}
                            <div>
                              <div className="text-gray-600 text-xs font-medium">
                                {formatParticipantCount(selectedEvent)}
                              </div>
                            </div>
                          </div>

                          {selectedEvent.selected_games && selectedEvent.selected_games.length > 0 && (
                            <div className="flex items-start gap-3 text-xs">
                              <FaDice className="text-teal-600 h-4 w-4 mt-0.5" /> {/* Changed to FaDice */}
                              <div>
                                <ul className="text-gray-600 space-y-1">
                                  {selectedEvent.selected_games.map((game: any, index: number) => (
                                    <li key={index} className="flex items-center gap-2 font-medium text-xs">
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
                            <h4 className="text-gray-800 mb-2 font-semibold text-sm">Beschreibung</h4>
                            <ExpandableDescription text={selectedEvent.description} />
                          </div>
                        )}
                        {selectedEvent.additional_notes && (
                          <div>
                            <h4 className="text-gray-800 mb-2 font-semibold text-sm">Zusatzinfos</h4>
                            <ExpandableDescription text={selectedEvent.additional_notes} />
                          </div>
                        )}

                        <div className="bg-white border border-slate-200 rounded-2xl p-6">
                          {selectedEvent.location_type === "virtual" ? (
                            // Changed blue info boxes to teal
                            <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                              <p className="text-teal-800 text-xs">
                                Dies ist ein virtuelles Event (Online). Keine Karte verfügbar.
                              </p>
                            </div>
                          ) : !selectedEvent.location ? (
                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                              <p className="text-yellow-800 text-xs">
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
                        <h3 className="font-semibold text-gray-800 mb-3 text-sm">Alle geplanten Termine</h3>
                        <div className="space-y-3">
                          {additionalDates.map((date, index) => {
                            const isStartDate = index === 0
                            const isNextDate = isNextUpcomingDate(date.event_date)
                            const isLastDate = index === additionalDates.length - 1 && index !== 0 && !isNextDate

                            let bgColor = "bg-white"
                            let borderColor = "border-gray-200"
                            let badgeBg = ""
                            let badgeText = ""
                            let dividerColor = "border-gray-200"

                            if (isStartDate) {
                              bgColor = "bg-blue-50"
                              borderColor = "border-blue-200"
                              badgeBg = "bg-blue-100"
                              badgeText = "text-blue-700"
                              dividerColor = "border-blue-200"
                            } else if (isNextDate) {
                              bgColor = "bg-teal-50"
                              borderColor = "border-teal-200"
                              badgeBg = "bg-teal-100"
                              badgeText = "text-teal-700"
                              dividerColor = "border-teal-200"
                            } else if (isLastDate) {
                              bgColor = "bg-amber-50"
                              borderColor = "border-amber-200"
                              badgeBg = "bg-amber-100"
                              badgeText = "text-amber-700"
                              dividerColor = "border-amber-200"
                            }

                            return (
                              <div key={index} className={`p-3 rounded-lg border-2 ${bgColor} ${borderColor}`}>
                                <div className="flex items-center gap-3 mb-2 text-xs">
                                  <FaCalendar className="text-gray-600 h-4 w-4" /> {/* Changed to FaCalendar */}
                                  <div className="font-medium text-gray-600 text-xs">
                                    {formatEventDate(date.event_date, date.start_time)}
                                  </div>
                                  <div className="ml-auto flex items-center gap-2">
                                    {isStartDate && (
                                      <span className={`px-2 py-1 ${badgeBg} ${badgeText} text-xs rounded-full`}>
                                        Startdatum
                                      </span>
                                    )}
                                    {isNextDate && (
                                      <span
                                        className={`px-2 py-1 text-green-600 bg-green-200 ${badgeBg} ${badgeText} text-xs rounded-full font-normal`}
                                      >
                                        Nächster Termin
                                      </span>
                                    )}
                                    {isLastDate && (
                                      <span className={`px-2 py-1 ${badgeBg} ${badgeText} text-xs rounded-full`}>
                                        Letzter Termin
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                  <FaClock className="text-gray-600 h-4 w-4" /> {/* Changed to FaClock */}
                                  <div className="font-medium text-gray-600 text-xs">
                                    {date.start_time.slice(0, 5)}
                                    {date.end_time && ` - ${date.end_time.slice(0, 5)}`}
                                  </div>
                                </div>
                                <div className={`flex items-center gap-3 mt-2 pt-2 border-t ${dividerColor}`}>
                                  <FaUsers className="text-gray-600 h-4 w-4" /> {/* Changed to FaUsers */}
                                  <div className="font-medium text-gray-600 text-xs">
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
                                    {!date.max_participants && (
                                      <span className="ml-1 text-green-600 font-medium">unbegrenzt</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Non-recurring event details
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <FaCalendarAlt className="h-4 w-4 text-teal-600" /> {/* Changed to FaCalendarAlt */}
                        <div>
                          <div className="font-normal text-xs text-gray-600">
                            {formatEventDate(selectedEvent.first_instance_date, selectedEvent.start_time)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <FaClock className="h-4 w-4 text-teal-600" /> {/* Changed to FaClock */}
                        <div>
                          <div className="text-gray-600 text-xs">
                            {selectedEvent.start_time.slice(0, 5)}
                            {selectedEvent.end_time && ` - ${selectedEvent.end_time.slice(0, 5)}`}
                          </div>
                        </div>
                      </div>

                      {getIntervalDisplay(selectedEvent) && (
                        <div className="flex items-center gap-3">
                          <MdEventRepeat className="h-4 w-4 text-teal-600" /> {/* Changed to FaCalendarPlus */}
                          <div>
                            <div className="text-gray-600 text-xs">{getIntervalDisplay(selectedEvent)}</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <FaMapMarkerAlt className="h-4 w-4 text-teal-600" /> {/* Changed to FaMapMarkerAlt */}
                        <div>
                          <div className="text-gray-600 text-xs">
                            {selectedEvent.location_type === "virtual"
                              ? "Online Event"
                              : selectedEvent.location || "Ort wird bekannt gegeben"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <FaUsers className="h-4 w-4 text-teal-600" /> {/* Changed to FaUsers */}
                        <div>
                          <div className="text-gray-600 text-xs">{formatParticipantCount(selectedEvent)}</div>
                        </div>
                      </div>

                      {selectedEvent.selected_games && selectedEvent.selected_games.length > 0 && (
                        <div className="flex items-start gap-3">
                          <FaDice className="h-4 w-4 text-teal-600 mt-0.5" /> {/* Changed to FaDice */}
                          <div>
                            <ul className="text-gray-600 space-y-1">
                              {selectedEvent.selected_games.map((game: any, index: number) => (
                                <li key={index} className="text-gray-600 text-xs">
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
                        <FaUserCog className="h-4 w-4 text-teal-600" /> {/* Changed to FaUserCog */}
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
                            <span className="hover:text-teal-600 cursor-pointer transition-colors text-xs">
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
                        <ExpandableDescription text={selectedEvent.additional_notes} />
                      </div>
                    )}

                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                      {selectedEvent.location_type === "virtual" ? (
                        // Changed blue info boxes to teal
                        <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                          <p className="text-teal-800 text-xs">
                            Dies ist ein virtuelles Event (Online). Keine Karte verfügbar.
                          </p>
                        </div>
                      ) : !selectedEvent.location ? (
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-yellow-800 text-xs">
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

                <div className="bg-white border-t pt-4 mt-6">
                  <div className="flex gap-3">
                    {(() => {
                      const buttonConfig = getJoinButtonProps(selectedEvent)
                      const Icon = buttonConfig.icon

                      return (
                        <>
                          <Button
                            variant={buttonConfig.variant}
                            disabled={buttonConfig.disabled}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (buttonConfig.action === "leave") {
                                leaveEvent(selectedEvent)
                              } else if (buttonConfig.action === "manage") {
                                setDateSelectionEvent(selectedEvent)
                                setIsDateSelectionOpen(true)
                              } else {
                                handleJoinEvent(selectedEvent)
                              }
                            }}
                            className="flex-1 px-3 h-9 font-handwritten text-sm shadow-sm"
                          >
                            {Icon && <Icon className="h-4 w-4 mr-2" />}
                            {buttonConfig.text}
                          </Button>

                          {selectedEvent.creator_id !== user?.id && (
                            <>
                              <ShareButton
                                url={`${typeof window !== "undefined" ? window.location.origin : ""}/ludo-events/${selectedEvent.id}`}
                                title={selectedEvent.title}
                                description={selectedEvent.description || "Schau dir dieses Event an!"}
                                className="px-3 h-9 font-handwritten text-sm"
                              />

                              <Button
                                variant="outline"
                                className="px-3 h-9 bg-transparent font-handwritten text-sm"
                                onClick={() => {
                                  if (!user) {
                                    toast.info("Bitte melde dich an, um Nachrichten zu senden")
                                    window.location.href = "/login"
                                    return
                                  }
                                  if (selectedEvent) {
                                    openMessageComposer(selectedEvent)
                                    setIsDetailsDialogOpen(false)
                                  }
                                }}
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Nachricht
                              </Button>
                            </>
                          )}

                          {selectedEvent.creator_id === user?.id && (
                            <ShareButton
                              url={`${typeof window !== "undefined" ? window.location.origin : ""}/ludo-events/${selectedEvent.id}`}
                              title={selectedEvent.title}
                              description={selectedEvent.description || "Schau dir dieses Event an!"}
                              className="px-3 h-9 font-handwritten text-sm"
                            />
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>
                {/* </CHANGE> */}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Join Event Dialog */}
        <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                  <FaUsers className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    Event beitreten
                  </DialogTitle>
                  <p className="text-sm text-gray-500 mt-1">Teilnahme für "{joinEvent?.title}"</p>
                </div>
              </div>
            </DialogHeader>
            {joinEvent && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="join-message" className="text-xs font-medium text-gray-700">
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
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-handwritten"
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

        {/* Management Dialog */}
        <Dialog open={isManagementDialogOpen} onOpenChange={setIsManagementDialogOpen}>
          <DialogContent className="sm:max-w-xl max-h-[75vh] overflow-y-auto">
            <DialogHeader className="px-4 pt-4 pb-3 border-b">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg"
                >
                  <FaUsers className="h-7 w-7 text-white" />
                </motion.div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">Teilnehmer verwalten</DialogTitle>
                  <DialogDescription className="text-sm text-gray-500">{managementEvent?.title}</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {/* </CHANGE> */}

            <div className="px-4 py-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsBroadcastModalOpen(true)}
                className="w-full h-9 text-xs border-2 border-cyan-500 text-cyan-700 hover:bg-cyan-50 font-medium"
              >
                <FaBullhorn className="h-3.5 w-3.5 mr-1.5" />
                Nachricht an alle Teilnehmer senden
              </Button>
            </div>
            {/* </CHANGE> */}

            <div className="space-y-2 px-4 pb-4 max-h-[55vh] overflow-y-auto">
              {loadingParticipants ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500 mb-3"></div>
                  <p className="text-sm text-gray-600 font-medium">Lade Teilnehmer...</p>
                </div>
              ) : eventParticipants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <FaUsers className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">Keine Teilnehmer in diesem Event</p>
                  <p className="text-xs text-gray-500 mt-0.5">Warte auf neue Anmeldungen</p>
                </div>
              ) : (
                eventParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-2 border border-gray-200 rounded-lg shadow-sm bg-white hover:border-teal-200 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={participant.user.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white text-xs">
                          {participant.user.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <button
                          onClick={() => {
                            setProfileModalUserId(participant.user_id)
                            setIsProfileModalOpen(true)
                          }}
                          className="text-xs font-medium text-gray-800 hover:text-teal-600 hover:underline transition-colors text-left"
                        >
                          {participant.user.username}
                        </button>
                        <span className="text-xs text-gray-500">
                          {participant.user_id === managementEvent?.creator_id ? (
                            "Admin"
                          ) : (
                            <>
                              Mitglied • Beigetreten am{" "}
                              {new Date(participant.joined_at).toLocaleDateString("de-DE", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </>
                          )}
                        </span>
                        {/* </CHANGE> */}
                      </div>
                    </div>
                    {participant.user_id !== user?.id && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeParticipant(participant.id, participant.user.username)}
                        className="h-8 px-3 group relative hover:bg-red-600 active:scale-95 transition-all duration-150"
                      >
                        <FaUserMinus className="h-4 w-4 text-white" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
            {/* </CHANGE> */}
          </DialogContent>
        </Dialog>

        {/* Broadcast Dialog */}
        <Dialog open={isBroadcastModalOpen} onOpenChange={setIsBroadcastModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <FaBullhorn className="h-4 w-4 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Nachricht an alle Teilnehmer
                  </DialogTitle>
                </div>
              </div>
            </DialogHeader>
            {/* </CHANGE> */}
            <div className="space-y-3">
              <div className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700">
                  <span className="block text-xs mt-0.5">Alle Teilnehmer werden benachrichtigt</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="broadcast-message" className="text-xs font-bold text-gray-700">
                  Nachricht
                </Label>
                <Textarea
                  id="broadcast-message"
                  placeholder="Schreibe deine Nachricht..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows={5}
                  className="text-xs min-h-[120px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">{broadcastMessage.length}/500</p>
              </div>
            </div>
            <DialogFooter className="pt-3 border-t gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsBroadcastModalOpen(false)
                  setBroadcastMessage("")
                }}
                className="flex-1 h-8 text-xs"
              >
                Abbrechen
              </Button>
              <Button
                size="sm"
                onClick={sendEventBroadcast}
                disabled={!broadcastMessage.trim()}
                className="flex-1 h-8 text-xs bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg"
              >
                <FaBullhorn className="mr-1.5 h-3 w-3" />
                Senden
              </Button>
            </DialogFooter>
            {/* </CHANGE> */}
          </DialogContent>
        </Dialog>

        <UserProfileModal
          userId={profileModalUserId}
          isOpen={isProfileModalOpen}
          onClose={() => {
            setIsProfileModalOpen(false)
            setProfileModalUserId(null)
          }}
        />

        {isCreateDialogOpen && (
          <CreateLudoEventFormDialog
            onClose={() => setIsCreateDialogOpen(false)}
            onSuccess={() => {
              setIsCreateDialogOpen(false)
              loadEvents() // Renamed fetchEvents to loadEvents
              toast.success("Event erfolgreich erstellt!")
            }}
          />
        )}
        {/* </CHANGE> */}
      </div>
    </div>
  )
}
