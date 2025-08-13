"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, MapPin, Users, Dices, CheckCircle, UserCheck, Edit, Trash2, Settings } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { joinCommunityEvent, joinEventTimeSlot, deleteCommunityEvent, leaveEvent } from "@/app/actions/community-events"
import { toast } from "@/components/ui/use-toast"
// Added import for ParticipantManagementDialog
import ParticipantManagementDialog from "@/components/participant-management-dialog"

interface CommunityEvent {
  id: string
  creator_id: string
  title: string
  description: string | null
  frequency: "einmalig" | "regelmäßig"
  fixed_date: string | null
  fixed_time_from: string | null
  fixed_time_to: string | null
  location: string
  max_participants: number | null
  visibility: "public" | "friends"
  approval_mode: "automatic" | "manual"
  rules: string | null
  additional_info: string | null
  image_url: string | null
  selected_games: any
  custom_games: string[]
  selected_friends: string[]
  time_slots: any
  use_time_slots: boolean
  active: boolean
  created_at: string
  updated_at: string
  creator?: {
    name: string
    email: string
  }
  participants?: Array<{
    id: string
    user_id: string
    status: string
    user: {
      name: string
    }
  }>
}

interface EventDetailsDialogProps {
  children: React.ReactNode
  event: CommunityEvent
}

