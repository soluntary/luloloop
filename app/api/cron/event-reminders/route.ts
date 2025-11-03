import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createNotificationIfEnabled } from "@/app/actions/notification-helpers"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createClient()

  try {
    const now = new Date()
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const { data: upcomingEvents, error: eventsError } = await supabase
      .from("ludo_event_instances")
      .select(
        `
        id,
        instance_date,
        start_time,
        ludo_events (
          id,
          title,
          description
        )
      `,
      )
      .gte("instance_date", now.toISOString().split("T")[0])
      .lte("instance_date", oneWeekFromNow.toISOString().split("T")[0])

    if (eventsError) {
      console.error("[v0] Error fetching upcoming events:", eventsError)
      return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
    }

    let remindersSent = 0

    for (const eventInstance of upcomingEvents || []) {
      const eventDateTime = new Date(`${eventInstance.instance_date}T${eventInstance.start_time}`)
      const timeDiff = eventDateTime.getTime() - now.getTime()

      let reminderWindow: "1hour" | "1day" | "1week" | null = null
      if (timeDiff > 0 && timeDiff <= 60 * 60 * 1000) {
        reminderWindow = "1hour"
      } else if (timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000) {
        reminderWindow = "1day"
      } else if (timeDiff > 0 && timeDiff <= 7 * 24 * 60 * 60 * 1000) {
        reminderWindow = "1week"
      }

      if (!reminderWindow) continue

      const { data: alreadySent } = await supabase
        .from("event_reminders_sent")
        .select("id")
        .eq("event_instance_id", eventInstance.id)
        .eq("reminder_window", reminderWindow)
        .maybeSingle()

      if (alreadySent) continue

      const { data: participants, error: participantsError } = await supabase
        .from("ludo_event_instance_participants")
        .select("user_id")
        .eq("event_instance_id", eventInstance.id)

      if (participantsError) {
        console.error("[v0] Error fetching participants:", participantsError)
        continue
      }

      for (const participant of participants || []) {
        await createNotificationIfEnabled(
          participant.user_id,
          "event_reminder",
          "Event-Erinnerung",
          `Das Event "${eventInstance.ludo_events?.title}" beginnt bald!`,
          {
            event_id: eventInstance.ludo_events?.id,
            event_instance_id: eventInstance.id,
            event_title: eventInstance.ludo_events?.title,
            event_date: eventInstance.instance_date,
            event_time: eventInstance.start_time,
            reminder_window: reminderWindow,
          },
        )
        remindersSent++
      }

      await supabase.from("event_reminders_sent").insert({
        event_instance_id: eventInstance.id,
        reminder_window: reminderWindow,
        sent_at: now.toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      remindersSent,
      message: `Sent ${remindersSent} event reminders`,
    })
  } catch (error) {
    console.error("[v0] Error in event reminders cron:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
