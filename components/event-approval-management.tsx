"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X, Clock, Users, MessageSquare, UserCheck, UserX, UserRoundCheck } from "lucide-react"
import { toast } from "sonner"
import { getEventParticipants, updateParticipantStatus } from "@/app/actions/ludo-event-participants"
import { UserLink } from "@/components/user-link"
import { useAvatar } from "@/contexts/avatar-context"

interface Participant {
  id: string
  user_id: string
  status: "pending" | "approved" | "rejected"
  message?: string
  requested_at: string
  approved_at?: string
  users: {
    id: string
    username: string
    name?: string
    avatar?: string
  }
}

interface EventApprovalManagementProps {
  eventId: string
  eventTitle: string
  creatorId: string
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
  approvalMode?: "automatic" | "manual"
}

export default function EventApprovalManagement({
  eventId,
  eventTitle,
  creatorId,
  isOpen,
  onClose,
  onUpdate,
  approvalMode = "manual",
}: EventApprovalManagementProps) {
  const { getAvatar } = useAvatar()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [showMessageDialog, setShowMessageDialog] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadParticipants()
    }
  }, [isOpen, eventId])

  const loadParticipants = async () => {
    setLoading(true)
    try {
      console.log("[v0] Loading participants for event:", eventId)
      const result = await getEventParticipants(eventId)
      console.log("[v0] Participant fetch result:", result)

      if (result.success) {
        console.log("[v0] Participants data:", result.data)
        setParticipants(result.data || [])
      } else {
        console.log("[v0] Error fetching participants:", result.error)
        toast.error(result.error || "Fehler beim Laden der Teilnehmer")
      }
    } catch (error) {
      console.error("Error loading participants:", error)
      toast.error("Fehler beim Laden der Teilnehmer")
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (participantId: string, status: "approved" | "rejected") => {
    setProcessingId(participantId)
    try {
      const result = await updateParticipantStatus(participantId, status, creatorId)

      if (result.success) {
        toast.success(status === "approved" ? "Teilnahme wurde angenommen" : "Teilnahme wurde abgelehnt")
        await loadParticipants()
        onUpdate() // Refresh the main events list
      } else {
        toast.error(result.error || "Fehler beim Aktualisieren des Status")
      }
    } catch (error) {
      console.error("Error updating participant status:", error)
      toast.error("Ein unerwarteter Fehler ist aufgetreten")
    } finally {
      setProcessingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Ausstehend
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="text-green-600 border-green-300">
            <UserCheck className="h-3 w-3 mr-1" />
            Angenommen
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="text-red-600 border-red-300">
            <UserX className="h-3 w-3 mr-1" />
            Abgelehnt
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const pendingParticipants = participants.filter((p) => p.status === "pending")
  const approvedParticipants = participants.filter((p) => p.status === "approved")
  const rejectedParticipants = participants.filter((p) => p.status === "rejected")

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teilnehmer verwalten - {eventTitle}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                <span className="ml-2">Lade Teilnehmer...</span>
              </div>
            ) : (
              <>
                {approvalMode === "automatic" ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <UserCheck className="h-5 w-5 text-teal-600" />
                      <h3 className="text-lg font-semibold">Teilnehmer ({approvedParticipants.length})</h3>
                    </div>
                    {approvedParticipants.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {approvedParticipants.map((participant) => (
                          <Card key={participant.id} className="border-green-200 bg-green-50/50">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={
                                      getAvatar(participant.users.id, participant.users.username) || "/placeholder.svg"
                                    }
                                  />
                                  <AvatarFallback className="text-xs">
                                    {participant.users.username?.[0]?.toUpperCase() || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <UserLink userId={participant.users.id} className="font-medium text-gray-800 text-sm">
                                    {participant.users.username || participant.users.name || "Unbekannter Benutzer"}
                                  </UserLink>
                                  <div className="text-xs text-gray-600">
                                    {participant.approved_at
                                      ? `Beigetreten am ${formatDate(participant.approved_at)}`
                                      : "Teilnehmer"}
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-green-600 border-green-300">
                                  <UserRoundCheck className="h-3 w-3 mr-1" />
                                  Teilnehmer
                                </Badge>
                              </div>
                              {participant.message && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedParticipant(participant)
                                    setShowMessageDialog(true)
                                  }}
                                  className="mt-2 text-xs"
                                >
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  Nachricht anzeigen
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">Keine Teilnehmer</h3>
                        <p className="text-gray-500">Noch niemand ist diesem Event beigetreten.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="pending" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Ausstehende Anfragen ({pendingParticipants.length})
                      </TabsTrigger>
                      <TabsTrigger value="approved" className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Teilnehmer ({approvedParticipants.length})
                      </TabsTrigger>
                      <TabsTrigger value="rejected" className="flex items-center gap-2">
                        <UserX className="h-4 w-4" />
                        Abgelehnte Anfragen ({rejectedParticipants.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending" className="space-y-4">
                      {pendingParticipants.length > 0 ? (
                        <div className="space-y-3">
                          {pendingParticipants.map((participant) => (
                            <Card key={participant.id} className="border-yellow-200 bg-yellow-50/50">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage
                                        src={
                                          getAvatar(participant.users.id, participant.users.username) ||
                                          "/placeholder.svg"
                                        }
                                      />
                                      <AvatarFallback>
                                        {participant.users.username?.[0]?.toUpperCase() || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <UserLink userId={participant.users.id} className="font-medium text-gray-800">
                                          {participant.users.username ||
                                            participant.users.name ||
                                            "Unbekannter Benutzer"}
                                        </UserLink>
                                        {getStatusBadge(participant.status)}
                                      </div>
                                      <div className="text-sm text-gray-600 mb-2">
                                        Angefragt am {formatDate(participant.requested_at)}
                                      </div>
                                      {participant.message && (
                                        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
                                          <div className="flex items-center gap-2 mb-2">
                                            <MessageSquare className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm font-medium text-gray-700">Nachricht:</span>
                                          </div>
                                          <p className="text-sm text-gray-600">{participant.message}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 ml-4">
                                    <Button
                                      size="sm"
                                      disabled={processingId === participant.id}
                                      onClick={() => handleApproval(participant.id, "approved")}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      {processingId === participant.id ? (
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
                                      disabled={processingId === participant.id}
                                      onClick={() => handleApproval(participant.id, "rejected")}
                                      className="border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Ablehnen
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-600 mb-2">Keine ausstehenden Anfragen</h3>
                          <p className="text-gray-500">Alle Anfragen wurden bereits bearbeitet.</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="approved" className="space-y-4">
                      {approvedParticipants.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {approvedParticipants.map((participant) => (
                            <Card key={participant.id} className="border-green-200 bg-green-50/50">
                              <CardContent className="p-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage
                                      src={
                                        getAvatar(participant.users.id, participant.users.username) ||
                                        "/placeholder.svg"
                                      }
                                    />
                                    <AvatarFallback className="text-xs">
                                      {participant.users.username?.[0]?.toUpperCase() || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <UserLink
                                      userId={participant.users.id}
                                      className="font-medium text-gray-800 text-sm"
                                    >
                                      {participant.users.username || participant.users.name || "Unbekannter Benutzer"}
                                    </UserLink>
                                    <div className="text-xs text-gray-600">
                                      {participant.approved_at
                                        ? `Angenommen am ${formatDate(participant.approved_at)}`
                                        : "Angenommen"}
                                    </div>
                                  </div>
                                  {getStatusBadge(participant.status)}
                                </div>
                                {participant.message && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedParticipant(participant)
                                      setShowMessageDialog(true)
                                    }}
                                    className="mt-2 text-xs"
                                  >
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    Nachricht anzeigen
                                  </Button>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <UserCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-600 mb-2">Keine Teilnehmer</h3>
                          <p className="text-gray-500">Noch keine Teilnahme wurden angenommen.</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="rejected" className="space-y-4">
                      {rejectedParticipants.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {rejectedParticipants.map((participant) => (
                            <Card key={participant.id} className="border-red-200 bg-red-50/50">
                              <CardContent className="p-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage
                                      src={
                                        getAvatar(participant.users.id, participant.users.username) ||
                                        "/placeholder.svg"
                                      }
                                    />
                                    <AvatarFallback className="text-xs">
                                      {participant.users.username?.[0]?.toUpperCase() || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <UserLink
                                      userId={participant.users.id}
                                      className="font-medium text-gray-800 text-sm"
                                    >
                                      {participant.users.username || participant.users.name || "Unbekannter Benutzer"}
                                    </UserLink>
                                    <div className="text-xs text-gray-600">
                                      {participant.approved_at
                                        ? `Abgelehnt am ${formatDate(participant.approved_at)}`
                                        : "Abgelehnt"}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getStatusBadge(participant.status)}
                                    <Button
                                      size="sm"
                                      disabled={processingId === participant.id}
                                      onClick={() => handleApproval(participant.id, "approved")}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      {processingId === participant.id ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                      ) : (
                                        <>
                                          <Check className="h-3 w-3 mr-1" />
                                          Akzeptieren
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                                {participant.message && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedParticipant(participant)
                                      setShowMessageDialog(true)
                                    }}
                                    className="mt-2 text-xs"
                                  >
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    Nachricht anzeigen
                                  </Button>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <UserX className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-600 mb-2">Keine abgelehnten Anfragen</h3>
                          <p className="text-gray-500">Bisher wurden keine Anfragen abgelehnt.</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}

                {participants.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Keine Teilnehmeranfragen</h3>
                    <p className="text-gray-500">Bisher hat noch niemand eine Anfrage für dieses Event gestellt.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedParticipant && (
        <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Nachricht von
                <UserLink userId={selectedParticipant.users.id}>
                  {selectedParticipant.users.username || selectedParticipant.users.name || "Unbekannter Benutzer"}
                </UserLink>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={
                      getAvatar(selectedParticipant.users.id, selectedParticipant.users.username) || "/placeholder.svg"
                    }
                  />
                  <AvatarFallback>{selectedParticipant.users.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <UserLink userId={selectedParticipant.users.id} className="font-medium text-gray-800">
                    {selectedParticipant.users.username || selectedParticipant.users.name || "Unbekannter Benutzer"}
                  </UserLink>
                  <div className="text-sm text-gray-600">{formatDate(selectedParticipant.requested_at)}</div>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700">{selectedParticipant.message}</p>
              </div>
              <Button onClick={() => setShowMessageDialog(false)} className="w-full">
                Schließen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
