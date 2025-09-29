"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, Clock, MapPin, Users, UserPlus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { registerForInstance, type LudoEventInstance } from "@/app/actions/ludo-event-instances"
import { joinLudoEvent } from "@/app/actions/ludo-events"

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
  const [loading, setLoading] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [approvalMode, setApprovalMode] = useState<"automatic" | "manual">("automatic")
  const [showJoinDialog, setShowJoinDialog] = useState(false)

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

      // First, get the main event data to include the first date
      const { data: eventData, error: eventError } = await supabase
        .from("ludo_events")
        .select("event_date, start_time, end_time")
        .eq("id", event.id)
        .single()

      if (eventError) {
        console.error("Error fetching main event data:", eventError)
        throw new Error(eventError.message)
      }

      // Get additional instances from ludo_event_instances
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

      // Create a combined list: first date + additional instances
      const allDates = []

      // Add the main event date as the first date
      if (eventData) {
        allDates.push({
          id: `main-${event.id}`, // Special ID for main event date
          event_id: event.id,
          instance_date: eventData.event_date,
          start_time: eventData.start_time,
          end_time: eventData.end_time,
          max_participants: null, // Will use event's max_participants
          participant_count: 0, // Will be calculated separately
          user_registered: false, // Will be checked separately
          is_main_date: true, // Flag to identify this as the main event date
        })
      }

      // Add additional instances
      if (instancesData) {
        instancesData.forEach((instance) => {
          allDates.push({
            ...instance,
            participant_count: instance.participant_count?.[0]?.count || 0,
            user_registered: false, // Will be checked below
            is_main_date: false,
          })
        })
      }

      // Check user registration status for all dates if authenticated
      let datesWithRegistration = allDates
      if (user && allDates.length > 0) {
        // Check main event registration
        const { data: mainEventRegistration } = await supabase
          .from("ludo_event_participants")
          .select("id")
          .eq("event_id", event.id)
          .eq("user_id", user.id)
          .single()

        // Check instance registrations
        const instanceIds = allDates.filter((d) => !d.is_main_date).map((d) => d.id)
        let instanceRegistrations = []
        if (instanceIds.length > 0) {
          const { data } = await supabase
            .from("ludo_event_instance_participants")
            .select("instance_id")
            .eq("user_id", user.id)
            .in("instance_id", instanceIds)
          instanceRegistrations = data || []
        }

        const registeredInstanceIds = new Set(instanceRegistrations.map((r) => r.instance_id))

        datesWithRegistration = allDates.map((date) => ({
          ...date,
          user_registered: date.is_main_date ? !!mainEventRegistration : registeredInstanceIds.has(date.id),
        }))

        // Get participant count for main event
        if (mainEventRegistration) {
          const { data: mainEventParticipants } = await supabase
            .from("ludo_event_participants")
            .select("id", { count: "exact" })
            .eq("event_id", event.id)

          datesWithRegistration[0].participant_count = mainEventParticipants?.length || 0
        }
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

  const handleRegisterForSelectedDates = async () => {
    if (!user) {
      toast.error("Du musst angemeldet sein, um an einem Event teilzunehmen")
      return
    }

    if (selectedInstances.length === 0) {
      toast.error("Bitte wähle mindestens einen Termin aus")
      return
    }

    if (approvalMode === "manual") {
      setShowJoinDialog(true)
      return
    }

    await performRegistration()
  }

  const performRegistration = async (message?: string) => {
    setRegistering(true)
    try {
      const results = []

      for (const instanceId of selectedInstances) {
        if (instanceId.startsWith("main-")) {
          // Register for main event
          const eventId = instanceId.replace("main-", "")
          const result = await joinLudoEvent(eventId, user!.id, message)
          results.push(result)
        } else {
          // Register for instance
          const result = await registerForInstance(instanceId, message)
          results.push(result)
        }
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
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error("Error registering for instances:", error)
      toast.error("Fehler bei der Anmeldung")
    } finally {
      setRegistering(false)
      setShowJoinDialog(false)
    }
  }

  const displayInstances = instances

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Termine auswählen - {event.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm text-gray-600">Wähle die Termine aus, an denen du teilnehmen möchtest:</div>

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
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {displayInstances.map((instance) => {
                  const isSelected = selectedInstances.includes(instance.id)
                  const maxParticipants = instance.max_participants || event.max_participants
                  const currentParticipants = instance.participant_count || 0
                  const freePlaces = maxParticipants - currentParticipants
                  const isFull = freePlaces <= 0
                  const isUserRegistered = instance.user_registered

                  return (
                    <div
                      key={instance.id}
                      className={`border rounded-lg p-4 transition-colors ${
                        isSelected ? "bg-teal-50 border-teal-200" : "hover:bg-gray-50"
                      } ${isFull && !isUserRegistered ? "opacity-50" : ""} ${
                        isUserRegistered ? "bg-green-50 border-green-200" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleInstanceToggle(instance.id, isSelected)}
                            disabled={(isFull && !isUserRegistered) || isUserRegistered}
                          />
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-teal-600" />
                              <span className="font-medium">{formatSingleDate(instance.instance_date)}</span>
                              {instance.is_main_date && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  Haupttermin
                                </span>
                              )}
                              {isUserRegistered && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  Angemeldet
                                </span>
                              )}
                            </div>
                            {instance.start_time && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="h-4 w-4 text-teal-600" />
                                <span>{formatTimeForDate(instance.start_time, instance.end_time)}</span>
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="h-4 w-4 text-teal-600" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            <Users className="h-4 w-4 inline mr-1" />
                            {isUserRegistered
                              ? "Du bist angemeldet"
                              : isFull
                                ? "Ausgebucht"
                                : `${currentParticipants} Teilnehmer (${freePlaces} ${freePlaces === 1 ? "Platz frei" : "Plätze frei"})`}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent" disabled={registering}>
                Abbrechen
              </Button>
              <Button
                onClick={handleRegisterForSelectedDates}
                disabled={registering || selectedInstances.length === 0 || displayInstances.length === 0}
                className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
              >
                {registering ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {approvalMode === "manual" ? "Anfrage senden..." : "Anmelden..."}
                  </div>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {approvalMode === "manual"
                      ? `Anfrage für ${selectedInstances.length} Termin${selectedInstances.length !== 1 ? "e" : ""} senden`
                      : `Für ${selectedInstances.length} Termin${selectedInstances.length !== 1 ? "e" : ""} anmelden`}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showJoinDialog && (
        <Dialog open={showJoinDialog} onOpenChange={() => setShowJoinDialog(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Anfrage senden
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Du möchtest eine Anfrage für {selectedInstances.length} Termin
                {selectedInstances.length !== 1 ? "e" : ""} senden.
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-800">
                  <strong>Teilnahme mit Genehmigung:</strong> Der Organisator muss deine Anfrage genehmigen. Du erhältst
                  eine Benachrichtigung, sobald über deine Anfrage entschieden wurde.
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowJoinDialog(false)}
                  className="flex-1 bg-transparent"
                  disabled={registering}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={() => performRegistration()}
                  disabled={registering}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                >
                  {registering ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Anfrage senden...
                    </div>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Anfrage senden
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
