import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// This API route is called by Vercel Cron every 15 minutes
export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const now = new Date()

    // Define reminder windows
    const reminderWindows = [
      { type: "1_hour", minutes: 60 },
      { type: "1_day", minutes: 24 * 60 },
      { type: "1_week", minutes: 7 * 24 * 60 },
    ]

    let totalRemindersSent = 0

    for (const window of reminderWindows) {
      // Calculate the time window for this reminder type
      const reminderTime = new Date(now.getTime() + window.minutes * 60 * 1000)
      const windowStart = new Date(reminderTime.getTime() - 7.5 * 60 * 1000) // 7.5 minutes before
      const windowEnd = new Date(reminderTime.getTime() + 7.5 * 60 * 1000) // 7.5 minutes after

      // Find event instances starting within this window
      const { data: instances, error: instancesError } = await supabase
        .from("ludo_event_instances")
        .select(`
          id,
          instance_date,
          start_time,
          event_id,
          ludo_events!inner(
            id,
            title,
            creator_id
          )
        `)
        .eq("status", "scheduled")
        .gte("instance_date", windowStart.toISOString().split("T")[0])
        .lte("instance_date", windowEnd.toISOString().split("T")[0])

      if (instancesError) {
        console.error(`[v0] Error fetching instances for ${window.type}:`, instancesError)
        continue
      }

      if (!instances || instances.length === 0) {
        continue
      }

      // Filter instances by time
      const relevantInstances = instances.filter((instance) => {
        const instanceDateTime = new Date(`${instance.instance_date}T${instance.start_time}`)
        return instanceDateTime >= windowStart && instanceDateTime <= windowEnd
      })

      console.log(`[v0] Found ${relevantInstances.length} instances for ${window.type} reminders`)

      // For each instance, find participants and send reminders
      for (const instance of relevantInstances) {
        // Get all registered participants for this instance
        const { data: participants, error: participantsError } = await supabase
          .from("ludo_event_instance_participants")
          .select(`
            user_id,
            users!inner(
              id,
              username,
              name
            )
          `)
          .eq("instance_id", instance.id)
          .eq("status", "registered")

        if (participantsError) {
          console.error(`[v0] Error fetching participants for instance ${instance.id}:`, participantsError)
          continue
        }

        if (!participants || participants.length === 0) {
          continue
        }

        // Send reminder to each participant
        for (const participant of participants) {
          // Check if reminder already sent
          const { data: existingReminder } = await supabase
            .from("event_reminders_sent")
            .select("id")
            .eq("user_id", participant.user_id)
            .eq("instance_id", instance.id)
            .eq("reminder_type", window.type)
            .single()

          if (existingReminder) {
            continue // Already sent
          }

          // Check if user has event reminders enabled
          const { data: preferences } = await supabase
            .from("social_notification_preferences")
            .select("event_reminders")
            .eq("user_id", participant.user_id)
            .single()

          if (preferences && preferences.event_reminders === false) {
            continue // User has disabled event reminders
          }

          // Create reminder notification
          const instanceDateTime = new Date(`${instance.instance_date}T${instance.start_time}`)
          const timeUntilEvent = window.type === "1_hour" ? "1 Stunde" : window.type === "1_day" ? "1 Tag" : "1 Woche"

          const { error: notificationError } = await supabase.from("notifications").insert({
            user_id: participant.user_id,
            type: "event_reminder",
            title: "Event-Erinnerung",
            message: `Das Event "${instance.ludo_events.title}" beginnt in ${timeUntilEvent}`,
            data: {
              event_id: instance.event_id,
              instance_id: instance.id,
              instance_date: instance.instance_date,
              start_time: instance.start_time,
              reminder_type: window.type,
            },
          })

          if (notificationError) {
            console.error(`[v0] Error creating notification for user ${participant.user_id}:`, notificationError)
            continue
          }

          // Mark reminder as sent
          const { error: sentError } = await supabase.from("event_reminders_sent").insert({
            user_id: participant.user_id,
            instance_id: instance.id,
            reminder_type: window.type,
          })

          if (sentError) {
            console.error(`[v0] Error marking reminder as sent:`, sentError)
          } else {
            totalRemindersSent++
          }
        }
      }
    }

    console.log(`[v0] Event reminders cron completed. Sent ${totalRemindersSent} reminders.`)

    return NextResponse.json({
      success: true,
      remindersSent: totalRemindersSent,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error("[v0] Event reminders cron error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
