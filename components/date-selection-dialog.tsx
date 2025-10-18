"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, Users, UserPlus, CalendarCheck, UserMinus, MessageSquare, UserCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { registerForInstance, unregisterFromInstance, type LudoEventInstance } from "@/app/actions/ludo-event-instances"

interface DateSelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  event: {
    id: string
    title: string
    location?: string
    max_participants: number
    event_date: string
    start_time?: string
    end_time?: string
  }
  user: {
    id: string
  } | null
  onSuccess: () => void
}

export default function DateSelectionDialog({ isOpen, onClose, event, user, onSuccess }: DateSelectionDialogProps) {
  const [instances, setInstances] = useState<LudoEventInstance[]>([])
  const [selectedInstances, setSelectedInstances] = useState<string[]>([])
  const [instancesToUnregister, setInstancesToUnregister] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [approvalMode, setApprovalMode] = useState<"automatic" | "manual">("automatic")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (isOpen && event.id) {
      loadEventInstances()
      loadEventApprovalMode()
    }
  }, [isOpen, event.id])

  const loadEventApprovalMode = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("ludo_events").select("approval_mode").eq("id", event.id).single()

      if (error) {
        console.error("Error fetching event approval mode:", error)
        return
      }

      setApprovalMode(data?.approval_mode || "automatic")
    } catch (error) {
      console.error("Error loading event approval mode:", error)
    }
  }

  const loadEventInstances = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      const { data: instancesData, error } = await supabase
        .from("ludo_event_instances")
        .select(`
          *,
          participant_count:ludo_event_instance_participants(count)
        `)
        .eq("event_id", event.id)
        .order("instance_date", { ascending: true })

      if (error) {
        console.error("Error fetching event instances:", error)
        throw new Error(error.message)
      }

      const allDates = (instancesData || []).map((instance) => ({
        ...instance,
        participant_count: instance.participant_count?.[0]?.count || 0,
        user_registered: false,
      }))

      let datesWithRegistration = allDates
      if (user && allDates.length > 0) {
        const instanceIds = allDates.map((d) => d.id)
        const { data: registrations } = await supabase
          .from("ludo_event_instance_participants")
          .select("instance_id")
          .eq("user_id", user.id)
          .in("instance_id", instanceIds)

        const registeredInstanceIds = new Set((registrations || []).map((r) => r.instance_id))

        datesWithRegistration = allDates.map((date) => ({
          ...date,
          user_registered: registeredInstanceIds.has(date.id),
        }))
      }

      setInstances(datesWithRegistration)
    } catch (error) {
      console.error("Error loading event instances:", error)
      toast.error("Fehler beim Laden der Termine")
    } finally {
      setLoading(false)
    }
  }

  const formatSingleDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatTimeForDate = (startTime?: string, endTime?: string) => {
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

  const handleInstanceToggle = (instanceId: string, isCurrentlySelected: boolean) => {
    if (isCurrentlySelected) {
      setSelectedInstances((prev) => prev.filter((id) => id !== instanceId))
    } else {
      setSelectedInstances((prev) => [...prev, instanceId])
    }
  }

  const handleUnregisterToggle = (instanceId: string, isCurrentlySelected: boolean) => {
    if (isCurrentlySelected) {
      setInstancesToUnregister((prev) => prev.filter((id) => id !== instanceId))
    } else {
      setInstancesToUnregister((prev) => [...prev, instanceId])
    }
  }

  const handleUnregisterFromSelectedDates = async () => {
    if (!user) {
      toast.error("Du musst angemeldet sein")
      return
    }

    if (instancesToUnregister.length === 0) {
      toast.error("Bitte wähle mindestens einen Termin zum Abmelden aus")
      return
    }

    setRegistering(true)
    try {
      const results = []

      for (const instanceId of instancesToUnregister) {
        try {
          await unregisterFromInstance(instanceId)
          results.push({ success: true })
        } catch (error) {
          console.error("Error unregistering from instance:", error)
          results.push({ success: false })
        }
      }

      const failedUnregistrations = results.filter((result) => !result.success)

      if (failedUnregistrations.length > 0) {
        toast.error(`Fehler bei ${failedUnregistrations.length} Abmeldung(en)`)
      } else {
        toast.success(`Du hast dich erfolgreich von ${instancesToUnregister.length} Termin(en) abgemeldet`)
        setInstancesToUnregister([])
        await loadEventInstances()
        onSuccess()
      }
    } catch (error) {
      console.error("Error unregistering from instances:", error)
      toast.error("Fehler bei der Abmeldung")
    } finally {
      setRegistering(false)
    }
  }

  const handleRegisterForSelectedDates = async () => {
    if (!user) {
      toast.error("Du musst angemeldet sein, um an einem Event teilzunehmen")
      return
    }

    if (selectedInstances.length === 0) {
      toast.error("Bitte wähle mindestens einen Termin aus")
      return
    }

    // For manual approval, show confirmation dialog with message field
    if (approvalMode === "manual") {
      setShowConfirmDialog(true)
    } else {
      // For automatic approval, register directly
      await performRegistration()
    }
  }

  const performRegistration = async () => {
    setRegistering(true)
    try {
      const results = []

      for (const instanceId of selectedInstances) {
        const result = await registerForInstance(instanceId, approvalMode === "manual" ? message : undefined)
        results.push(result)
      }

      const failedRegistrations = results.filter((result) => !result.success)

      if (failedRegistrations.length > 0) {
        toast.error(`Fehler bei ${failedRegistrations.length} Anmeldung(en)`)
      } else {
        if (approvalMode === "manual") {
          toast.success(
            `Deine Anfrage für ${selectedInstances.length} Termin(e) wurde gesendet. Du erhältst eine Benachrichtigung, sobald über deine Anfrage entschieden wurde.`,
          )
        } else {
          toast.success(`Du hast dich erfolgreich für ${selectedInstances.length} Termin(e) angemeldet`)
        }
        setMessage("")
        setShowConfirmDialog(false)
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error("Error registering for instances:", error)
      toast.error("Fehler bei der Anmeldung")
    } finally {
      setRegistering(false)
    }
  }

  const displayInstances = instances

  const registeredInstances = displayInstances.filter((i) => i.user_registered)
  const unregisteredInstances = displayInstances.filter((i) => !i.user_registered)

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">Termine auswählen - {event.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div
              className={`p-4 rounded-lg border-2 ${
                approvalMode === "automatic" ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"
              }`}
            >
              <div className="flex items-center gap-3">
                {approvalMode === "automatic" ? (
                  <>
                    <UserCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-800 text-sm">Direkte Teilnahme</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 text-orange-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-orange-800 text-sm">Teilnahme erst nach Genehmigung</p>
                      <p className="text-xs text-orange-700">
                        Der Organisator muss deine Teilnahmeanfrage erst genehmigen.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="text-sm text-gray-600">Wähle die Termine aus, an denen du teilnehmen möchtest</div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Lade Termine...</p>
              </div>
            ) : displayInstances.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Keine Termine verfügbar</p>
              </div>
            ) : (
              <div className="space-y-6">
                {registeredInstances.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                      <CalendarCheck className="h-4 w-4" />
                      Deine angemeldeten Termine ({registeredInstances.length})
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {registeredInstances.map((instance) => {
                        const isSelectedForUnregister = instancesToUnregister.includes(instance.id)
                        const maxParticipants = instance.max_participants || event.max_participants
                        const currentParticipants = instance.participant_count || 0
                        const freePlaces = maxParticipants - currentParticipants

                        return (
                          <div
                            key={instance.id}
                            className={`border rounded-lg p-4 transition-colors ${
                              isSelectedForUnregister ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={isSelectedForUnregister}
                                onCheckedChange={() => handleUnregisterToggle(instance.id, isSelectedForUnregister)}
                                className="mt-0.5"
                              />
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-teal-600 flex-shrink-0" />
                                  <span className="text-sm text-gray-600">
                                    {formatSingleDate(instance.instance_date)}
                                  </span>
                                </div>
                                {instance.start_time && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-teal-600 flex-shrink-0" />
                                    <span className="text-sm text-gray-600">
                                      {formatTimeForDate(instance.start_time, instance.end_time)}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-sm">
                                  <Users className="h-4 w-4 text-teal-600 flex-shrink-0" />
                                  <span className="text-sm text-gray-600">
                                    {currentParticipants} Teilnehmer
                                    {freePlaces > 0 && (
                                      <span className="text-green-600 ml-1">
                                        ({freePlaces} {freePlaces === 1 ? "Platz frei" : "Plätze frei"})
                                      </span>
                                    )}
                                    {freePlaces <= 0 && <span className="text-red-600 ml-1">(Ausgebucht)</span>}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <Button
                      onClick={handleUnregisterFromSelectedDates}
                      disabled={registering || instancesToUnregister.length === 0}
                      variant="destructive"
                      className="w-full bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300 disabled:text-gray-500"
                    >
                      {registering ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Abmelden...
                        </div>
                      ) : (
                        <>
                          <UserMinus className="h-4 w-4 mr-2" />
                          {instancesToUnregister.length > 0
                            ? `Von ${instancesToUnregister.length} Termin(en) abmelden`
                            : "Termine zum Abmelden auswählen"}
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {unregisteredInstances.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Geplante Termine ({unregisteredInstances.length})
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {unregisteredInstances.map((instance) => {
                        const isSelected = selectedInstances.includes(instance.id)
                        const maxParticipants = instance.max_participants || event.max_participants
                        const currentParticipants = instance.participant_count || 0
                        const freePlaces = maxParticipants - currentParticipants
                        const isFull = freePlaces <= 0

                        return (
                          <div
                            key={instance.id}
                            className={`border rounded-lg p-4 transition-colors ${
                              isSelected ? "bg-teal-50 border-teal-200" : "hover:bg-gray-50"
                            } ${isFull ? "opacity-50" : ""}`}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleInstanceToggle(instance.id, isSelected)}
                                disabled={isFull}
                                className="mt-0.5"
                              />
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-teal-600 flex-shrink-0" />
                                  <span className="text-sm text-gray-600">
                                    {formatSingleDate(instance.instance_date)}
                                  </span>
                                </div>
                                {instance.start_time && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-teal-600 flex-shrink-0" />
                                    <span className="text-sm text-gray-600">
                                      {formatTimeForDate(instance.start_time, instance.end_time)}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-sm">
                                  <Users className="h-4 w-4 text-teal-600 flex-shrink-0" />
                                  <span className="text-sm text-gray-600">
                                    {currentParticipants} Teilnehmer
                                    {freePlaces > 0 && (
                                      <span className="text-green-600 ml-1">
                                        ({freePlaces} {freePlaces === 1 ? "Platz frei" : "Plätze frei"})
                                      </span>
                                    )}
                                    {isFull && <span className="text-red-600 ml-1">(Ausgebucht)</span>}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent" disabled={registering}>
                Abbrechen
              </Button>
              <Button
                onClick={handleRegisterForSelectedDates}
                disabled={registering || selectedInstances.length === 0 || unregisteredInstances.length === 0}
                className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
              >
                {registering ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {approvalMode === "manual" ? "Teilnahme anfragen..." : "Teilnehmen..."}
                  </div>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {approvalMode === "manual" ? `Teilnahme anfragen` : `Teilnehmen`}
                    {selectedInstances.length > 0 && ` (${selectedInstances.length})`}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Anfrage senden
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Du möchtest dich für {selectedInstances.length} Termin(e) anmelden. Der Organisator muss deine Teilnahme
              genehmigen.
            </p>

            <div className="space-y-2">
              <Label htmlFor="confirm-message" className="text-sm font-medium">
                Nachricht an den Organisator (optional)
              </Label>
              <Textarea
                id="confirm-message"
                placeholder="Möchtest du dem Organisator etwas mitteilen? (z.B. Erfahrung, besondere Wünsche, etc.)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500">{message.length}/500 Zeichen</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmDialog(false)
                  setMessage("")
                }}
                className="flex-1"
                disabled={registering}
              >
                Abbrechen
              </Button>
              <Button
                onClick={performRegistration}
                disabled={registering}
                className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
              >
                {registering ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Senden...
                  </div>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Teilnahme anfragen
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
