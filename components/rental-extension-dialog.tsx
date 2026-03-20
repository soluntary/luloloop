"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { CalendarDays, Clock, Check, X, AlertCircle, CalendarPlus } from "lucide-react"
import { format, addDays, differenceInDays, isAfter, isBefore } from "date-fns"
import { de } from "date-fns/locale"

interface RentalExtensionDialogProps {
  isOpen: boolean
  onClose: () => void
  bookingId: string
  offerId: string
  gameTitle: string
  gameImage?: string
  currentEndDate: string
  maxRentalDays?: number
  dailyRate?: number
  ownerId: string
  renterId: string
  isOwner: boolean
  onSuccess?: () => void
}

export function RentalExtensionDialog({
  isOpen,
  onClose,
  bookingId,
  offerId,
  gameTitle,
  gameImage,
  currentEndDate,
  maxRentalDays = 365,
  dailyRate = 0,
  ownerId,
  renterId,
  isOwner,
  onSuccess,
}: RentalExtensionDialogProps) {
  const { user } = useAuth()
  const [newEndDate, setNewEndDate] = useState<Date | undefined>()
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingExtensions, setPendingExtensions] = useState<any[]>([])
  const [existingBookings, setExistingBookings] = useState<any[]>([])

  const currentEnd = new Date(currentEndDate)
  const minExtensionDate = addDays(currentEnd, 1)
  const daysToExtend = newEndDate ? differenceInDays(newEndDate, currentEnd) : 0
  const additionalCost = daysToExtend * dailyRate

  useEffect(() => {
    if (isOpen) {
      fetchPendingExtensions()
      fetchExistingBookings()
    }
  }, [isOpen, bookingId, offerId])

  const fetchPendingExtensions = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("rental_extensions")
        .select("*")
        .eq("booking_id", bookingId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (error) throw error
      setPendingExtensions(data || [])
    } catch (error) {
      console.error("Error fetching pending extensions:", error)
    }
  }

  const fetchExistingBookings = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("rental_bookings")
        .select("id, start_date, end_date")
        .eq("offer_id", offerId)
        .neq("id", bookingId)
        .in("status", ["confirmed", "active", "pending"])
        .gt("start_date", currentEndDate)

      if (error) throw error
      setExistingBookings(data || [])
    } catch (error) {
      console.error("Error fetching existing bookings:", error)
    }
  }

  const isDateBlocked = (date: Date): boolean => {
    // Check if date conflicts with other bookings
    return existingBookings.some((booking) => {
      const start = new Date(booking.start_date)
      const end = new Date(booking.end_date)
      return date >= start && date <= end
    })
  }

  const handleRequestExtension = async () => {
    if (!user || !newEndDate) {
      toast.error("Bitte wähle ein neues Enddatum")
      return
    }

    // Validate extension is at least 2 days before current end
    const daysUntilEnd = differenceInDays(currentEnd, new Date())
    if (daysUntilEnd < 2) {
      toast.error("Verlängerungsanfragen müssen mindestens 2 Tage vor Mietende gestellt werden")
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      const extensionData = {
        booking_id: bookingId,
        requested_by: user.id,
        original_end_date: currentEndDate,
        requested_end_date: newEndDate.toISOString().split("T")[0],
        additional_days: daysToExtend,
        additional_cost: additionalCost,
        reason: reason.trim() || null,
        status: "pending",
      }

      const { error } = await supabase.from("rental_extensions").insert(extensionData)

      if (error) throw error

      // Notify the owner
      await supabase.from("notifications").insert({
        user_id: ownerId,
        type: "extension_request",
        title: "Verlängerungsanfrage",
        message: `Der Mieter möchte die Miete für "${gameTitle}" um ${daysToExtend} Tage verlängern.`,
        data: {
          booking_id: bookingId,
          offer_id: offerId,
          requested_end_date: newEndDate.toISOString().split("T")[0],
          additional_cost: additionalCost,
        },
      })

      toast.success("Verlängerungsanfrage gesendet!")
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error("Error requesting extension:", error)
      toast.error("Fehler beim Senden der Anfrage")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRespondToExtension = async (extensionId: string, approved: boolean) => {
    if (!user) return

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const extension = pendingExtensions.find((e) => e.id === extensionId)

      if (!extension) return

      // Update extension status
      const { error: extensionError } = await supabase
        .from("rental_extensions")
        .update({
          status: approved ? "approved" : "rejected",
          responded_at: new Date().toISOString(),
          responded_by: user.id,
        })
        .eq("id", extensionId)

      if (extensionError) throw extensionError

      if (approved) {
        // Update the booking end date
        const { error: bookingError } = await supabase
          .from("rental_bookings")
          .update({
            end_date: extension.requested_end_date,
            total_price: supabase.rpc("increment", {
              row_id: bookingId,
              amount: extension.additional_cost,
            }),
          })
          .eq("id", bookingId)

        if (bookingError) throw bookingError
      }

      // Notify the renter
      await supabase.from("notifications").insert({
        user_id: renterId,
        type: approved ? "extension_approved" : "extension_rejected",
        title: approved ? "Verlängerung genehmigt" : "Verlängerung abgelehnt",
        message: approved
          ? `Deine Verlängerungsanfrage für "${gameTitle}" wurde genehmigt. Neues Enddatum: ${format(new Date(extension.requested_end_date), "dd.MM.yyyy", { locale: de })}`
          : `Deine Verlängerungsanfrage für "${gameTitle}" wurde leider abgelehnt.`,
        data: {
          booking_id: bookingId,
          offer_id: offerId,
          extension_id: extensionId,
        },
      })

      toast.success(approved ? "Verlängerung genehmigt" : "Verlängerung abgelehnt")
      fetchPendingExtensions()
      onSuccess?.()
    } catch (error) {
      console.error("Error responding to extension:", error)
      toast.error("Fehler bei der Verarbeitung")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setNewEndDate(undefined)
    setReason("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-handwritten text-xl flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-teal-500" />
            {isOwner ? "Verlängerungsanfragen" : "Mietzeit verlängern"}
          </DialogTitle>
          <DialogDescription>
            {isOwner
              ? "Verwalte Verlängerungsanfragen für diese Miete"
              : `Aktuelle Miete für "${gameTitle}" läuft bis ${format(currentEnd, "dd.MM.yyyy", { locale: de })}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Game info */}
          <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
            <img
              src={gameImage || "/images/ludoloop-placeholder.png"}
              alt={gameTitle}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div>
              <p className="font-semibold text-slate-800">{gameTitle}</p>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Endet: {format(currentEnd, "dd.MM.yyyy", { locale: de })}
              </p>
            </div>
          </div>

          {/* Pending extensions (for owner) */}
          {isOwner && pendingExtensions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Offene Anfragen</h4>
              {pendingExtensions.map((extension) => (
                <div
                  key={extension.id}
                  className="p-4 border border-orange-200 bg-orange-50 rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-orange-300 text-orange-700">
                      Anfrage ausstehend
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {format(new Date(extension.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-slate-500">Neues Enddatum:</span>{" "}
                      <span className="font-medium">
                        {format(new Date(extension.requested_end_date), "dd.MM.yyyy", { locale: de })}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-500">Zusätzliche Tage:</span>{" "}
                      <span className="font-medium">{extension.additional_days}</span>
                    </p>
                    <p>
                      <span className="text-slate-500">Zusatzkosten:</span>{" "}
                      <span className="font-medium text-teal-600">
                        CHF {extension.additional_cost.toFixed(2)}
                      </span>
                    </p>
                    {extension.reason && (
                      <p>
                        <span className="text-slate-500">Begründung:</span>{" "}
                        <span className="italic">"{extension.reason}"</span>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleRespondToExtension(extension.id, true)}
                      disabled={isSubmitting}
                      className="bg-green-500 hover:bg-green-600 flex-1"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Genehmigen
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRespondToExtension(extension.id, false)}
                      disabled={isSubmitting}
                      className="border-red-300 text-red-600 hover:bg-red-50 flex-1"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Ablehnen
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Extension request form (for renter) */}
          {!isOwner && (
            <>
              {/* Check if already has pending request */}
              {pendingExtensions.length > 0 ? (
                <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-700">
                    <AlertCircle className="h-5 w-5" />
                    <p className="font-medium">Du hast bereits eine offene Verlängerungsanfrage</p>
                  </div>
                  <p className="text-sm text-orange-600 mt-2">
                    Warte auf die Antwort des Vermieters bevor du eine neue Anfrage stellst.
                  </p>
                </div>
              ) : (
                <>
                  {/* Date picker */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Neues Enddatum wählen</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <CalendarDays className="h-4 w-4 mr-2" />
                          {newEndDate
                            ? format(newEndDate, "dd.MM.yyyy", { locale: de })
                            : "Datum auswählen"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newEndDate}
                          onSelect={setNewEndDate}
                          disabled={(date) =>
                            isBefore(date, minExtensionDate) || isDateBlocked(date)
                          }
                          locale={de}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Cost preview */}
                  {newEndDate && daysToExtend > 0 && (
                    <div className="p-4 bg-teal-50 rounded-lg border border-teal-100 space-y-2">
                      <h4 className="font-semibold text-teal-800 text-sm">Kostenübersicht</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between text-slate-600">
                          <span>Zusätzliche Tage:</span>
                          <span>{daysToExtend} Tage</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Tagespreis:</span>
                          <span>CHF {dailyRate.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-teal-800 pt-2 border-t border-teal-200">
                          <span>Zusatzkosten:</span>
                          <span>CHF {additionalCost.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Warning about blocked dates */}
                  {existingBookings.length > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-xs text-amber-700">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p>
                        Einige Daten sind bereits für andere Buchungen reserviert und können nicht
                        ausgewählt werden.
                      </p>
                    </div>
                  )}

                  {/* Reason */}
                  <div className="space-y-2">
                    <Label htmlFor="reason" className="text-sm font-medium">
                      Begründung (optional)
                    </Label>
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Warum möchtest du die Miete verlängern?"
                      rows={2}
                      maxLength={300}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            {isOwner ? "Schliessen" : "Abbrechen"}
          </Button>
          {!isOwner && pendingExtensions.length === 0 && (
            <Button
              onClick={handleRequestExtension}
              disabled={isSubmitting || !newEndDate || daysToExtend <= 0}
              className="bg-teal-500 hover:bg-teal-600"
            >
              {isSubmitting ? "Wird gesendet..." : "Verlängerung anfragen"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
