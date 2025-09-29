"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { withRateLimit } from "@/lib/supabase/rate-limit"

export interface LudoEventData {
  title: string
  description?: string
  gameType: "classic" | "team" | "tournament" | "casual"
  difficultyLevel: "beginner" | "intermediate" | "advanced" | "expert"
  maxPlayers: number
  eventDate: string
  startTime: string
  endTime?: string
  location?: string
  isOnline: boolean
  onlinePlatform?: string
  isPublic: boolean
  requiresApproval: boolean
  organizerOnly?: boolean
  prizeInfo?: string
  rules?: string
  additionalInfo?: string
  imageUrl?: string
  selectedGames?: any[]
  customGames?: string[]
  selectedFriends?: string[]
  frequency?: "single" | "regular" | "recurring" | "casual"
  interval?: "weekly" | "biweekly" | "monthly" | "other"
  customInterval?: string
  visibility?: "public" | "friends_only"
  additionalDates?: string[]
  additionalStartTimes?: string[]
  additionalEndTimes?: string[]
}

export async function createLudoEvent(eventData: LudoEventData, creatorId: string) {
  try {
    console.log("[v0] Starting createLudoEvent with creatorId:", creatorId)
    console.log("[v0] Additional dates received:", eventData.additionalDates)
    console.log("[v0] Additional start times received:", eventData.additionalStartTimes)
    console.log("[v0] Additional end times received:", eventData.additionalEndTimes)

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Authentication failed:", authError?.message || "Auth session missing!")
      return {
        success: false,
        error: "Benutzer nicht authentifiziert. Bitte melden Sie sich erneut an.",
      }
    }

    if (user.id !== creatorId) {
      console.error("[v0] User ID mismatch:", user.id, "vs", creatorId)
      return { success: false, error: "Benutzer-ID stimmt nicht überein" }
    }

    console.log("[v0] Authentication successful for user:", user.id)

    const dbEventData = {
      title: eventData.title,
      description: eventData.description || eventData.additionalInfo,
      max_participants: eventData.maxPlayers,
      event_date: eventData.eventDate,
      start_time: eventData.startTime,
      end_time: eventData.endTime,
      location: eventData.location,
      creator_id: creatorId,
      selected_games: eventData.selectedGames || [],
      frequency: eventData.frequency || "single",
      interval_type: eventData.frequency === "regular" ? eventData.interval : null,
      custom_interval:
        eventData.frequency === "regular" && eventData.interval === "other" ? eventData.customInterval : null,
      image_url: eventData.imageUrl || null,
      is_public: eventData.isPublic !== false, // Default to true
      visibility: eventData.visibility === "friends_only" ? "friends_only" : "public",
      approval_mode: eventData.requiresApproval ? "manual" : "automatic",
      organizer_only: eventData.organizerOnly || false,
    }

    console.log("[v0] Database insert data:", JSON.stringify(dbEventData, null, 2))

    const { data, error } = await supabase.from("ludo_events").insert([dbEventData]).select().single()

    if (error) {
      console.error("[v0] Database insert error:", error.message)

      if (error.message?.includes("violates row-level security")) {
        return {
          success: false,
          error: "Keine Berechtigung zum Erstellen von Events. RLS-Richtlinien müssen ausgeführt werden.",
        }
      }

      throw error
    }

    console.log("[v0] Event created successfully:", data.id)

    if (eventData.visibility === "friends_only" && eventData.selectedFriends && eventData.selectedFriends.length > 0) {
      // Get creator's username for notifications
      const { data: creatorData } = await supabase.from("users").select("username, name").eq("id", creatorId).single()

      const creatorName = creatorData?.name || creatorData?.username || "Ein Freund"

      const invitations = eventData.selectedFriends.map((friendId) => ({
        event_id: data.id,
        inviter_id: creatorId,
        invitee_id: friendId,
        status: "pending",
        message: `Du wurdest zu "${eventData.title}" eingeladen!`,
        created_at: new Date().toISOString(),
      }))

      const { error: invitationError } = await supabase.from("ludo_event_invitations").insert(invitations)

      if (invitationError) {
        console.error("[v0] Error creating invitations:", invitationError)
      } else {
        console.log("[v0] Created invitations for", invitations.length, "friends")

        // Create notifications for each invited friend
        const notifications = eventData.selectedFriends.map((friendId) => ({
          user_id: friendId,
          type: "event_invitation",
          title: "Event-Einladung erhalten",
          message: `${creatorName} hat dich zu "${eventData.title}" eingeladen`,
          data: {
            event_id: data.id,
            event_title: eventData.title,
            event_date: eventData.eventDate,
            event_time: eventData.startTime,
            inviter_name: creatorName,
            inviter_id: creatorId,
          },
          read: false,
          created_at: new Date().toISOString(),
        }))

        const { error: notificationError } = await supabase.from("notifications").insert(notifications)

        if (notificationError) {
          console.error("[v0] Error creating notifications:", notificationError)
        } else {
          console.log("[v0] Created notifications for", notifications.length, "friends")
        }

        // Also add to notification queue for push/email notifications
        const queueNotifications = eventData.selectedFriends.map((friendId) => ({
          user_id: friendId,
          notification_type: "event_invitation",
          title: "Event-Einladung erhalten",
          message: `${creatorName} hat dich zu "${eventData.title}" eingeladen`,
          data: {
            event_id: data.id,
            event_title: eventData.title,
            event_date: eventData.eventDate,
            event_time: eventData.startTime,
            inviter_name: creatorName,
            inviter_id: creatorId,
          },
          priority: 2, // Medium priority
          scheduled_for: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Expire in 7 days
          created_at: new Date().toISOString(),
        }))

        const { error: queueError } = await supabase.from("notification_queue").insert(queueNotifications)

        if (queueError) {
          console.error("[v0] Error adding notifications to queue:", queueError)
        } else {
          console.log("[v0] Added notifications to queue for", queueNotifications.length, "friends")
        }
      }
    }

    if (!eventData.organizerOnly) {
      const { error: participantError } = await supabase.from("ludo_event_participants").insert([
        {
          event_id: data.id,
          user_id: creatorId,
          status: "approved",
          joined_at: new Date().toISOString(),
        },
      ])

      if (participantError) {
        console.error("[v0] Error adding creator as participant:", participantError)
      } else {
        console.log("[v0] Creator added as participant")
      }
    } else {
      console.log("[v0] Creator set as organizer only, not added as participant")
    }

    if (
      eventData.frequency === "regular" ||
      eventData.frequency === "recurring" ||
      eventData.frequency === "regelmässig" ||
      eventData.frequency === "wiederholend"
    ) {
      console.log("[v0] Creating event instances for regular/recurring event including first date")

      const instances = []

      // Always include the first date as an instance for regular/recurring events
      instances.push({
        instance_date: eventData.eventDate,
        start_time: eventData.startTime,
        end_time: eventData.endTime,
        max_participants: eventData.maxPlayers,
        status: "active",
        notes: "First date (main event date)",
      })

      // Add additional dates if provided
      if (eventData.additionalDates && eventData.additionalDates.length > 0) {
        const additionalInstances = eventData.additionalDates
          .filter((date) => date.trim() !== "") // Filter out empty dates
          .map((date, index) => ({
            instance_date: date,
            start_time: eventData.additionalStartTimes?.[index] || eventData.startTime,
            end_time: eventData.additionalEndTimes?.[index] || eventData.endTime,
            max_participants: eventData.maxPlayers,
            status: "active",
            notes: `Additional date ${index + 1}`,
          }))

        instances.push(...additionalInstances)
      }

      if (instances.length > 0) {
        const instancesWithEventId = instances.map((instance) => ({
          ...instance,
          event_id: data.id,
        }))

        console.log("[v0] Inserting event instances:", instancesWithEventId)

        const { error: instanceError } = await supabase.from("ludo_event_instances").insert(instancesWithEventId)

        if (instanceError) {
          console.error("[v0] Error creating event instances:", instanceError)
          // Don't fail the entire event creation if instances fail
        } else {
          console.log("[v0] Successfully created", instances.length, "event instances")
        }
      }
    } else if (eventData.additionalDates && eventData.additionalDates.length > 0) {
      // For single events with additional dates (legacy support)
      console.log("[v0] Creating event instances for additional dates on single event")

      const instances = eventData.additionalDates
        .filter((date) => date.trim() !== "") // Filter out empty dates
        .map((date, index) => ({
          instance_date: date,
          start_time: eventData.additionalStartTimes?.[index] || eventData.startTime,
          end_time: eventData.additionalEndTimes?.[index] || eventData.endTime,
          max_participants: eventData.maxPlayers,
          status: "active",
          notes: `Additional date ${index + 1}`,
        }))

      if (instances.length > 0) {
        const instancesWithEventId = instances.map((instance) => ({
          ...instance,
          event_id: data.id,
        }))

        console.log("[v0] Inserting event instances:", instancesWithEventId)

        const { error: instanceError } = await supabase.from("ludo_event_instances").insert(instancesWithEventId)

        if (instanceError) {
          console.error("[v0] Error creating event instances:", instanceError)
          // Don't fail the entire event creation if instances fail
        } else {
          console.log("[v0] Successfully created", instances.length, "event instances")
        }
      }
    }

    revalidatePath("/ludo-events")
    return { success: true, data }
  } catch (error: any) {
    console.error("[v0] Error creating Ludo event:", error.message)

    if (error.message?.includes("violates row-level security")) {
      return {
        success: false,
        error: "Keine Berechtigung zum Erstellen von Events. Bitte führen Sie die RLS-Richtlinien aus.",
      }
    }

    return { success: false, error: "Fehler beim Erstellen des Events: " + error.message }
  }
}

