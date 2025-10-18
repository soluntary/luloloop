"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, Users, Settings, Trash2, Calendar, Clock, UserMinus } from "lucide-react"
import { toast } from "sonner"
import { deleteLudoEvent } from "@/app/actions/ludo-events"
import { createClient } from "@/lib/supabase/client"

interface Participant {
  id: string
  user_id: string
  status: string
  joined_at: string
  user: {
    id: string
    username: string
    name: string
    avatar: string
  }
}

interface InstanceParticipant {
  id: string
  instance_id: string
  user_id: string
  status: string
  joined_at: string
  instance: {
    id: string
    instance_date: string
    start_time: string
    end_time: string
  }
  user: {
    id: string
    username: string
    name: string
    avatar: string
  }
}

interface JoinRequest {
  id: string
  user_id: string
  message: string | null
  status: string
  created_at: string
  user: {
    id: string
    username: string
    name: string
    avatar: string
  }
}

interface LudoEventManagementDialogProps {
  event: {
    id: string
    title: string
    creator_id: string
    approval_mode?: "automatic" | "manual"
  }
  isOpen: boolean
  onClose: () => void
}

export function LudoEventManagementDialog({ event, isOpen, onClose }: LudoEventManagementDialogProps) {
  const [instanceParticipants, setInstanceParticipants] = useState<InstanceParticipant[]>([])
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const supabase = createClient()

  console.log("[v0] Event approval_mode value:", event.approval_mode)
  console.log("[v0] Event approval_mode type:", typeof event.approval_mode)

  const showRequestsTab = event.approval_mode === "manual"
  console.log("[v0] Show requests tab:", showRequestsTab)

  useEffect(() => {
    if (isOpen && event?.id) {
      console.log("[v0] Management dialog opened for event:", event.id)
      console.log("[v0] Event title:", event.title)
      console.log("[v0] Event approval_mode in useEffect:", event.approval_mode)
      loadParticipantsAndRequests()
    }
  }, [isOpen, event?.id])

  const loadParticipantsAndRequests = async () => {
    console.log("[v0] Starting to load participants and requests...")
    setLoading(true)
    try {
      console.log("[v0] Fetching instances for event:", event.id)
      const { data: instances, error: instancesError } = await supabase
        .from("ludo_event_instances")
        .select("id")
        .eq("event_id", event.id)

      if (instancesError) {
        console.error("[v0] Error loading instances:", instancesError)
        toast.error("Fehler beim Laden der Instanzen")
        setLoading(false)
        return
      }

      console.log("[v0] Found instances:", instances?.length || 0, instances)
      const instanceIds = (instances || []).map((i) => i.id)

      if (instanceIds.length > 0) {
        console.log("[v0] Fetching participants for instance IDs:", instanceIds)
        const { data: instanceData, error: instanceError } = await supabase
          .from("ludo_event_instance_participants")
          .select(`
            id,
            instance_id,
            user_id,
            status,
            joined_at,
            instance:ludo_event_instances(
              id,
              instance_date,
              start_time,
              end_time
            ),
            user:users(
              id,
              username,
              name,
              avatar
            )
          `)
          .in("instance_id", instanceIds)
          .order("joined_at", { ascending: false })

        if (instanceError) {
          console.error("[v0] Error loading instance participants:", instanceError)
          toast.error("Fehler beim Laden der Teilnehmer")
        } else {
          console.log("[v0] Loaded instance participants:", instanceData?.length || 0, instanceData)
          setInstanceParticipants(instanceData || [])
        }
      } else {
        console.log("[v0] No instances found, setting empty participants")
        setInstanceParticipants([])
      }

      if (showRequestsTab) {
        console.log("[v0] Fetching join requests for event:", event.id)
        const { data: requestsData, error: requestsError } = await supabase
          .from("ludo_event_join_requests")
          .select(`
            id,
            user_id,
            message,
            status,
            created_at,
            user:users!ludo_event_join_requests_user_id_fkey(
              id,
              username,
              name,
              avatar
            )
          `)
          .eq("event_id", event.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })

        if (requestsError) {
          console.error("[v0] Error loading join requests:", requestsError)
        } else {
          console.log("[v0] Loaded join requests:", requestsData?.length || 0, requestsData)
          setJoinRequests(requestsData || [])
        }
      } else {
        console.log("[v0] Skipping join requests load - approval_mode is not manual")
      }
    } catch (error) {
      console.error("[v0] Error in loadParticipantsAndRequests:", error)
      toast.error("Fehler beim Laden der Daten")
    } finally {
      setLoading(false)
      console.log("[v0] Finished loading participants and requests")
    }
  }

  const handleApproveRequest = async (requestId: string, userId: string) => {
    setActionLoading(requestId)
    try {
      const { error: updateError } = await supabase
        .from("ludo_event_join_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId)

      if (updateError) throw updateError

      const { data: pendingInstances, error: fetchError } = await supabase
        .from("ludo_event_instance_participants")
        .select("id, instance_id")
        .eq("user_id", userId)
        .eq("status", "pending")
        .in(
          "instance_id",
          await supabase
            .from("ludo_event_instances")
            .select("id")
            .eq("event_id", event.id)
            .then((res) => (res.data || []).map((i) => i.id)),
        )

      if (fetchError) throw fetchError

      if (pendingInstances && pendingInstances.length > 0) {
        const { error: approveError } = await supabase
          .from("ludo_event_instance_participants")
          .update({ status: "registered" })
          .in(
            "id",
            pendingInstances.map((p) => p.id),
          )

        if (approveError) throw approveError
      }

      toast.success("Anfrage genehmigt")
      loadParticipantsAndRequests()
    } catch (error) {
      console.error("Error approving request:", error)
      toast.error("Fehler beim Genehmigen")
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectRequest = async (requestId: string, userId: string) => {
    setActionLoading(requestId)
    try {
      const { error: updateError } = await supabase
        .from("ludo_event_join_requests")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId)

      if (updateError) throw updateError

      const instanceIds = await supabase
        .from("ludo_event_instances")
        .select("id")
        .eq("event_id", event.id)
        .then((res) => (res.data || []).map((i) => i.id))

      const { error: deleteError } = await supabase
        .from("ludo_event_instance_participants")
        .delete()
        .eq("user_id", userId)
        .eq("status", "pending")
        .in("instance_id", instanceIds)

      if (deleteError) throw deleteError

      toast.success("Anfrage abgelehnt")
      loadParticipantsAndRequests()
    } catch (error) {
      console.error("Error rejecting request:", error)
      toast.error("Fehler beim Ablehnen")
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveFromInstance = async (participantId: string, userName: string) => {
    if (!confirm(`Möchtest du ${userName} wirklich von diesem Termin entfernen?`)) {
      return
    }

    setActionLoading(participantId)
    try {
      const { error } = await supabase.from("ludo_event_instance_participants").delete().eq("id", participantId)

      if (error) throw error

      toast.success("Teilnehmer entfernt")
      loadParticipantsAndRequests()
    } catch (error) {
      console.error("Error removing participant:", error)
      toast.error("Fehler beim Entfernen")
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
      const result = await deleteLudoEvent(event.id, "")
      if (result.success) {
        toast.success("Event erfolgreich gelöscht")
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

  const participantsByInstance = instanceParticipants
    .filter((p) => p.status === "registered")
    .reduce(
      (acc, participant) => {
        const dateKey = participant.instance.instance_date
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: dateKey,
            startTime: participant.instance.start_time,
            endTime: participant.instance.end_time,
            participants: [],
          }
        }
        acc[dateKey].participants.push(participant)
        return acc
      },
      {} as Record<
        string,
        {
          date: string
          startTime: string
          endTime: string
          participants: InstanceParticipant[]
        }
      >,
    )

  const participantsByUser = instanceParticipants
    .filter((p) => p.status === "registered")
    .reduce(
      (acc, participant) => {
        const userId = participant.user_id
        if (!acc[userId]) {
          acc[userId] = {
            user: participant.user,
            instances: [],
          }
        }
        acc[userId].instances.push({
          id: participant.id,
          instanceId: participant.instance_id,
          date: participant.instance.instance_date,
          startTime: participant.instance.start_time,
          endTime: participant.instance.end_time,
          joinedAt: participant.joined_at,
        })
        return acc
      },
      {} as Record<
        string,
        {
          user: { id: string; username: string; name: string; avatar: string }
          instances: Array<{
            id: string
            instanceId: string
            date: string
            startTime: string
            endTime: string
            joinedAt: string
          }>
        }
      >,
    )

  console.log("[v0] Participants by user:", Object.keys(participantsByUser).length, participantsByUser)
  console.log("[v0] Join requests count:", joinRequests.length)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Event verwalten: {event.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={showRequestsTab ? "requests" : "participants"} className="w-full">
          <TabsList className={`grid w-full ${showRequestsTab ? "grid-cols-3" : "grid-cols-2"}`}>
            {showRequestsTab && (
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Teilnahmeanfragen ({joinRequests.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="participants" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Teilnehmer ({Object.keys(participantsByUser).length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Einstellungen
            </TabsTrigger>
          </TabsList>

          {showRequestsTab && (
            <TabsContent value="requests" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                      {joinRequests.length}
                    </Badge>
                    Eingegangene Anfragen
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
                  ) : joinRequests.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Keine eingegangene Anfragen</p>
                  ) : (
                    <div className="space-y-3">
                      {joinRequests.map((request) => (
                        <div key={request.id} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={request.user.avatar || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {request.user.username?.[0]?.toUpperCase() || request.user.name?.[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{request.user.name || request.user.username}</p>
                                <p className="text-sm text-gray-500">
                                  Angefragt am {new Date(request.created_at).toLocaleDateString("de-DE")}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproveRequest(request.id, request.user_id)}
                                disabled={actionLoading === request.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Genehmigen
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectRequest(request.id, request.user_id)}
                                disabled={actionLoading === request.id}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Ablehnen
                              </Button>
                            </div>
                          </div>
                          {request.message && (
                            <div className="mt-3 p-3 bg-white rounded border border-orange-200">
                              <p className="text-sm font-medium text-gray-700 mb-1">Nachricht:</p>
                              <p className="text-sm text-gray-600">{request.message}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="participants" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                    {Object.keys(participantsByUser).length}
                  </Badge>
                  Genehmigte Teilnehmer
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
                ) : Object.keys(participantsByUser).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Noch keine genehmigte Teilnehmer</p>
                ) : (
                  <div className="space-y-4">
                    {Object.values(participantsByUser).map((userGroup) => (
                      <div key={userGroup.user.id} className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar>
                            <AvatarImage src={userGroup.user.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {userGroup.user.username?.[0]?.toUpperCase() || userGroup.user.name?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{userGroup.user.name || userGroup.user.username}</p>
                            <p className="text-sm text-gray-500">
                              Angemeldet für {userGroup.instances.length} Termin
                              {userGroup.instances.length !== 1 ? "e" : ""}
                            </p>
                          </div>
                          <Badge className="bg-green-600 text-white">Genehmigt</Badge>
                        </div>

                        <div className="space-y-2 mt-3 pl-14">
                          {userGroup.instances
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                            .map((instance) => (
                              <div
                                key={instance.id}
                                className="flex items-center justify-between p-2 bg-white rounded border border-green-200"
                              >
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="h-4 w-4 text-green-600" />
                                  <span className="font-medium">{formatDate(instance.date)}</span>
                                  <span className="text-gray-500">
                                    {instance.startTime.slice(0, 5)}
                                    {instance.endTime && ` - ${instance.endTime.slice(0, 5)}`}
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleRemoveFromInstance(
                                      instance.id,
                                      userGroup.user.name || userGroup.user.username,
                                    )
                                  }
                                  disabled={actionLoading === instance.id}
                                  className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <UserMinus className="h-4 w-4 mr-1" />
                                  Entfernen
                                </Button>
                              </div>
                            ))}
                        </div>
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
                <div className="p-4 bg-white rounded-lg border-2 border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2">Event löschen</h4>
                  <p className="text-sm text-red-600 mb-4">
                    Das Event wird permanent gelöscht und alle Anmeldungen werden entfernt. Diese Aktion kann nicht
                    rückgängig gemacht werden.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteEvent}
                    disabled={actionLoading === "delete"}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold"
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
