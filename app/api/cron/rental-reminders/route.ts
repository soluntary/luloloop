import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// This API route is called by Vercel Cron daily to send rental reminders
export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const now = new Date()
    const today = now.toISOString().split("T")[0]

    let totalRemindersSent = 0

    // === 1. REMINDERS BEFORE RENTAL END ===
    // Send reminders 3 days and 1 day before rental end
    const reminderDays = [3, 1]

    for (const daysBefore of reminderDays) {
      const targetDate = new Date(now)
      targetDate.setDate(targetDate.getDate() + daysBefore)
      const targetDateStr = targetDate.toISOString().split("T")[0]

      // Find active rentals ending on target date
      const { data: endingRentals, error: rentalsError } = await supabase
        .from("rental_bookings")
        .select(`
          id,
          offer_id,
          renter_id,
          owner_id,
          start_date,
          end_date,
          total_price,
          marketplace_offers!inner(
            title,
            image
          )
        `)
        .eq("status", "active")
        .eq("end_date", targetDateStr)

      if (rentalsError) {
        console.error(`[Rental Reminders] Error fetching ending rentals:`, rentalsError)
        continue
      }

      if (!endingRentals || endingRentals.length === 0) continue

      for (const rental of endingRentals) {
        // Check if reminder already sent
        const { data: existingReminder } = await supabase
          .from("rental_reminders_sent")
          .select("id")
          .eq("booking_id", rental.id)
          .eq("reminder_type", `end_${daysBefore}_days`)
          .single()

        if (existingReminder) continue

        // Send reminder to renter
        const { error: renterNotifError } = await supabase.from("notifications").insert({
          user_id: rental.renter_id,
          type: "rental_ending_soon",
          title: "Mietende naht",
          message: `Deine Miete für "${rental.marketplace_offers.title}" endet in ${daysBefore} ${daysBefore === 1 ? "Tag" : "Tagen"}. Denke an die Rückgabe!`,
          data: {
            booking_id: rental.id,
            offer_id: rental.offer_id,
            end_date: rental.end_date,
            days_remaining: daysBefore,
          },
        })

        if (!renterNotifError) {
          totalRemindersSent++
        }

        // Send reminder to owner
        const { error: ownerNotifError } = await supabase.from("notifications").insert({
          user_id: rental.owner_id,
          type: "rental_ending_soon",
          title: "Mietende naht",
          message: `Die Miete für "${rental.marketplace_offers.title}" endet in ${daysBefore} ${daysBefore === 1 ? "Tag" : "Tagen"}. Bereite dich auf die Rückgabe vor.`,
          data: {
            booking_id: rental.id,
            offer_id: rental.offer_id,
            end_date: rental.end_date,
            days_remaining: daysBefore,
          },
        })

        if (!ownerNotifError) {
          totalRemindersSent++
        }

        // Mark reminder as sent
        await supabase.from("rental_reminders_sent").insert({
          booking_id: rental.id,
          reminder_type: `end_${daysBefore}_days`,
        })
      }
    }

    // === 2. OVERDUE REMINDERS ===
    // Find rentals that are past their end date but still active
    const { data: overdueRentals, error: overdueError } = await supabase
      .from("rental_bookings")
      .select(`
        id,
        offer_id,
        renter_id,
        owner_id,
        start_date,
        end_date,
        total_price,
        deposit_amount,
        marketplace_offers!inner(
          title,
          image
        )
      `)
      .eq("status", "active")
      .lt("end_date", today)

    if (!overdueError && overdueRentals && overdueRentals.length > 0) {
      for (const rental of overdueRentals) {
        const endDate = new Date(rental.end_date)
        const daysOverdue = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))

        // Send daily reminders for first 7 days, then every 3 days
        const shouldSendReminder = daysOverdue <= 7 || daysOverdue % 3 === 0

        if (!shouldSendReminder) continue

        // Check if reminder already sent today
        const { data: existingReminder } = await supabase
          .from("rental_reminders_sent")
          .select("id")
          .eq("booking_id", rental.id)
          .eq("reminder_type", `overdue_day_${daysOverdue}`)
          .single()

        if (existingReminder) continue

        // Send urgent reminder to renter
        const { error: renterNotifError } = await supabase.from("notifications").insert({
          user_id: rental.renter_id,
          type: "rental_overdue",
          title: "Rückgabe überfällig!",
          message: `Die Rückgabe von "${rental.marketplace_offers.title}" ist seit ${daysOverdue} ${daysOverdue === 1 ? "Tag" : "Tagen"} überfällig. Bitte gib das Spiel umgehend zurück.`,
          data: {
            booking_id: rental.id,
            offer_id: rental.offer_id,
            end_date: rental.end_date,
            days_overdue: daysOverdue,
            deposit_at_risk: rental.deposit_amount,
          },
        })

        if (!renterNotifError) {
          totalRemindersSent++
        }

        // Notify owner about overdue
        const { error: ownerNotifError } = await supabase.from("notifications").insert({
          user_id: rental.owner_id,
          type: "rental_overdue",
          title: "Rückgabe überfällig",
          message: `Die Rückgabe von "${rental.marketplace_offers.title}" ist seit ${daysOverdue} ${daysOverdue === 1 ? "Tag" : "Tagen"} überfällig.`,
          data: {
            booking_id: rental.id,
            offer_id: rental.offer_id,
            end_date: rental.end_date,
            days_overdue: daysOverdue,
            renter_id: rental.renter_id,
          },
        })

        if (!ownerNotifError) {
          totalRemindersSent++
        }

        // Mark reminder as sent
        await supabase.from("rental_reminders_sent").insert({
          booking_id: rental.id,
          reminder_type: `overdue_day_${daysOverdue}`,
        })
      }
    }

    // === 3. RENTAL START REMINDERS ===
    // Remind about rentals starting tomorrow
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split("T")[0]

    const { data: startingRentals, error: startingError } = await supabase
      .from("rental_bookings")
      .select(`
        id,
        offer_id,
        renter_id,
        owner_id,
        start_date,
        end_date,
        marketplace_offers!inner(
          title,
          image,
          pickup_address
        )
      `)
      .eq("status", "confirmed")
      .eq("start_date", tomorrowStr)

    if (!startingError && startingRentals && startingRentals.length > 0) {
      for (const rental of startingRentals) {
        // Check if reminder already sent
        const { data: existingReminder } = await supabase
          .from("rental_reminders_sent")
          .select("id")
          .eq("booking_id", rental.id)
          .eq("reminder_type", "start_tomorrow")
          .single()

        if (existingReminder) continue

        // Remind renter
        const { error: renterNotifError } = await supabase.from("notifications").insert({
          user_id: rental.renter_id,
          type: "rental_starting",
          title: "Mietbeginn morgen",
          message: `Deine Miete für "${rental.marketplace_offers.title}" beginnt morgen. Vereinbare die Übergabe mit dem Anbieter.`,
          data: {
            booking_id: rental.id,
            offer_id: rental.offer_id,
            start_date: rental.start_date,
            pickup_address: rental.marketplace_offers.pickup_address,
          },
        })

        if (!renterNotifError) {
          totalRemindersSent++
        }

        // Remind owner
        const { error: ownerNotifError } = await supabase.from("notifications").insert({
          user_id: rental.owner_id,
          type: "rental_starting",
          title: "Mietbeginn morgen",
          message: `Die Miete für "${rental.marketplace_offers.title}" beginnt morgen. Bereite das Spiel für die Übergabe vor.`,
          data: {
            booking_id: rental.id,
            offer_id: rental.offer_id,
            start_date: rental.start_date,
            renter_id: rental.renter_id,
          },
        })

        if (!ownerNotifError) {
          totalRemindersSent++
        }

        // Mark reminder as sent
        await supabase.from("rental_reminders_sent").insert({
          booking_id: rental.id,
          reminder_type: "start_tomorrow",
        })
      }
    }

    // === 4. PROMPT REVIEW AFTER RETURN ===
    // Remind to review completed rentals that haven't been reviewed yet
    const threeDaysAgo = new Date(now)
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const threeDaysAgoStr = threeDaysAgo.toISOString().split("T")[0]

    const { data: completedRentals, error: completedError } = await supabase
      .from("rental_bookings")
      .select(`
        id,
        offer_id,
        renter_id,
        owner_id,
        end_date,
        marketplace_offers!inner(
          title
        )
      `)
      .eq("status", "completed")
      .eq("end_date", threeDaysAgoStr)

    if (!completedError && completedRentals && completedRentals.length > 0) {
      for (const rental of completedRentals) {
        // Check if reviews exist
        const { data: existingReviews } = await supabase
          .from("rental_reviews")
          .select("reviewer_id")
          .eq("booking_id", rental.id)

        const reviewerIds = existingReviews?.map((r) => r.reviewer_id) || []

        // Remind renter to review if they haven't
        if (!reviewerIds.includes(rental.renter_id)) {
          const { data: existingReminder } = await supabase
            .from("rental_reminders_sent")
            .select("id")
            .eq("booking_id", rental.id)
            .eq("reminder_type", "review_renter")
            .single()

          if (!existingReminder) {
            await supabase.from("notifications").insert({
              user_id: rental.renter_id,
              type: "review_request",
              title: "Bewertung abgeben",
              message: `Wie war deine Erfahrung mit "${rental.marketplace_offers.title}"? Gib eine Bewertung ab!`,
              data: {
                booking_id: rental.id,
                offer_id: rental.offer_id,
              },
            })
            totalRemindersSent++

            await supabase.from("rental_reminders_sent").insert({
              booking_id: rental.id,
              reminder_type: "review_renter",
            })
          }
        }

        // Remind owner to review if they haven't
        if (!reviewerIds.includes(rental.owner_id)) {
          const { data: existingReminder } = await supabase
            .from("rental_reminders_sent")
            .select("id")
            .eq("booking_id", rental.id)
            .eq("reminder_type", "review_owner")
            .single()

          if (!existingReminder) {
            await supabase.from("notifications").insert({
              user_id: rental.owner_id,
              type: "review_request",
              title: "Bewertung abgeben",
              message: `Bewerte den Mieter für "${rental.marketplace_offers.title}"!`,
              data: {
                booking_id: rental.id,
                offer_id: rental.offer_id,
                renter_id: rental.renter_id,
              },
            })
            totalRemindersSent++

            await supabase.from("rental_reminders_sent").insert({
              booking_id: rental.id,
              reminder_type: "review_owner",
            })
          }
        }
      }
    }

    console.log(`[Rental Reminders] Cron completed. Sent ${totalRemindersSent} reminders.`)

    return NextResponse.json({
      success: true,
      remindersSent: totalRemindersSent,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error("[Rental Reminders] Cron error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
