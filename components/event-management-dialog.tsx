"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import {
  Settings,
  Users,
  MessageSquare,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  UserMinus,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"
import {
  manageEventParticipant,
  addEventComment,
  getEventComments,
  deleteCommunityEvent,
} from "@/app/actions/community-events"

interface EventManagementDialogProps {
  event: any
  isOpen: boolean
  onClose: () => void
  onEventUpdated: () => void
  onEventDeleted: () => void
  isCreator: boolean
}

interface Comment {
  id: string
  comment: string
  created_at: string
  user: {
    name: string
    username: string
  }
}

export default function EventManagementDialog({
  event,
  isOpen,
  onClose,
  onEventUpdated,
  onEventDeleted,
  isCreator,
}: EventManagementDialogProps) {
  const [activeTab, setActiveTab] = useState("participants")
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [participantActions, setParticipantActions] = useState<{ [key: string]: boolean }>({})

  // Load comments when dialog opens
  useEffect(() => {
    if (isOpen && event) {
      loadComments()
    }
  }, [isOpen, event])

  const loadComments = async () => {
    const result = await getEventComments(event.id)
    if (result.success) {
      setComments(result.data)
    }
  }

  const handleParticipantAction = async (userId: string, action: "approve" | "reject" | "remove") => {
    setParticipantActions((prev) => ({ ...prev, [userId]: true }))

    const result = await manageEventParticipant(event.id, userId, action)

    if (result.success) {
      onEventUpdated()
    } else {
      alert(result.error)
    }

    setParticipantActions((prev) => ({ ...prev, [userId]: false }))
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setIsSubmittingComment(true)

    const result = await addEventComment(event.id, newComment)

    if (result.success) {
      setNewComment("")
      loadComments()
    } else {
      alert(result.error)
    }

    setIsSubmittingComment(false)
  }

  const handleDeleteEvent = async () => {
    if (
      !confirm(
        "Bist du sicher, dass du dieses Event löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.",
      )
    ) {
      return
    }

    setIsDeleting(true)

    const result = await deleteCommunityEvent(event.id)

    if (result.success) {
      onEventDeleted()
      onClose()
    } else {
      alert(result.error)
    }

    setIsDeleting(false)
  }

  const getParticipantStatusBadge = (status: string) => {
    switch (status) {
      case "joined":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Teilnimmt
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Wartend
          </Badge>
        )
      case "declined":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Abgelehnt
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Unbekannt
          </Badge>
        )
    }
  }

  const pendingParticipants = event?.participants?.filter((p: any) => p.status === "pending") || []
  const approvedParticipants = event?.participants?.filter((p: any) => p.status === "joined") || []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-handwritten text-2xl text-gray-800 flex items-center">
            <Settings className="w-6 h-6 mr-2" />
            Event verwalten: {event?.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="participants" className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              Teilnehmer ({event?.participants?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-1" />
              Kommentare ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center">
              <Settings className="w-4 h-4 mr-1" />
              Einstellungen
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[60vh] mt-4">
            <TabsContent value="participants" className="space-y-4">
              {/* Pending Participants */}
              {pendingParticipants.length > 0 && (
                <div>
                  <h3 className="font-handwritten text-lg text-gray-800 mb-3">
                    Wartende Anfragen ({pendingParticipants.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingParticipants.map((participant: any) => (
                      <Card key={participant.id} className="border-yellow-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-800 font-bold">
                                {participant.user?.name?.[0]?.toUpperCase() || "?"}
                              </div>
                              <div>
                                <p className="font-body text-gray-800">
                                  {participant.user?.username || participant.user?.name || "Unbekannt"}
                                </p>
                                <p className="text-sm text-gray-500 font-body">
                                  Angefragt am {new Date(participant.joined_at).toLocaleDateString("de-DE")}
                                </p>
                              </div>
                            </div>
                            {isCreator && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleParticipantAction(participant.user_id, "approve")}
                                  disabled={participantActions[participant.user_id]}
                                  className="bg-green-500 hover:bg-green-600 text-white"
                                >
                                  <UserCheck className="w-4 h-4 mr-1" />
                                  Genehmigen
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleParticipantAction(participant.user_id, "reject")}
                                  disabled={participantActions[participant.user_id]}
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  <UserX className="w-4 h-4 mr-1" />
                                  Ablehnen
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Approved Participants */}
              {approvedParticipants.length > 0 && (
                <div>
                  <h3 className="font-handwritten text-lg text-gray-800 mb-3">
                    Teilnehmer ({approvedParticipants.length})
                  </h3>
                  <div className="space-y-2">
                    {approvedParticipants.map((participant: any) => (
                      <Card key={participant.id} className="border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-800 font-bold">
                                {participant.user?.name?.[0]?.toUpperCase() || "?"}
                              </div>
                              <div>
                                <p className="font-body text-gray-800">
                                  {participant.user?.username || participant.user?.name || "Unbekannt"}
                                </p>
                                <p className="text-sm text-gray-500 font-body">
                                  Beigetreten am {new Date(participant.joined_at).toLocaleDateString("de-DE")}
                                </p>
                              </div>
                            </div>
                            {isCreator && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleParticipantAction(participant.user_id, "remove")}
                                disabled={participantActions[participant.user_id]}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <UserMinus className="w-4 h-4 mr-1" />
                                Entfernen
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {event?.participants?.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-body">Noch keine Teilnehmer</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="comments" className="space-y-4">
              {/* Add Comment */}
              <div className="space-y-3">
                <Label className="font-body text-gray-700">Neuer Kommentar</Label>
                <Textarea
                  placeholder="Schreibe einen Kommentar zum Event..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] border-2 border-gray-200 focus:border-purple-400 font-body"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="bg-purple-500 hover:bg-purple-600 text-white font-handwritten"
                >
                  {isSubmittingComment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Wird gesendet...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Kommentar hinzufügen
                    </>
                  )}
                </Button>
              </div>

              {/* Comments List */}
              {comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <Card key={comment.id} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-800 font-bold text-sm">
                            {comment.user?.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="font-body text-gray-800 font-medium">
                                {comment.user?.username || comment.user?.name || "Unbekannt"}
                              </p>
                              <p className="text-xs text-gray-500 font-body">
                                {new Date(comment.created_at).toLocaleDateString("de-DE", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            <p className="text-gray-700 font-body">{comment.comment}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-body">Noch keine Kommentare</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              {isCreator ? (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h3 className="font-handwritten text-lg text-blue-800 mb-2">Event bearbeiten</h3>
                    <p className="text-sm text-blue-700 font-body mb-3">
                      Bearbeite die Details deines Events oder ändere die Einstellungen.
                    </p>
                    <Button
                      variant="outline"
                      className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
                      onClick={() => {
                        // TODO: Open edit dialog
                        alert("Event-Bearbeitung wird in einem zukünftigen Update verfügbar sein")
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Event bearbeiten
                    </Button>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <h3 className="font-handwritten text-lg text-red-800 mb-2">Gefährliche Aktionen</h3>
                    <p className="text-sm text-red-700 font-body mb-3">
                      Das Löschen des Events kann nicht rückgängig gemacht werden. Alle Teilnehmer werden
                      benachrichtigt.
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleDeleteEvent}
                      disabled={isDeleting}
                      className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                    >
                      {isDeleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                          Wird gelöscht...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Event löschen
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-body">Nur der Event-Ersteller kann Einstellungen verwalten</p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