export async function updateLudoEvent(eventId: string, eventData: Partial<LudoEventData>, userId: string) {
  try {
    const supabase = await createClient()

    const { data: event, error: fetchError } = await supabase
      .from("ludo_events")
      .select("creator_id")
      .eq("id", eventId)
      .single()

    if (fetchError) throw fetchError
    if (event.creator_id !== userId) {
      return { success: false, error: "Keine Berechtigung zum Bearbeiten dieses Events" }
    }

    const dbEventData: any = {}
    if (eventData.title !== undefined) dbEventData.title = eventData.title
    if (eventData.description !== undefined) dbEventData.description = eventData.description
    if (eventData.maxPlayers !== undefined) dbEventData.max_participants = eventData.maxPlayers
    if (eventData.eventDate !== undefined) dbEventData.event_date = eventData.eventDate
    if (eventData.startTime !== undefined) dbEventData.start_time = eventData.startTime
    if (eventData.endTime !== undefined) dbEventData.end_time = eventData.endTime
    if (eventData.location !== undefined) dbEventData.location = eventData.location
    if (eventData.isPublic !== undefined) dbEventData.is_public = eventData.isPublic
    if (eventData.selectedGames !== undefined) dbEventData.selected_games = eventData.selectedGames
    if (eventData.frequency !== undefined) dbEventData.frequency = eventData.frequency
    if (eventData.interval !== undefined)
      dbEventData.interval_type = eventData.frequency === "regular" ? eventData.interval : null
    if (eventData.customInterval !== undefined)
      dbEventData.custom_interval =
        eventData.frequency === "regular" && eventData.interval === "other" ? eventData.customInterval : null
    if (eventData.imageUrl !== undefined) dbEventData.image_url = eventData.imageUrl
    if (eventData.visibility !== undefined)
      dbEventData.visibility = eventData.visibility === "friends_only" ? "friends_only" : "public"
    if (eventData.requiresApproval !== undefined)
      dbEventData.approval_mode = eventData.requiresApproval ? "manual" : "automatic"
    if (eventData.organizerOnly !== undefined) dbEventData.organizer_only = eventData.organizerOnly

    const { data, error } = await supabase.from("ludo_events").update(dbEventData).eq("id", eventId).select().single()

    if (error) throw error

    revalidatePath("/ludo-events")
    return { success: true, data }
  } catch (error) {
    console.error("Error updating Ludo event:", error)
    return { success: false, error: "Fehler beim Aktualisieren des Events" }
  }
}