export default function EventDetailsDialog({ children, event }: EventDetailsDialogProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const formatTime = (timeString: string | null): string => {
    if (!timeString) return ""
    // Remove seconds if present (e.g., "14:30:00" -> "14:30")
    return timeString.split(":").slice(0, 2).join(":")
  }

  const formatEventDate = (event: CommunityEvent) => {
    if (event.frequency === "regelmäßig" && event.use_time_slots && event.time_slots && event.time_slots.length > 0) {
      return `${event.time_slots.length} Termine verfügbar`
    } else if (event.frequency === "einmalig" && event.fixed_date) {
      const date = new Date(event.fixed_date)
      const dateStr = date.toLocaleDateString("de-DE", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })

      if (event.fixed_time_from && event.fixed_time_to) {
        return `${dateStr}, ${formatTime(event.fixed_time_from)} - ${formatTime(event.fixed_time_to)}`
      } else if (event.fixed_time_from) {
        return `${dateStr}, ab ${formatTime(event.fixed_time_from)}`
      } else {
        return dateStr
      }
    }
    return "Termin wird noch bekannt gegeben"
  }

  const isEventCreator = () => {
    return user && event.creator_id === user.id
  }

  const isEventParticipant = () => {
    return user && event.participants?.some((p) => p.user_id === user.id && p.status === "joined")
  }

  const handleJoinTimeSlot = async (timeSlotIndex: number) => {
    if (!user) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Sie müssen angemeldet sein, um an Events teilzunehmen.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const result = await joinEventTimeSlot(event.id, timeSlotIndex)

      if (result.success) {
        toast({
          title: "Erfolgreich beigetreten!",
          description: result.message,
        })
        setOpen(false)
      } else {
        toast({
          title: "Fehler beim Beitreten",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error joining time slot:", error)
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleJoinEvent = async () => {
    if (!user) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Sie müssen angemeldet sein, um an Events teilzunehmen.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const result = await joinCommunityEvent(event.id)

      if (result.success) {
        toast({
          title: "Erfolgreich beigetreten!",
          description: result.message,
        })
        setOpen(false)
      } else {
        toast({
          title: "Fehler beim Beitreten",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error joining event:", error)
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!user || !isEventCreator()) return

    if (!confirm("Möchten Sie dieses Event wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) {
      return
    }

    setLoading(true)
    try {
      const result = await deleteCommunityEvent(event.id)

      if (result.success) {
        toast({
          title: "Event gelöscht",
          description: result.message,
        })
        setOpen(false)
      } else {
        toast({
          title: "Fehler beim Löschen",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveEvent = async () => {
    if (!user) return

    if (!confirm("Möchten Sie dieses Event wirklich verlassen?")) {
      return
    }

    setLoading(true)
    try {
      const result = await leaveEvent(event.id)

      if (result.success) {
        toast({
          title: "Event verlassen",
          description: result.message,
        })
        setOpen(false)
      } else {
        toast({
          title: "Fehler beim Verlassen",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error leaving event:", error)
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-handwritten text-2xl text-gray-800">{event.title}</DialogTitle>
            {isEventCreator() && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Bearbeitung",
                      description: "Event-Bearbeitung wird bald verfügbar sein.",
                    })
                  }}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Bearbeiten
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteEvent}
                  disabled={loading}
                  className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Löschen
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{formatEventDate(event)}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {event.image_url ? (
            <img
              src={event.image_url || "/placeholder.svg"}
              alt={event.title}
              className="w-full h-40 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-40 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-lg flex items-center justify-center">
              <Dices className="w-12 h-12 text-white" />
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span>
                  {event.participants?.length || 0}
                  {event.max_participants ? `/${event.max_participants}` : ""} Teilnehmer
                </span>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Badge variant="outline" className="border-blue-200 text-blue-600 text-xs">
                {event.frequency === "einmalig" ? "Einmalig" : "Regelmäßig"}
              </Badge>
              <Badge variant="outline" className="border-purple-200 text-purple-600 text-xs">
                {event.approval_mode === "automatic" ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Sofortbeitritt
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3 h-3 mr-1" />
                    Beitritt erst nach Bestätigung
                  </>
                )}
              </Badge>
            </div>
          </div>

          {((event.selected_games && event.selected_games.length > 0) ||
            (event.custom_games && event.custom_games.length > 0)) && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Was gespielt wird </h3>
              <div className="flex flex-wrap gap-2">
                {event.selected_games?.map((game: string, index: number) => (
                  <Badge key={`selected-${index}`} variant="secondary" className="bg-purple-100 text-purple-700">
                    <Dices className="w-3 h-3 mr-1" />
                    {game}
                  </Badge>
                ))}
                {event.custom_games?.map((game: string, index: number) => (
                  <Badge key={`custom-${index}`} variant="outline" className="border-gray-300 text-gray-600">
                    {game}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {event.description && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Beschreibung</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{event.description}</p>
            </div>
          )}

          {event.use_time_slots && event.time_slots && event.time_slots.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Termine</h3>
              <div className="space-y-2">
                {event.time_slots.map((slot: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="font-medium text-gray-800 text-sm">
                          {new Date(slot.date).toLocaleDateString("de-DE", {
                            weekday: "short",
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </div>
                        {slot.timeFrom && slot.timeTo && (
                          <div className="text-xs text-gray-600">
                            {formatTime(slot.timeFrom)} - {formatTime(slot.timeTo)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{slot.votes || 0}</span>
                      {user && !isEventCreator() && (
                        <Button
                          size="sm"
                          onClick={() => handleJoinTimeSlot(index)}
                          disabled={loading}
                          className="bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-500 hover:to-indigo-500 text-white text-xs px-3 py-1"
                        >
                          {loading ? "..." : "Beitreten"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(event.rules || event.additional_info) && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Weitere Informationen</h3>
              <div className="space-y-2 text-sm text-gray-600">
                {event.rules && <div>{event.rules}</div>}
                {event.additional_info && <div>{event.additional_info}</div>}
              </div>
            </div>
          )}

          {event.participants && event.participants.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Teilnehmer ({event.participants.length})</h3>
              <div className="flex flex-wrap gap-2">
                {event.participants.map((participant) => (
                  <Badge key={participant.id} variant="outline" className="text-xs">
                    {participant.user.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-border w-full" />

        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {isEventCreator() && event.participants && event.participants.length > 0 && (
              // Replaced placeholder button with actual ParticipantManagementDialog
              <ParticipantManagementDialog
                eventId={event.id}
                participants={event.participants}
                eventTitle={event.title}
                timeSlots={event.time_slots}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="text-purple-600 border-purple-200 hover:bg-purple-50 bg-transparent"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Teilnehmer verwalten
                </Button>
              </ParticipantManagementDialog>
            )}
            {isEventParticipant() && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLeaveEvent}
                disabled={loading}
                className="text-orange-600 border-orange-200 hover:bg-orange-50 bg-transparent"
              >
                Event verlassen
              </Button>
            )}
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)} size="sm">
              Schließen
            </Button>
            {user && !isEventCreator() && !isEventParticipant() && !event.use_time_slots && (
              <Button
                onClick={handleJoinEvent}
                disabled={loading}
                size="sm"
                className="bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-500 hover:to-indigo-500 text-white"
              >
                {loading ? "Trete bei..." : "Event beitreten"}
              </Button>
            )}
            {isEventParticipant() && (
              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Bereits beigetreten
              </Badge>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
