"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  Users,
  Repeat,
  UserCog,
  Dices,
  Spade,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Navigation from "@/components/navigation"
import UserLink from "@/components/user-link"
import { SkyscraperAd } from "@/components/advertising/ad-placements"
import CreateLudoEventForm from "@/components/create-ludo-event-form-advanced"

interface LudoEvent {
  id: string
  title: string
  description: string
  creator_id: string
  max_participants: number | null
  event_date: string
  start_time: string
  end_time: string
  location: string
  location_type: "local" | "virtual"
  virtual_link: string | null
  frequency: "single" | "regular" | "recurring"
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
  creator: {
    id: string
    username: string
    name: string | null
    avatar: string | null
  }
}

export default function LudoEventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<LudoEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [frequencyFilter, setFrequencyFilter] = useState("all")
  const [availabilityFilter, setAvailabilityFilter] = useState("all")
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
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [additionalDates, setAdditionalDates] = useState<any[]>([])

  const supabase = createClient()

  useEffect(() => {
    loadEvents()
  }, [user])

  const loadEvents = async () => {
    try {
      console.log("[v0] Loading ludo events...")

      const { data, error } = await supabase
        .from("ludo_events")
        .select(`
          *,
          creator:users!creator_id(id, username, name, avatar)
        `)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error loading events:", error)
        throw error
      }

      console.log("[v0] Loaded events:", data?.length || 0)

      // Get participant counts and user participation status
      const eventsWithCounts = await Promise.all(
        (data || []).map(async (event) => {
          // Get participant count
          const { count } = await supabase
            .from("ludo_event_participants")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id)
            .eq("status", "approved")

          // Get user participation status if user is logged in
          let userParticipationStatus = null
          if (user) {
            const { data: participation } = await supabase
              .from("ludo_event_participants")
              .select("status")
              .eq("event_id", event.id)
              .eq("user_id", user.id)
              .single()

            userParticipationStatus = participation?.status || null
          }

          let hasAdditionalDates = false
          if (event.frequency === "regular" || event.frequency === "recurring") {
            const { count: instancesCount } = await supabase
              .from("ludo_event_instances")
              .select("*", { count: "exact", head: true })
              .eq("event_id", event.id)

            hasAdditionalDates = (instancesCount || 0) > 0
          }

          return {
            ...event,
            participant_count: count || 0,
            user_participation_status: userParticipationStatus,
            has_additional_dates: hasAdditionalDates,
          }
        }),
      )

      setEvents(eventsWithCounts)
    } catch (error) {
      console.error("Error loading events:", error)
      toast.error("Fehler beim Laden der Events")
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
      // Transform the data to match expected format
      const transformedData = (data || []).map((instance) => ({
        event_date: instance.instance_date,
        start_time: instance.start_time,
        end_time: instance.end_time,
        max_participants: instance.max_participants,
        notes: instance.notes,
      }))
      setAdditionalDates(transformedData)
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

    // For regular/recurring events with additional dates, show date selection
    if ((event.frequency === "regular" || event.frequency === "recurring") && event.has_additional_dates) {
      setDateSelectionEvent(event)
      setSelectedDates([]) // Reset selected dates
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

          toast.success(`Erfolgreich für ${selectedEventDates.length} Termine angemeldet!`)
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
      return { text: "Anmelden", disabled: false, variant: "default" as const }
    }

    if (event.creator_id === user.id) {
      return { text: "Dein Event", disabled: true, variant: "secondary" as const }
    }

    if (event.user_participation_status === "approved") {
      return { text: "Teilnehmend", disabled: false, variant: "outline" as const, action: "leave" }
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

    // Load additional dates for regular/recurring events
    if (event.frequency === "regular" || event.frequency === "recurring") {
      loadAdditionalDates(event.id)
    }
  }

  const openEventManagement = (event: LudoEvent, e: React.MouseEvent) => {
    e.stopPropagation()
    setManagementEvent(event)
    setIsManagementDialogOpen(true)
  }

  const openApprovalManagement = (event: LudoEvent, e: React.MouseEvent) => {
    e.stopPropagation()
    setApprovalEvent(event)
    setIsApprovalDialogOpen(true)
  }

  const getFilteredEvents = () => {
    let filtered = events.filter((event) => {
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
      if (frequencyFilter !== "all" && event.frequency !== frequencyFilter) return false

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
            return new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
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
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

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
      return `${event.participant_count} Teilnehmer (unbegrenzt)`
    }

    const freeSpots = event.max_participants - event.participant_count
    if (event.participant_count === 1) {
      return `1 Teilnehmer (${freeSpots} Plätze frei)`
    }
    return `${event.participant_count} Teilnehmer (${freeSpots} Plätze frei)`
  }

  const getFrequencyBadge = (frequency: string) => {
    const frequencyMap: { [key: string]: string } = {
      single: "Einmalig",
      regular: "Regelmässig",
      recurring: "Wiederholend",
    }
    return frequencyMap[frequency] || frequency
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-teal-50">
      <Navigation currentPage="ludo-events" />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-handwritten text-4xl md:text-5xl text-gray-800 mb-4">Ludo Events</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Entdecke spannende Ludo-Events in deiner Nähe oder erstelle dein eigenes Event! Verbinde dich mit anderen
            Spielern und erlebe unvergessliche Spieleabende.
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Events durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/80 border-gray-200 focus:border-teal-500"
              />
            </div>

            <div className="flex gap-2">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-handwritten">
                    <Plus className="h-4 w-4 mr-2" />
                    Event erstellen
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
                  <CreateLudoEventForm
                    onSuccess={() => {
                      setIsCreateDialogOpen(false)
                      loadEvents()
                    }}
                    onCancel={() => setIsCreateDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="flex-1 min-w-[150px]">
              <Label className="text-xs text-gray-600 mb-1 block">Sortieren nach</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="newest">Neueste</SelectItem>
                  <SelectItem value="date">Event-Datum</SelectItem>
                  <SelectItem value="participants">Teilnehmer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <Label className="text-xs text-gray-600 mb-1 block">Ort</Label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Orte</SelectItem>
                  <SelectItem value="local">Vor Ort</SelectItem>
                  <SelectItem value="virtual">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <Label className="text-xs text-gray-600 mb-1 block">Häufigkeit</Label>
              <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="single">Einmalig</SelectItem>
                  <SelectItem value="regular">Regelmässig</SelectItem>
                  <SelectItem value="recurring">Wiederholend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <Label className="text-xs text-gray-600 mb-1 block">Verfügbarkeit</Label>
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Events</SelectItem>
                  <SelectItem value="available">Freie Plätze</SelectItem>
                  <SelectItem value="full">Ausgebucht</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setSortBy("all")
                  setLocationFilter("all")
                  setFrequencyFilter("all")
                  setAvailabilityFilter("all")
                }}
                className="h-10 text-sm border-2 border-gray-400 text-gray-600 hover:bg-gray-400 hover:text-white font-handwritten bg-transparent"
              >
                Filter zurücksetzen
              </Button>
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

                  return (
                    <Card
                      key={event.id}
                      onClick={() => showEventDetails(event)}
                      className="group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 cursor-pointer overflow-hidden"
                    >
                      {!event.image_url && (
                        <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
                          <div className="absolute top-2 right-2 z-10">
                            <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-full border border-gray-200">
                              {getFrequencyBadge(event.frequency)}
                            </span>
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
                          <div className="absolute top-2 right-2 z-10">
                            <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-full border border-gray-200">
                              {getFrequencyBadge(event.frequency)}
                            </span>
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
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 text-teal-600" />
                            <span>{formatEventDate(event.event_date, event.start_time)}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4 text-teal-600" />
                            <span>
                              {event.start_time.slice(0, 5)}
                              {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
                            </span>
                          </div>

                          {intervalDisplay && (
                            <div className="flex items-center gap-2 text-sm text-blue-600 ml-8">
                              <Repeat className="h-4 w-4 text-blue-600" />
                              <span>{intervalDisplay}</span>
                            </div>
                          )}

                          {(event.frequency === "regular" || event.frequency === "recurring") &&
                            event.has_additional_dates && (
                              <div
                                className="text-sm text-blue-600 font-medium cursor-pointer hover:text-blue-800 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  showEventDetails(event, "schedule")
                                }}
                              >
                                (Weitere Termine verfügbar)
                              </div>
                            )}

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 text-teal-600" />
                            <span className="truncate">
                              {event.location_type === "virtual"
                                ? "Online Event"
                                : event.location || "Ort wird bekannt gegeben"}
                            </span>
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
                              if (buttonProps.action === "leave") {
                                leaveEvent(event)
                              } else {
                                handleJoinEvent(event)
                              }
                            }}
                            disabled={buttonProps.disabled}
                            variant={buttonProps.variant}
                            className={`flex-1 font-handwritten ${
                              buttonProps.action === "leave"
                                ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-red-500"
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
                              if (user && event.creator_id === user.id) {
                                openEventManagement(event, e)
                              } else {
                                toast.info("Nachrichtenfunktion wird bald verfügbar sein")
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

                {selectedEvent.frequency === "regular" || selectedEvent.frequency === "recurring" ? (
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
                                {formatEventDate(selectedEvent.event_date, selectedEvent.start_time)}
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
                              {getIntervalDisplay(selectedEvent) && (
                                <div className="flex items-center gap-2 text-sm text-blue-600 mt-1">
                                  <Repeat className="h-4 w-4" />
                                  <span>{getIntervalDisplay(selectedEvent)}</span>
                                </div>
                              )}
                            </div>
                          </div>

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
                      </div>
                    )}

                    {detailViewTab === "schedule" && (
                      <div className="space-y-4">
                        <h4 className="text-gray-800 font-semibold">Alle Termine</h4>
                        <div className="space-y-3">
                          {/* Main event date */}
                          <div className="p-3 bg-teal-50 rounded-lg">
                            <div className="flex items-center gap-3 mb-2">
                              <Calendar className="h-5 w-5 text-teal-600" />
                              <div className="font-medium text-gray-800">
                                {formatEventDate(selectedEvent.event_date, selectedEvent.start_time)}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Clock className="h-5 w-5 text-teal-600" />
                              <div className="text-sm text-gray-600">
                                {selectedEvent.start_time.slice(0, 5)}
                                {selectedEvent.end_time && ` - ${selectedEvent.end_time.slice(0, 5)}`}
                              </div>
                            </div>
                          </div>

                          {/* Additional dates */}
                          {additionalDates.map((date, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3 mb-2">
                                <Calendar className="h-5 w-5 text-gray-600" />
                                <div className="font-medium text-gray-800">
                                  {formatEventDate(date.event_date, date.start_time)}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-gray-600" />
                                <div className="text-sm text-gray-600">
                                  {date.start_time.slice(0, 5)}
                                  {date.end_time && ` - ${date.end_time.slice(0, 5)}`}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-teal-600" />
                        <div>
                          <div className="font-medium text-gray-800">
                            {formatEventDate(selectedEvent.event_date, selectedEvent.start_time)}
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
                            <div className="font-medium text-gray-800 mb-1">Spiele</div>
                            <ul className="text-gray-600 space-y-1">
                              {selectedEvent.selected_games.map((game: any, index: number) => (
                                <li key={index} className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
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
                          if (buttonProps.action === "leave") {
                            leaveEvent(selectedEvent)
                          } else {
                            handleJoinEvent(selectedEvent)
                          }
                        }}
                        disabled={buttonProps.disabled}
                        variant={buttonProps.variant}
                        className={`flex-1 font-handwritten ${
                          buttonProps.action === "leave"
                            ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-red-500"
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

                  <Button
                    variant="outline"
                    className="px-4 bg-transparent font-handwritten"
                    onClick={() => {
                      if (user && selectedEvent.creator_id === user.id) {
                        openEventManagement(selectedEvent, {} as React.MouseEvent)
                      } else {
                        toast.info("Nachrichtenfunktion wird bald verfügbar sein")
                      }
                    }}
                  >
                    {user && selectedEvent.creator_id === user.id ? (
                      <Settings className="h-4 w-4" />
                    ) : (
                      <MessageCircle className="h-4 w-4" />
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

        <Dialog open={isDateSelectionOpen} onOpenChange={setIsDateSelectionOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-handwritten text-xl text-gray-800">Termine auswählen</DialogTitle>
              <DialogDescription>Wähle die Termine aus, an denen du teilnehmen möchtest.</DialogDescription>
            </DialogHeader>

            {dateSelectionEvent && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {/* Main event date */}
                  <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="main-date"
                      checked={selectedDates.includes(dateSelectionEvent.event_date)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDates([...selectedDates, dateSelectionEvent.event_date])
                        } else {
                          setSelectedDates(selectedDates.filter((d) => d !== dateSelectionEvent.event_date))
                        }
                      }}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <Calendar className="h-5 w-5 text-teal-600" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">
                        {formatEventDate(dateSelectionEvent.event_date, dateSelectionEvent.start_time)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {dateSelectionEvent.start_time.slice(0, 5)}
                        {dateSelectionEvent.end_time && ` - ${dateSelectionEvent.end_time.slice(0, 5)}`}
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">Haupttermin</span>
                  </div>

                  {/* Additional dates */}
                  {additionalDates.map((date, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        id={`date-${index}`}
                        checked={selectedDates.includes(date.event_date)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDates([...selectedDates, date.event_date])
                          } else {
                            setSelectedDates(selectedDates.filter((d) => d !== date.event_date))
                          }
                        }}
                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <Calendar className="h-5 w-5 text-gray-600" />
                          <div className="font-medium text-gray-800">
                            {formatEventDate(date.event_date, date.start_time)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-8">
                          <Clock className="h-5 w-5 text-gray-600" />
                          <div className="text-sm text-gray-600">
                            {date.start_time.slice(0, 5)}
                            {date.end_time && ` - ${date.end_time.slice(0, 5)}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-sm text-gray-600">
                  {selectedDates.length} von {1 + additionalDates.length} Terminen ausgewählt
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsDateSelectionOpen(false)}
                    className="flex-1 font-handwritten"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedDates.length === 0) {
                        toast.error("Bitte wähle mindestens einen Termin aus")
                        return
                      }

                      if (dateSelectionEvent.approval_mode === "manual") {
                        // Show join dialog for approval
                        setJoinEvent(dateSelectionEvent)
                        setIsDateSelectionOpen(false)
                        setIsJoinDialogOpen(true)
                      } else {
                        // Direct registration
                        processJoinEvent(dateSelectionEvent, "", selectedDates)
                      }
                    }}
                    disabled={selectedDates.length === 0}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-handwritten disabled:from-gray-400 disabled:to-gray-400"
                  >
                    {dateSelectionEvent.approval_mode === "manual" ? "Weiter" : "Anmelden"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
