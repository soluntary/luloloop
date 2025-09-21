"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, Users, Settings, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { getEventParticipants, approveParticipant, rejectParticipant, deleteLudoEvent } from "@/app/actions/ludo-events"

interface Participant {
  id: string
  user_id: string
  status: string
  registered_at: string
  user: {
    id: string
    username: string
    name: string
    avatar: string
  }
}

interface LudoEventManagementDialogProps {
  eventId: string
  eventTitle: string
  isCreator: boolean
  isOpen: boolean
  onClose: () => void
  onEventDeleted?: () => void
}

export default function LudoEventManagementDialog({
  eventId,
  eventTitle,
  isCreator,
  isOpen,
  onClose,
  onEventDeleted,
}: LudoEventManagementDialogProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && eventId) {
      loadParticipants()
    }
  }, [isOpen, eventId])

  const loadParticipants = async () => {
    setLoading(true)
    try {
      const result = await getEventParticipants(eventId)
      if (result.success) {
        setParticipants(result.data || [])
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error("Fehler beim Laden der Teilnehmer")
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (participantId: string) => {
    setActionLoading(participantId)
    try {
      const result = await approveParticipant(eventId, participantId, "")
      if (result.success) {
        toast.success(result.message)
        loadParticipants()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error("Fehler beim Bestätigen")
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (participantId: string) => {
    setActionLoading(participantId)
    try {
      const result = await rejectParticipant(eventId, participantId, "")
      if (result.success) {
        toast.success(result.message)
        loadParticipants()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error("Fehler beim Ablehnen")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteEvent = async () => {
    if (!confirm("Möchtest du dieses Event wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) {
      return
    }

    setActionLoading("delete")
    try {
      const result = await deleteLudoEvent(eventId, "")
      if (result.success) {
        toast.success("Event erfolgreich gelöscht")
        onEventDeleted?.()
        onClose()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error("Fehler beim Löschen des Events")
    } finally {
      setActionLoading(null)
    }
  }

  const registeredParticipants = participants.filter((p) => p.status === "registered")
  const pendingParticipants = participants.filter((p) => p.status === "pending")

  if (!isCreator) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Event verwalten: {eventTitle}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="participants" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="participants" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Teilnehmer ({registeredParticipants.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Einstellungen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="participants" className="space-y-6">
            {/* Pending Approvals */}
            {pendingParticipants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                      {pendingParticipants.length}
                    </Badge>
                    Wartende Anmeldungen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingParticipants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={participant.user.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {participant.user.username?.[0]?.toUpperCase() || participant.user.name?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{participant.user.username || participant.user.name}</p>
                          <p className="text-sm text-gray-500">
                            Angemeldet am {new Date(participant.registered_at).toLocaleDateString("de-DE")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(participant.id)}
                          disabled={actionLoading === participant.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(participant.id)}
                          disabled={actionLoading === participant.id}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Registered Participants */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                    {registeredParticipants.length}
                  </Badge>
                  Bestätigte Teilnehmer
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : registeredParticipants.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Noch keine bestätigten Teilnehmer</p>
                ) : (
                  <div className="space-y-3">
                    {registeredParticipants.map((participant) => (
                      <div key={participant.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <Avatar>
                          <AvatarImage src={participant.user.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {participant.user.username?.[0]?.toUpperCase() || participant.user.name?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{participant.user.username || participant.user.name}</p>
                          <p className="text-sm text-gray-500">
                            Angemeldet am {new Date(participant.registered_at).toLocaleDateString("de-DE")}
                          </p>
                        </div>
                        <Badge className="bg-green-600 text-white">Bestätigt</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-red-600">Gefahrenzone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2">Event löschen</h4>
                  <p className="text-sm text-red-600 mb-4">
                    Das Event wird permanent gelöscht und alle Anmeldungen werden entfernt. Diese Aktion kann nicht
                    rückgängig gemacht werden.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteEvent}
                    disabled={actionLoading === "delete"}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {actionLoading === "delete" ? "Lösche..." : "Event löschen"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
