"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import {
  notifyEventJoinRequest,
  notifyEventJoinAccepted,
  notifyEventJoinRejected,
  notifyEventParticipantJoined,
  notifyEventParticipantLeft,
} from "@/app/actions/notification-system"

export interface ParticipantActionResult {
  success: boolean
  error?: string
  data?: any
  message?: string
}

export async function joinLudoEvent(
  eventId: string,
  userId: string,
  message?: string,
): Promise<ParticipantActionResult> {
  try {
    const supabase = await createClient()

    // Check if user is already a participant
    const { data: existingParticipant } = await supabase
      .from("ludo_event_participants")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single()

    if (existingParticipant) {
      return {
        success: false,
        error: "Du bist bereits für dieses Event angemeldet",
      }
    }

    // Check if user has pending join request
    const { data: existingRequest } = await supabase
      .from("ludo_event_join_requests")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single()

    if (existingRequest && existingRequest.status === "pending") {
      return {
        success: false,
        error: "Deine Beitrittsanfrage ist bereits eingereicht",
      }
    }

    // Get event details including approval mode and max participants
    const { data: event } = await supabase
      .from("ludo_events")
      .select("max_participants, approval_mode, creator_id")
      .eq("id", eventId)
      .single()

    if (!event) {
      return {
        success: false,
        error: "Event nicht gefunden",
      }
    }

    // Count current participants (including creator)
    const { count: participantCount } = await supabase
      .from("ludo_event_participants")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)

    const totalParticipants = (participantCount || 0) + 1 // +1 for creator

    if (totalParticipants >= event.max_participants) {
      return {
        success: false,
        error: "Das Event ist bereits ausgebucht",
      }
    }

    if (event.approval_mode === "automatic") {
      // Direct participation for automatic approval
      const { data, error } = await supabase
        .from("ludo_event_participants")
        .insert({
          event_id: eventId,
          user_id: userId,
          status: "approved",
          joined_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("Error joining event:", error)
        return {
          success: false,
          error: "Fehler beim Beitreten zum Event",
        }
      }

      const { data: eventData } = await supabase
        .from("ludo_events")
        .select("title, creator_id")
        .eq("id", eventId)
        .single()

      const { data: userData } = await supabase.from("users").select("username, name").eq("id", userId).single()

      if (eventData && userData) {
        await notifyEventParticipantJoined(
          eventData.creator_id,
          userData.name || userData.username || "Ein Benutzer",
          eventData.title,
          eventId,
        )
      }

      revalidatePath("/ludo-events")
      return {
        success: true,
        data,
      }
    } else {
      // Create join request for manual approval
      const { data, error } = await supabase
        .from("ludo_event_join_requests")
        .insert({
          event_id: eventId,
          user_id: userId,
          status: "pending",
          message: message || null,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating join request:", error)
        return {
          success: false,
          error: "Fehler beim Erstellen der Beitrittsanfrage",
        }
      }

      const { data: eventData } = await supabase
        .from("ludo_events")
        .select("title, creator_id")
        .eq("id", eventId)
        .single()

      const { data: userData } = await supabase.from("users").select("username, name").eq("id", userId).single()

      if (eventData && userData) {
        await notifyEventJoinRequest(
          eventData.creator_id,
          userData.name || userData.username || "Ein Benutzer",
          eventData.title,
          eventId,
          data.id,
        )
      }

      revalidatePath("/ludo-events")
      return {
        success: true,
        data,
        message: "Deine Beitrittsanfrage wurde eingereicht und wartet auf Genehmigung",
      }
    }
  } catch (error) {
    console.error("Error in joinLudoEvent:", error)
    return {
      success: false,
      error: "Ein unerwarteter Fehler ist aufgetreten",
    }
  }
}

export async function leaveLudoEvent(eventId: string, userId: string): Promise<ParticipantActionResult> {
  try {
    const supabase = await createClient()

    const { data: eventData } = await supabase
      .from("ludo_events")
      .select("title, creator_id")
      .eq("id", eventId)
      .single()

    const { data: userData } = await supabase.from("users").select("username, name").eq("id", userId).single()

    // Remove participant or cancel request
    const { error } = await supabase
      .from("ludo_event_participants")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId)

    if (error) {
      console.error("Error leaving event:", error)
      return {
        success: false,
        error: "Fehler beim Verlassen des Events",
      }
    }

    if (eventData && userData) {
      await notifyEventParticipantLeft(
        eventData.creator_id,
        userData.name || userData.username || "Ein Benutzer",
        eventData.title,
        eventId,
      )
    }

    revalidatePath("/ludo-events")
    return {
      success: true,
    }
  } catch (error) {
    console.error("Error in leaveLudoEvent:", error)
    return {
      success: false,
      error: "Ein unerwarteter Fehler ist aufgetreten",
    }
  }
}

