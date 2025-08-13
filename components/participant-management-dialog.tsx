"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CheckCircle, XCircle, UserMinus, Clock, Users } from "lucide-react"
import { manageEventParticipant } from "@/app/actions/community-events"
import { toast } from "@/components/ui/use-toast"

interface Participant {
  id: string
  user_id: string
  status: "pending" | "joined" | "declined"
  user: {
    name: string
  }
  selected_time_slot?: number
}

interface ParticipantManagementDialogProps {
  children: React.ReactNode
  eventId: string
  participants: Participant[]
  eventTitle: string
  timeSlots?: Array<{ date: string; timeFrom: string; timeTo: string }>
}

export default function ParticipantManagementDialog({
  children,
  eventId,
  participants,
  eventTitle,
  timeSlots,
}: ParticipantManagementDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  const formatTime = (timeString: string | null): string => {
    if (!timeString) return ""
    return timeString.split(":").slice(0, 2).join(":")
  }

  const getTimeSlotText = (timeSlotIndex?: number) => {
    if (timeSlotIndex === undefined || !timeSlots || !timeSlots[timeSlotIndex]) {
      return null
    }
    const slot = timeSlots[timeSlotIndex]
    const date = new Date(slot.date).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
    })
    const time = slot.timeFrom && slot.timeTo ? `${formatTime(slot.timeFrom)} - ${formatTime(slot.timeTo)}` : ""
    return `${date}${time ? `, ${time}` : ""}`
  }

  const handleParticipantAction = async (userId: string, action: "approve" | "reject" | "remove") => {
    setLoading(userId)
    try {
      const result = await manageEventParticipant(eventId, userId, action)

      if (result.success) {
        toast({
          title: "Erfolgreich",
          description: result.message,
        })
        // The page will be revalidated by the server action
      } else {
        toast({
          title: "Fehler",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error managing participant:", error)
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const pendingParticipants = participants.filter((p) => p.status === "pending")
  const joinedParticipants = participants.filter((p) => p.status === "joined")
  const declinedParticipants = participants.filter((p) => p.status === "declined")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-handwritten text-xl text-gray-800 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Teilnehmerverwaltung: {eventTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pending Participants */}
          {pendingParticipants.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-orange-500" />
                Wartende Anfragen ({pendingParticipants.length})
              </h3>
              <div className="space-y-3">
                {pendingParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 text-sm">{participant.user.name}</div>
                      {getTimeSlotText(participant.selected_time_slot) && (
                        <div className="text-xs text-gray-600 mt-1">
                          Gewählter Termin: {getTimeSlotText(participant.selected_time_slot)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleParticipantAction(participant.user_id, "approve")}
                        disabled={loading === participant.user_id}
                        className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Genehmigen
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleParticipantAction(participant.user_id, "reject")}
                        disabled={loading === participant.user_id}
                        className="text-red-600 border-red-200 hover:bg-red-50 text-xs px-3 py-1"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Ablehnen
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Joined Participants */}
          {joinedParticipants.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Bestätigte Teilnehmer ({joinedParticipants.length})
              </h3>
              <div className="space-y-2">
                {joinedParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 text-sm">{participant.user.name}</div>
                      {getTimeSlotText(participant.selected_time_slot) && (
                        <div className="text-xs text-gray-600 mt-1">
                          Gewählter Termin: {getTimeSlotText(participant.selected_time_slot)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Dabei</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleParticipantAction(participant.user_id, "remove")}
                        disabled={loading === participant.user_id}
                        className="text-red-600 border-red-200 hover:bg-red-50 text-xs px-2 py-1"
                      >
                        <UserMinus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Declined Participants */}
          {declinedParticipants.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <XCircle className="w-4 h-4 mr-2 text-red-500" />
                Abgelehnte Anfragen ({declinedParticipants.length})
              </h3>
              <div className="space-y-2">
                {declinedParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 text-sm">{participant.user.name}</div>
                      {getTimeSlotText(participant.selected_time_slot) && (
                        <div className="text-xs text-gray-600 mt-1">
                          Gewählter Termin: {getTimeSlotText(participant.selected_time_slot)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="border-red-200 text-red-600 text-xs">
                        Abgelehnt
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => handleParticipantAction(participant.user_id, "approve")}
                        disabled={loading === participant.user_id}
                        className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {participants.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Noch keine Teilnahmeanfragen vorhanden.</p>
            </div>
          )}
        </div>

        <div className="h-px bg-border w-full" />

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)} size="sm">
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