export async function deleteLudoEvent(eventId: string, userId: string) {
  try {
    const supabase = await createClient()

    const { data: event, error: fetchError } = await supabase
      .from("ludo_events")
      .select("creator_id")
      .eq("id", eventId)
      .single()

    if (fetchError) throw fetchError
    if (event.creator_id !== userId) {
      return { success: false, error: "Keine Berechtigung zum Löschen dieses Events" }
    }

    await supabase.from("ludo_event_participants").delete().eq("event_id", eventId)
    await supabase.from("ludo_event_invitations").delete().eq("event_id", eventId)

    const { error } = await supabase.from("ludo_events").delete().eq("id", eventId)

    if (error) throw error

    revalidatePath("/ludo-events")
    return { success: true }
  } catch (error) {
    console.error("Error deleting Ludo event:", error)
    return { success: false, error: "Fehler beim Löschen des Events" }
  }
}

export async function joinLudoEvent(eventId: string, userId: string) {
  try {
    const supabase = await createClient()

    const { data: event, error: eventError } = await supabase
      .from("ludo_events")
      .select("max_participants, visibility")
      .eq("id", eventId)
      .single()

    if (eventError) throw eventError

    const { count } = await supabase
      .from("ludo_event_participants")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "registered")

    if (count && count >= event.max_participants) {
      return { success: false, error: "Event ist bereits ausgebucht" }
    }

    const { data: existingParticipant } = await supabase
      .from("ludo_event_participants")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single()

    if (existingParticipant) {
      return { success: false, error: "Du bist bereits für dieses Event angemeldet" }
    }

    const status = event.visibility === "friends_only" ? "pending" : "approved"
    const { error } = await supabase.from("ludo_event_participants").insert([
      {
        event_id: eventId,
        user_id: userId,
        status,
        requested_at: new Date().toISOString(),
      },
    ])

    if (error) throw error

    revalidatePath("/ludo-events")
    return {
      success: true,
      message: status === "approved" ? "Erfolgreich für das Event angemeldet!" : "Einladung angefordert!",
    }
  } catch (error) {
    console.error("Error joining Ludo event:", error)
    return { success: false, error: "Fehler beim Anmelden für das Event" }
  }
}