export async function getEventParticipants(eventId: string) {
  try {
    const supabase = await createClient()

    console.log("[v0] Fetching participants for event:", eventId)

    // Get approved participants from ludo_event_participants table
    const { data: participants, error: participantsError } = await supabase
      .from("ludo_event_participants")
      .select("id, user_id, status, joined_at")
      .eq("event_id", eventId)
      .order("joined_at", { ascending: true })

    if (participantsError) {
      console.error("[v0] Error fetching participants:", participantsError)
    }

    // Get pending/rejected requests from ludo_event_join_requests table
    const { data: requests, error: requestsError } = await supabase
      .from("ludo_event_join_requests")
      .select("id, user_id, status, message, created_at, reviewed_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true })

    if (requestsError) {
      console.error("[v0] Error fetching join requests:", requestsError)
    }

    console.log("[v0] Found participants:", participants?.length || 0)
    console.log("[v0] Found requests:", requests?.length || 0)

    // Combine and normalize the data
    const allParticipants = [
      ...(participants || []).map((p) => ({
        id: p.id,
        user_id: p.user_id,
        status: p.status,
        requested_at: p.joined_at,
        approved_at: p.joined_at,
        message: null,
      })),
      ...(requests || []).map((r) => ({
        id: r.id,
        user_id: r.user_id,
        status: r.status,
        requested_at: r.created_at,
        approved_at: r.reviewed_at,
        message: r.message,
      })),
    ]

    console.log("[v0] Combined participants:", allParticipants.length)

    // Fetch user data for all participants
    const participantsWithUsers = await Promise.all(
      allParticipants.map(async (participant) => {
        const { data: user } = await supabase
          .from("users")
          .select("id, username, name, avatar")
          .eq("id", participant.user_id)
          .single()

        return {
          ...participant,
          users: user || {
            id: participant.user_id,
            username: `User_${participant.user_id.slice(0, 8)}`,
            name: null,
            avatar: null,
          },
        }
      }),
    )

    console.log("[v0] Participants with user data:", participantsWithUsers.length)

    return {
      success: true,
      data: participantsWithUsers,
    }
  } catch (error) {
    console.error("[v0] Error in getEventParticipants:", error)
    return {
      success: false,
      error: "Ein unerwarteter Fehler ist aufgetreten",
    }
  }
}

export async function getUserParticipationStatus(eventId: string, userId: string) {
  try {
    const supabase = await createClient()

    // Check if user is already a participant
    const { data: participant } = await supabase
      .from("ludo_event_participants")
      .select("id, status, joined_at")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single()

    if (participant) {
      return {
        isParticipant: participant.status === "approved",
        isPending: false,
        isRejected: false,
        participationData: participant,
      }
    }

    // Check if user has a pending join request
    const { data: request } = await supabase
      .from("ludo_event_join_requests")
      .select("id, status, message, created_at")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single()

    return {
      isParticipant: false,
      isPending: request?.status === "pending",
      isRejected: request?.status === "rejected",
      participationData: request || null,
    }
  } catch (error) {
    return {
      isParticipant: false,
      isPending: false,
      isRejected: false,
      participationData: null,
    }
  }
}

export async function approveJoinRequest(
  requestId: string,
  eventId: string,
  creatorId: string,
): Promise<ParticipantActionResult> {
  try {
    const supabase = await createClient()

    // Get the join request to find event and user info
    const { data: request } = await supabase
      .from("ludo_event_join_requests")
      .select("event_id, user_id")
      .eq("id", requestId)
      .single()

    if (!request) {
      return {
        success: false,
        error: "Beitrittsanfrage nicht gefunden",
      }
    }

    // Approve the request
    await supabase
      .from("ludo_event_join_requests")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: creatorId,
      })
      .eq("id", requestId)

    // Add user to participants
    const { data, error } = await supabase
      .from("ludo_event_participants")
      .insert({
        event_id: request.event_id,
        user_id: request.user_id,
        status: "approved",
        joined_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error approving join request:", error)
      return {
        success: false,
        error: "Fehler beim Genehmigen der Beitrittsanfrage",
      }
    }

    const { data: eventData } = await supabase.from("ludo_events").select("title").eq("id", request.event_id).single()

    if (eventData) {
      await notifyEventJoinAccepted(request.user_id, eventData.title, request.event_id)
    }

    revalidatePath("/ludo-events")
    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error("Error in approveJoinRequest:", error)
    return {
      success: false,
      error: "Ein unerwarteter Fehler ist aufgetreten",
    }
  }
}

