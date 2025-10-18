"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check, X, Calendar, Clock, MapPin, Mail } from "lucide-react"
import { toast } from "sonner"
import { getUserEventInvitations, respondToEventInvitation } from "@/app/actions/ludo-events"

interface EventInvitation {
  id: string
  status: "pending" | "accepted" | "declined"
  message?: string
  created_at: string
  event_id: string
  inviter_id: string
  ludo_events: {
    id: string
    title: string
    description?: string
    event_date: string
    start_time?: string
    end_time?: string
    location?: string
    image_url?: string
  }
  inviter: {
    id: string
    username?: string
    name?: string
    avatar?: string
  }
}

interface EventInvitationsDialogProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export default function EventInvitationsDialog({ userId, isOpen, onClose, onUpdate }: EventInvitationsDialogProps) {
  const [invitations, setInvitations] = useState<EventInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadInvitations()
    }
  }, [isOpen, userId])

  const loadInvitations = async () => {
    setLoading(true)
    try {
      const result = await getUserEventInvitations(userId)
      if (result.success) {
        const invitationsWithDetails = await Promise.all(
          (result.data || []).map(async (invitation: any) => {
            try {
              const { createClient } = await import("@/lib/supabase/client")
              const supabase = await createClient()

              const { data: fullData, error } = await supabase
                .from("ludo_event_invitations")
                .select(`
                  id,
                  status,
                  message,
                  created_at,
                  event_id,
                  inviter_id,
                  ludo_events!inner (
                    id,
                    title,
                    description,
                    event_date,
                    start_time,
                    end_time,
                    location,
                    image_url
                  ),
                  inviter:inviter_id (
                    id,
                    username,
                    name,
                    avatar
                  )
                `)
                .eq("id", invitation.id)
                .single()

              if (error) {
                console.error("Error loading invitation details:", error)
                return null
              }

              return fullData
            } catch (error) {
              console.error("Error loading invitation:", error)
              return null
            }
          }),
        )

        const validInvitations = invitationsWithDetails.filter(Boolean)
        setInvitations(validInvitations)
      } else {
        toast.error(result.error || "Fehler beim Laden der Einladungen")
      }
    } catch (error) {
      console.error("Error loading invitations:", error)
      toast.error("Fehler beim Laden der Einladungen")
    } finally {
      setLoading(false)
    }
  }

  const handleResponse = async (invitationId: string, response: "accepted" | "declined") => {
    setProcessingId(invitationId)
    try {
      const result = await respondToEventInvitation(invitationId, response, userId)

      if (result.success) {
        toast.success(result.message)
        await loadInvitations()
        onUpdate() // Refresh the main events list
      } else {
        toast.error(result.error || "Fehler beim Antworten auf die Einladung")
      }
    } catch (error) {
      console.error("Error responding to invitation:", error)
      toast.error("Ein unerwarteter Fehler ist aufgetreten")
    } finally {
      setProcessingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatTime = (startTime?: string, endTime?: string) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Event-Einladungen ({invitations.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              <span className="ml-2">Lade Einladungen...</span>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Keine Einladungen</h3>
              <p className="text-gray-500">Du hast derzeit keine ausstehenden Event-Einladungen.</p>
            </div>
          ) : (
            invitations.map((invitation) => (
              <Card key={invitation.id} className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-gray-800 mb-2">{invitation.ludo_events.title}</CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={invitation.inviter.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">
                            {invitation.inviter.username?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-600">
                          Einladung von {invitation.inviter.username || invitation.inviter.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {invitation.ludo_events.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{invitation.ludo_events.description}</p>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>Siehe Event-Details für Termine</span>
                    </div>

                    {formatTime(invitation.ludo_events.start_time, invitation.ludo_events.end_time) && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{formatTime(invitation.ludo_events.start_time, invitation.ludo_events.end_time)}</span>
                      </div>
                    )}

                    {invitation.ludo_events.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{invitation.ludo_events.location}</span>
                      </div>
                    )}
                  </div>

                  {invitation.message && (
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Nachricht:</div>
                      <p className="text-sm text-gray-600">{invitation.message}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      disabled={processingId === invitation.id}
                      onClick={() => handleResponse(invitation.id, "accepted")}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {processingId === invitation.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Annehmen
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={processingId === invitation.id}
                      onClick={() => handleResponse(invitation.id, "declined")}
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Ablehnen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
