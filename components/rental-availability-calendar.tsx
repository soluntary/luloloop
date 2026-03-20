"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { CalendarDays, Info } from "lucide-react"
import { addDays, differenceInDays, format, isBefore, isAfter, isWithinInterval, startOfDay } from "date-fns"
import { de } from "date-fns/locale"
import type { DateRange } from "react-day-picker"

interface RentalBooking {
  id: string
  start_date: string
  end_date: string
  status: string
  renter_id: string
}

interface RentalAvailabilityCalendarProps {
  offerId: string
  dailyRate1Day?: number
  dailyRate2To6Days?: number
  dailyRate7To30Days?: number
  dailyRateOver30Days?: number
  depositAmount?: number
  minRentalDays?: number
  maxRentalDays?: number
  onDateRangeSelect?: (range: DateRange | undefined, totalPrice: number, breakdown: PriceBreakdown | null) => void
  isOwner?: boolean
}

interface PriceBreakdown {
  days: number
  dailyRate: number
  subtotal: number
  deposit: number
  total: number
}

export function RentalAvailabilityCalendar({
  offerId,
  dailyRate1Day = 0,
  dailyRate2To6Days = 0,
  dailyRate7To30Days = 0,
  dailyRateOver30Days = 0,
  depositAmount = 0,
  minRentalDays = 1,
  maxRentalDays = 365,
  onDateRangeSelect,
  isOwner = false,
}: RentalAvailabilityCalendarProps) {
  const [bookings, setBookings] = useState<RentalBooking[]>([])
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>()
  const [loading, setLoading] = useState(true)
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null)

  useEffect(() => {
    fetchBookings()
  }, [offerId])

  const fetchBookings = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("rental_bookings")
        .select("id, start_date, end_date, status, renter_id")
        .eq("offer_id", offerId)
        .in("status", ["confirmed", "active", "pending"])
        .gte("end_date", new Date().toISOString().split("T")[0])

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error("Error fetching bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  const isDateBooked = (date: Date): boolean => {
    return bookings.some((booking) => {
      const start = startOfDay(new Date(booking.start_date))
      const end = startOfDay(new Date(booking.end_date))
      return isWithinInterval(startOfDay(date), { start, end })
    })
  }

  const isDateDisabled = (date: Date): boolean => {
    const today = startOfDay(new Date())
    if (isBefore(startOfDay(date), today)) return true
    if (isDateBooked(date)) return true
    return false
  }

  const calculateDailyRate = (days: number): number => {
    if (days >= 30) return dailyRateOver30Days || dailyRate7To30Days || dailyRate2To6Days || dailyRate1Day
    if (days >= 7) return dailyRate7To30Days || dailyRate2To6Days || dailyRate1Day
    if (days >= 2) return dailyRate2To6Days || dailyRate1Day
    return dailyRate1Day
  }

  const calculatePrice = (range: DateRange | undefined): PriceBreakdown | null => {
    if (!range?.from || !range?.to) return null

    const days = differenceInDays(range.to, range.from) + 1
    const dailyRate = calculateDailyRate(days)
    const subtotal = days * dailyRate
    const deposit = depositAmount || 0

    return {
      days,
      dailyRate,
      subtotal,
      deposit,
      total: subtotal + deposit,
    }
  }

  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      // Check if any date in range is booked
      let current = range.from
      while (current <= range.to) {
        if (isDateBooked(current)) {
          return // Don't allow selection if any date is booked
        }
        current = addDays(current, 1)
      }

      const days = differenceInDays(range.to, range.from) + 1
      if (days < minRentalDays || days > maxRentalDays) {
        return // Don't allow if outside rental duration limits
      }
    }

    setSelectedRange(range)
    const breakdown = calculatePrice(range)
    setPriceBreakdown(breakdown)
    onDateRangeSelect?.(range, breakdown?.total || 0, breakdown)
  }

  const getBookingStatus = (date: Date): "confirmed" | "pending" | "available" => {
    const booking = bookings.find((b) => {
      const start = startOfDay(new Date(b.start_date))
      const end = startOfDay(new Date(b.end_date))
      return isWithinInterval(startOfDay(date), { start, end })
    })
    if (!booking) return "available"
    return booking.status as "confirmed" | "pending"
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-handwritten">
          <CalendarDays className="h-5 w-5 text-teal-500" />
          Verfügbarkeit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300" />
            <span className="text-slate-600">Verfügbar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300" />
            <span className="text-slate-600">Gebucht</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-orange-100 border border-orange-300" />
            <span className="text-slate-600">Angefragt</span>
          </div>
          {selectedRange?.from && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-teal-500" />
              <span className="text-slate-600">Ausgewählt</span>
            </div>
          )}
        </div>

        {/* Calendar */}
        <div className="flex justify-center">
          <Calendar
            mode="range"
            selected={selectedRange}
            onSelect={handleSelect}
            numberOfMonths={1}
            locale={de}
            disabled={isDateDisabled}
            modifiers={{
              booked: (date) => isDateBooked(date),
              pending: (date) => getBookingStatus(date) === "pending",
            }}
            modifiersClassNames={{
              booked: "bg-red-100 text-red-800 line-through",
              pending: "bg-orange-100 text-orange-800",
            }}
            className="rounded-md border"
          />
        </div>

        {/* Duration limits info */}
        <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
          <div>
            <p>
              Mietdauer: {minRentalDays} - {maxRentalDays} Tage
            </p>
          </div>
        </div>

        {/* Price breakdown */}
        {priceBreakdown && selectedRange?.from && selectedRange?.to && (
          <div className="p-4 bg-teal-50 rounded-lg border border-teal-100 space-y-2">
            <h4 className="font-semibold text-teal-800 text-sm">Preisübersicht</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Zeitraum:</span>
                <span>
                  {format(selectedRange.from, "dd.MM.yyyy", { locale: de })} -{" "}
                  {format(selectedRange.to, "dd.MM.yyyy", { locale: de })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{priceBreakdown.days} Tage x CHF {priceBreakdown.dailyRate.toFixed(2)}/Tag:</span>
                <span>CHF {priceBreakdown.subtotal.toFixed(2)}</span>
              </div>
              {priceBreakdown.deposit > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Kaution (rückerstattbar):</span>
                  <span>CHF {priceBreakdown.deposit.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-teal-800 pt-2 border-t border-teal-200">
                <span>Gesamt:</span>
                <span>CHF {priceBreakdown.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Daily rates info */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-700">Tagespreise</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {dailyRate1Day > 0 && (
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">1 Tag:</span>
                <span className="font-medium">CHF {dailyRate1Day.toFixed(2)}</span>
              </div>
            )}
            {dailyRate2To6Days > 0 && (
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">2-6 Tage:</span>
                <span className="font-medium">CHF {dailyRate2To6Days.toFixed(2)}/Tag</span>
              </div>
            )}
            {dailyRate7To30Days > 0 && (
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">7-30 Tage:</span>
                <span className="font-medium">CHF {dailyRate7To30Days.toFixed(2)}/Tag</span>
              </div>
            )}
            {dailyRateOver30Days > 0 && (
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">30+ Tage:</span>
                <span className="font-medium">CHF {dailyRateOver30Days.toFixed(2)}/Tag</span>
              </div>
            )}
          </div>
          {depositAmount > 0 && (
            <div className="flex justify-between p-2 bg-orange-50 rounded text-xs">
              <span className="text-orange-700">Kaution:</span>
              <span className="font-medium text-orange-800">CHF {depositAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Upcoming bookings (owner view) */}
        {isOwner && bookings.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-semibold text-slate-700">Kommende Buchungen</h4>
            <div className="space-y-2">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs"
                >
                  <span>
                    {format(new Date(booking.start_date), "dd.MM.", { locale: de })} -{" "}
                    {format(new Date(booking.end_date), "dd.MM.yyyy", { locale: de })}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      booking.status === "confirmed"
                        ? "border-green-300 text-green-700 bg-green-50"
                        : booking.status === "pending"
                          ? "border-orange-300 text-orange-700 bg-orange-50"
                          : "border-blue-300 text-blue-700 bg-blue-50"
                    }
                  >
                    {booking.status === "confirmed" && "Bestätigt"}
                    {booking.status === "pending" && "Angefragt"}
                    {booking.status === "active" && "Aktiv"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