export async function rejectJoinRequest(requestId: string, creatorId: string): Promise<ParticipantActionResult> {
  try {
    const supabase = await createClient()

    const { data: request } = await supabase
      .from("ludo_event_join_requests")
      .select("event_id, user_id")
      .eq("id", requestId)
      .single()

    const { data, error } = await supabase
      .from("ludo_event_join_requests")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: creatorId,
      })
      .eq("id", requestId)
      .select()
      .single()

    if (error) {
      console.error("Error rejecting join request:", error)
      return {
        success: false,
        error: "Fehler beim Ablehnen der Beitrittsanfrage",
      }
    }

    if (request) {
      const { data: eventData } = await supabase.from("ludo_events").select("title").eq("id", request.event_id).single()

      if (eventData) {
        await notifyEventJoinRejected(request.user_id, eventData.title)
      }
    }

    revalidatePath("/ludo-events")
    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error("Error in rejectJoinRequest:", error)
    return {
      success: false,
      error: "Ein unerwarteter Fehler ist aufgetreten",
    }
  }
}

export async function updateParticipantStatus(
  participantId: string,
  status: "approved" | "rejected",
  creatorId: string,
): Promise<ParticipantActionResult> {
  try {
    const supabase = await createClient()

    if (status === "approved") {
      // Get the join request to find event and user info
      const { data: request } = await supabase
        .from("ludo_event_join_requests")
        .select("event_id, user_id")
        .eq("id", participantId)
        .single()

      if (!request) {
        return {
          success: false,
          error: "Beitrittsanfrage nicht gefunden",
        }
      }

      // Approve the request
      await supabase
        .from("ludo_event_join_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: creatorId,
        })
        .eq("id", participantId)

      // Add user to participants
      const { data, error } = await supabase
        .from("ludo_event_participants")
        .insert({
          event_id: request.event_id,
          user_id: request.user_id,
          status: "approved",
          joined_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("Error approving participant:", error)
        return {
          success: false,
          error: "Fehler beim Annehmen der Teilnahme",
        }
      }

      revalidatePath("/ludo-events")
      return {
        success: true,
        data,
      }
    } else {
      // Reject the request
      const { data, error } = await supabase
        .from("ludo_event_join_requests")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: creatorId,
        })
        .eq("id", participantId)
        .select()
        .single()

      if (error) {
        console.error("Error rejecting participant:", error)
        return {
          success: false,
          error: "Fehler beim Ablehnen der Teilnahme",
        }
      }

      revalidatePath("/ludo-events")
      return {
        success: true,
        data,
      }
    }
  } catch (error) {
    console.error("Error in updateParticipantStatus:", error)
    return {
      success: false,
      error: "Ein unerwarteter Fehler ist aufgetreten",
    }
  }
}