export async function leaveLudoEvent(eventId: string, userId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("ludo_event_participants")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId)

    if (error) throw error

    revalidatePath("/ludo-events")
    return { success: true, message: "Erfolgreich vom Event abgemeldet" }
  } catch (error) {
    console.error("Error leaving Ludo event:", error)
    return { success: false, error: "Fehler beim Abmelden vom Event" }
  }
}

export async function approveParticipant(eventId: string, participantId: string, creatorId: string) {
  try {
    const supabase = await createClient()

    const { data: event, error: eventError } = await supabase
      .from("ludo_events")
      .select("creator_id, max_participants")
      .eq("id", eventId)
      .single()

    if (eventError) throw eventError
    if (event.creator_id !== creatorId) {
      return { success: false, error: "Keine Berechtigung" }
    }

    const { count } = await supabase
      .from("ludo_event_participants")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "registered")

    if (count && count >= event.max_participants) {
      return { success: false, error: "Event ist bereits ausgebucht" }
    }

    const { error } = await supabase
      .from("ludo_event_participants")
      .update({ status: "approved", joined_at: new Date().toISOString(), approved_by: creatorId })
      .eq("id", participantId)
      .eq("event_id", eventId)

    if (error) throw error

    revalidatePath("/ludo-events")
    return { success: true, message: "Teilnahme angenommen" }
  } catch (error) {
    console.error("Error approving participant:", error)
    return { success: false, error: "Fehler bei der Annahme der Teilnahme" }
  }
}

export async function rejectParticipant(eventId: string, participantId: string, creatorId: string) {
  try {
    const supabase = await createClient()

    const { data: event, error: eventError } = await supabase
      .from("ludo_events")
      .select("creator_id")
      .eq("id", eventId)
      .single()

    if (eventError) throw eventError
    if (event.creator_id !== creatorId) {
      return { success: false, error: "Keine Berechtigung" }
    }

    const { error } = await supabase
      .from("ludo_event_participants")
      .delete()
      .eq("id", participantId)
      .eq("event_id", eventId)

    if (error) throw error

    revalidatePath("/ludo-events")
    return { success: true, message: "Teilnahme abgelehnt" }
  } catch (error) {
    console.error("Error rejecting participant:", error)
    return { success: false, error: "Fehler beim Ablehnen der Teilnahme" }
  }
}

export async function getEventParticipants(eventId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("ludo_event_participants")
      .select(`
        id,
        user_id,
        status,
        registered_at,
        joined_at,
        approved_by,
        user:user_id (
          id,
          username,
          name,
          avatar
        )
      `)
      .eq("event_id", eventId)
      .order("registered_at", { ascending: true })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching event participants:", error)
    return { success: false, error: "Fehler beim Laden der Teilnehmer" }
  }
}

export async function getUserEventStatus(eventId: string, userId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("ludo_event_participants")
      .select("status")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single()

    if (error && error.code !== "PGRST116") throw error

    return { success: true, status: data?.status || null }
  } catch (error) {
    console.error("Error fetching user event status:", error)
    return { success: false, error: "Fehler beim Laden des Anmeldestatus" }
  }
}

export async function getLudoEvent(eventId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("ludo_events")
      .select(`
        *,
        creator:creator_id (
          id,
          username,
          name,
          avatar
        )
      `)
      .eq("id", eventId)
      .single()

    if (error) throw error

    const { count } = await supabase
      .from("ludo_event_participants")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "registered")

    return {
      success: true,
      data: {
        ...data,
        participant_count: count || 0,
      },
    }
  } catch (error) {
    console.error("Error fetching Ludo event:", error)
    return { success: false, error: "Fehler beim Laden des Events" }
  }
}

export async function getUserFriends(userId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("friends")
      .select(`
        friend_id,
        users:friend_id (
          id,
          username,
          name,
          avatar
        )
      `)
      .eq("user_id", userId)
      .eq("status", "accepted")

    if (error) throw error

    return {
      success: true,
      data:
        data?.map((friend) => ({
          id: friend.friend_id,
          username: friend.users?.username || "Unknown",
          name: friend.users?.name || friend.users?.username || "Unknown User",
          avatar: friend.users?.avatar || "/placeholder.svg",
        })) || [],
    }
  } catch (error) {
    console.error("Error fetching user friends:", error)
    return { success: false, error: "Fehler beim Laden der Freunde" }
  }
}

export async function respondToEventInvitation(
  invitationId: string,
  response: "accepted" | "declined",
  userId: string,
) {
  try {
    const supabase = await createClient()

    const { data: invitation, error: fetchError } = await supabase
      .from("ludo_event_invitations")
      .select(`
        event_id,
        inviter_id,
        ludo_events!inner (
          title,
          event_date,
          start_time
        )
      `)
      .eq("id", invitationId)
      .eq("invitee_id", userId)
      .single()

    if (fetchError) throw fetchError

    // Get user info for notification
    const { data: userData } = await supabase.from("users").select("username, name").eq("id", userId).single()

    const userName = userData?.name || userData?.username || "Ein Freund"

    const { data: updatedInvitation, error: updateError } = await supabase
      .from("ludo_event_invitations")
      .update({
        status: response,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invitationId)
      .eq("invitee_id", userId)
      .select("event_id")
      .single()

    if (updateError) throw updateError

    if (response === "accepted") {
      const { error: participantError } = await supabase.from("ludo_event_participants").insert({
        event_id: updatedInvitation.event_id,
        user_id: userId,
        status: "approved",
        joined_at: new Date().toISOString(),
      })

      if (participantError) {
        console.error("Error adding participant:", participantError)
        throw participantError
      }
    }

    const notificationMessage =
      response === "accepted"
        ? `${userName} hat die Einladung zu "${invitation.ludo_events.title}" angenommen`
        : `${userName} hat die Einladung zu "${invitation.ludo_events.title}" abgelehnt`

    const { error: notificationError } = await supabase.from("notifications").insert({
      user_id: invitation.inviter_id,
      type: "event_invitation",
      title: response === "accepted" ? "Einladung angenommen" : "Einladung abgelehnt",
      message: notificationMessage,
      data: {
        event_id: invitation.event_id,
        event_title: invitation.ludo_events.title,
        event_date: invitation.ludo_events.event_date,
        event_time: invitation.ludo_events.start_time,
        responder_name: userName,
        responder_id: userId,
        response: response,
      },
      read: false,
      created_at: new Date().toISOString(),
    })

    if (notificationError) {
      console.error("Error creating organizer notification:", notificationError)
    }

    revalidatePath("/ludo-events")
    return {
      success: true,
      message: response === "accepted" ? "Einladung angenommen!" : "Einladung abgelehnt",
    }
  } catch (error) {
    console.error("Error responding to invitation:", error)
    return { success: false, error: "Fehler beim Antworten auf die Einladung" }
  }
}

export async function getUserEventInvitations(userId: string) {
  return withRateLimit(
    async () => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from("ludo_event_invitations")
        .select("id, status, message, created_at, event_id, inviter_id")
        .eq("invitee_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (error) throw error

      return { success: true, data: data || [] }
    },
    { success: true, data: [] },
  )
}
