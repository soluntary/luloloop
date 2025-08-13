"use server"

import { createServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export interface CommunityEventData {
  title: string
  frequency: "einmalig" | "regelmäßig"
  fixedDate?: string
  fixedTimeFrom?: string
  fixedTimeTo?: string
  location: string
  maxParticipants?: string
  visibility: "public" | "friends"
  approvalMode: "automatic" | "manual"
  rules?: string
  additionalInfo?: string
  selectedImage?: string
  selectedGames: Array<{ id: string; title: string; publisher?: string }>
  customGames: string[]
  selectedFriends: string[]
  timeSlots: Array<{ id: string; date: string; timeFrom: string; timeTo: string }>
  useTimeSlots?: boolean
}

// Helper function to check if a table exists
async function tableExists(supabase: any, tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).select("count").limit(1)
    return !error
  } catch (error) {
    return false
  }
}

export async function createCommunityEvent(eventData: CommunityEventData, userId?: string) {
  try {
    const supabase = createServerClient()

    // Check if the community_events table exists
    const eventsTableExists = await tableExists(supabase, "community_events")
    if (!eventsTableExists) {
      return {
        success: false,
        error: "Community Events sind noch nicht verfügbar. Die Datenbank-Tabellen müssen erst erstellt werden.",
      }
    }

    if (!userId) {
      return {
        success: false,
        error: "Benutzer nicht authentifiziert",
      }
    }

    // Verify the user exists in the database
    const { data: user, error: userError } = await supabase.from("users").select("id").eq("id", userId).single()

    if (userError || !user) {
      return {
        success: false,
        error: "Benutzer nicht gefunden",
      }
    }

    // Prepare the event data for database insertion
    const dbEventData = {
      creator_id: userId, // Use the provided userId instead of user.id
      title: eventData.title,
      description: eventData.additionalInfo || null,
      frequency: eventData.frequency,
      fixed_date: eventData.fixedDate || null,
      fixed_time_from: eventData.fixedTimeFrom || null,
      fixed_time_to: eventData.fixedTimeTo || null,
      location: eventData.location,
      max_participants: eventData.maxParticipants ? Number.parseInt(eventData.maxParticipants) : null,
      visibility: eventData.visibility,
      approval_mode: eventData.approvalMode,
      rules: eventData.rules || null,
      additional_info: eventData.additionalInfo || null,
      image_url: eventData.selectedImage || null,
      selected_games: eventData.selectedGames || [],
      custom_games: eventData.customGames || [],
      selected_friends: eventData.selectedFriends || [],
      time_slots: eventData.timeSlots || [],
      use_time_slots: eventData.useTimeSlots || false,
      active: true,
    }

    // Insert the community event
    const { data: newEvent, error: insertError } = await supabase
      .from("community_events")
      .insert([dbEventData])
      .select()
      .single()

    if (insertError) {
      console.error("Error creating community event:", insertError)
      return {
        success: false,
        error: `Fehler beim Erstellen der Community-Anzeige: ${insertError.message}`,
      }
    }

    // If using time slots, insert them into the separate table (optional)
    if (eventData.useTimeSlots && eventData.timeSlots.length > 0) {
      const timeSlotsTableExists = await tableExists(supabase, "community_event_time_slots")
      if (timeSlotsTableExists) {
        const timeSlotData = eventData.timeSlots.map((slot) => ({
          event_id: newEvent.id,
          date: slot.date,
          time_from: slot.timeFrom,
          time_to: slot.timeTo,
        }))

        const { error: timeSlotsError } = await supabase.from("community_event_time_slots").insert(timeSlotData)

        if (timeSlotsError) {
          console.error("Error creating time slots:", timeSlotsError)
          // Don't fail the entire operation for time slots error
        }
      }
    }

    // Revalidate the groups page to show the new event
    revalidatePath("/groups")

    return {
      success: true,
      data: newEvent,
      message: "Community-Anzeige wurde erfolgreich erstellt!",
    }
  } catch (error) {
    console.error("Unexpected error creating community event:", error)
    return {
      success: false,
      error: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später erneut.",
    }
  }
}

export async function getCommunityEvents(userId?: string) {
  try {
    const supabase = createServerClient()

    // Check if the community_events table exists
    const eventsTableExists = await tableExists(supabase, "community_events")
    if (!eventsTableExists) {
      console.log("Community events table does not exist yet")
      return {
        success: true,
        data: [],
        message: "Community Events Tabelle existiert noch nicht",
      }
    }

    // Try to query with creator info first, fallback to basic query
    let { data: events, error } = await supabase
      .from("community_events")
      .select(`
        *,
        creator:users!community_events_creator_id_fkey(name, email)
      `)
      .eq("active", true)
      .order("created_at", { ascending: false })

    // If the join fails (maybe users table doesn't exist), try basic query
    if (error) {
      console.warn("Failed to load events with creator info, trying basic query:", error)
      const { data: basicEvents, error: basicError } = await supabase
        .from("community_events")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false })

      if (basicError) {
        console.error("Error fetching community events:", basicError)
        return {
          success: false,
          error: "Fehler beim Laden der Community-Events",
          data: [],
        }
      }

      events = basicEvents
    }

    // Try to load participants if the table exists
    const participantsTableExists = await tableExists(supabase, "community_event_participants")
    if (participantsTableExists && events) {
      // Load participants for each event
      for (const event of events) {
        try {
          const { data: participants } = await supabase
            .from("community_event_participants")
            .select(`
              id,
              user_id,
              status,
              user:users(name)
            `)
            .eq("event_id", event.id)

          event.participants = participants || []
        } catch (participantError) {
          console.warn("Failed to load participants for event", event.id, participantError)
          event.participants = []
        }
      }
    }

    // Filter events based on visibility and user permissions
    const filteredEvents =
      events?.filter((event) => {
        // Public events are visible to everyone
        if (event.visibility === "public") {
          return true
        }

        // Private events are only visible to the creator and selected friends
        if (event.visibility === "friends") {
          if (!userId) return false
          if (event.creator_id === userId) return true
          if (event.selected_friends && event.selected_friends.includes(userId)) return true
          return false
        }

        return false
      }) || []

    return {
      success: true,
      data: filteredEvents,
    }
  } catch (error) {
    console.error("Unexpected error fetching community events:", error)
    return {
      success: false,
      error: "Ein unerwarteter Fehler ist aufgetreten",
      data: [],
    }
  }
}

export async function joinCommunityEvent(eventId: string) {
  try {
    const supabase = createServerClient()

    // Check if the community_event_participants table exists
    const participantsTableExists = await tableExists(supabase, "community_event_participants")
    if (!participantsTableExists) {
      return {
        success: false,
        error: "Event-Teilnahme ist noch nicht verfügbar. Die Datenbank-Tabellen müssen erst erstellt werden.",
      }
    }

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: "Benutzer nicht authentifiziert",
      }
    }

    // Get the event details
    const { data: event, error: eventError } = await supabase
      .from("community_events")
      .select("*")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      return {
        success: false,
        error: "Event nicht gefunden",
      }
    }

    // Check if user is already a participant
    const { data: existingParticipant } = await supabase
      .from("community_event_participants")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single()

    if (existingParticipant) {
      return {
        success: false,
        error: "Du bist bereits für dieses Event angemeldet",
      }
    }

    // Determine initial status based on approval mode
    const initialStatus = event.approval_mode === "automatic" ? "joined" : "pending"

    // Add user as participant
    const { error: joinError } = await supabase.from("community_event_participants").insert([
      {
        event_id: eventId,
        user_id: user.id,
        status: initialStatus,
      },
    ])

    if (joinError) {
      console.error("Error joining event:", joinError)
      return {
        success: false,
        error: "Fehler beim Beitreten zum Event",
      }
    }

    // Revalidate the groups page
    revalidatePath("/groups")

    return {
      success: true,
      message:
        initialStatus === "joined"
          ? "Du bist dem Event erfolgreich beigetreten!"
          : "Deine Teilnahmeanfrage wurde gesendet und wartet auf Bestätigung.",
    }
  } catch (error) {
    console.error("Unexpected error joining event:", error)
    return {
      success: false,
      error: "Ein unerwarteter Fehler ist aufgetreten",
    }
  }
}

export async function joinEventTimeSlot(eventId: string, timeSlotIndex: number) {
  try {
    const supabase = createServerClient()

    // Check if the community_event_participants table exists
    const participantsTableExists = await tableExists(supabase, "community_event_participants")
    if (!participantsTableExists) {
      return {
        success: false,
        error: "Event-Teilnahme ist noch nicht verfügbar. Die Datenbank-Tabellen müssen erst erstellt werden.",
      }
    }

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: "Benutzer nicht authentifiziert",
      }
    }

    // Get the event details
    const { data: event, error: eventError } = await supabase
      .from("community_events")
      .select("*")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      return {
        success: false,
        error: "Event nicht gefunden",
      }
    }

    // Check if the time slot index is valid
    if (!event.time_slots || timeSlotIndex >= event.time_slots.length) {
      return {
        success: false,
        error: "Ungültiger Terminvorschlag",
      }
    }

    // Check if user is already a participant
    const { data: existingParticipant } = await supabase
      .from("community_event_participants")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single()

    if (existingParticipant) {
      return {
        success: false,
        error: "Du bist bereits für dieses Event angemeldet",
      }
    }

    // Determine initial status based on approval mode
    const initialStatus = event.approval_mode === "automatic" ? "joined" : "pending"
    const selectedTimeSlot = event.time_slots[timeSlotIndex]

    // Add user as participant with selected time slot
    const { error: joinError } = await supabase.from("community_event_participants").insert([
      {
        event_id: eventId,
        user_id: user.id,
        status: initialStatus,
        selected_time_slot: timeSlotIndex,
      },
    ])

    if (joinError) {
      console.error("Error joining event time slot:", joinError)
      return {
        success: false,
        error: "Fehler beim Beitreten zum Terminvorschlag",
      }
    }

    // Revalidate the groups page
    revalidatePath("/groups")

    const timeSlotText = `${new Date(selectedTimeSlot.date).toLocaleDateString("de-DE")}${
      selectedTimeSlot.timeFrom && selectedTimeSlot.timeTo
        ? `, ${selectedTimeSlot.timeFrom} - ${selectedTimeSlot.timeTo}`
        : ""
    }`

    return {
      success: true,
      message:
        initialStatus === "joined"
          ? `Du bist dem Terminvorschlag (${timeSlotText}) erfolgreich beigetreten!`
          : `Deine Teilnahmeanfrage für den Terminvorschlag (${timeSlotText}) wurde gesendet und wartet auf Bestätigung.`,
    }
  } catch (error) {
    console.error("Unexpected error joining event time slot:", error)
    return {
      success: false,
      error: "Ein unerwarteter Fehler ist aufgetreten",
    }
  }
}

export async function updateCommunityEvent(eventId: string, eventData: Partial<CommunityEventData>) {
  try {
    const supabase = createServerClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: "Benutzer nicht authentifiziert",
      }
    }

    // Check if user is the creator of the event
    const { data: event, error: eventError } = await supabase
      .from("community_events")
      .select("creator_id")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      return {
        success: false,
        error: "Event nicht gefunden",
      }
    }

    if (event.creator_id !== user.id) {
      return {
        success: false,
        error: "Nur der Ersteller kann das Event bearbeiten",
      }
    }

    // Update the event
    const { data: updatedEvent, error: updateError } = await supabase
      .from("community_events")
      .update({
        title: eventData.title,
        description: eventData.additionalInfo,
        frequency: eventData.frequency,
        fixed_date: eventData.fixedDate,
        fixed_time_from: eventData.fixedTimeFrom,
        fixed_time_to: eventData.fixedTimeTo,
        location: eventData.location,
        max_participants: eventData.maxParticipants ? Number.parseInt(eventData.maxParticipants) : null,
        visibility: eventData.visibility,
        approval_mode: eventData.approvalMode,
        rules: eventData.rules,
        image_url: eventData.selectedImage,
        selected_games: eventData.selectedGames,
        custom_games: eventData.customGames,
        selected_friends: eventData.selectedFriends,
        time_slots: eventData.timeSlots,
        use_time_slots: eventData.useTimeSlots,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating community event:", updateError)
      return {
        success: false,
        error: `Fehler beim Aktualisieren des Events: ${updateError.message}`,
      }
    }

    revalidatePath("/groups")

    return {
      success: true,
      data: updatedEvent,
      message: "Event wurde erfolgreich aktualisiert!",
    }
  } catch (error) {
    console.error("Unexpected error updating community event:", error)
    return {
      success: false,
      error: "Ein unerwarteter Fehler ist aufgetreten",
    }
  }
}

export async function deleteCommunityEvent(eventId: string) {
  try {
    const supabase = createServerClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: "Benutzer nicht authentifiziert",
      }
    }

    // Check if user is the creator of the event
    const { data: event, error: eventError } = await supabase
      .from("community_events")
      .select("creator_id")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      return {
        success: false,
        error: "Event nicht gefunden",
      }
    }

    if (event.creator_id !== user.id) {
      return {
        success: false,
        error: "Nur der Ersteller kann das Event löschen",
      }
    }

    // Soft delete the event
    const { error: deleteError } = await supabase.from("community_events").update({ active: false }).eq("id", eventId)

    if (deleteError) {
      console.error("Error deleting community event:", deleteError)
      return {
        success: false,
        error: `Fehler beim Löschen des Events: ${deleteError.message}`,
      }
    }

    revalidatePath("/groups")

    return {
      success: true,
      message: "Event wurde erfolgreich gelöscht!",
    }
  } catch (error) {
    console.error("Unexpected error deleting community event:", error)
    return {
      success: false,
      error: "Ein unerwarteter Fehler ist aufgetreten",
    }
  }
}

export async function manageEventParticipant(eventId: string, userId: string, action: "approve" | "reject" | "remove") {
  try {
    const supabase = createServerClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: "Benutzer nicht authentifiziert",
      }
    }

    // Check if user is the creator of the event
    const { data: event, error: eventError } = await supabase
      .from("community_events")
      .select("creator_id")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      return {
        success: false,
        error: "Event nicht gefunden",
      }
    }

    if (event.creator_id !== user.id) {
      return {
        success: false,
        error: "Nur der Ersteller kann Teilnehmer verwalten",
      }
    }

    let updateData: any = {}
    let successMessage = ""

    switch (action) {
      case "approve":
        updateData = { status: "joined" }
        successMessage = "Teilnehmer wurde genehmigt"
        break
      case "reject":
        updateData = { status: "declined" }
        successMessage = "Teilnehmer wurde abgelehnt"
        break
      case "remove":
        // Delete the participant record
        const { error: removeError } = await supabase
          .from("community_event_participants")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", userId)

        if (removeError) {
          console.error("Error removing participant:", removeError)
          return {
            success: false,
            error: "Fehler beim Entfernen des Teilnehmers",
          }
        }

        revalidatePath("/groups")
        return {
          success: true,
          message: "Teilnehmer wurde entfernt",
        }
    }

    // Update participant status
    const { error: updateError } = await supabase
      .from("community_event_participants")
      .update(updateData)
      .eq("event_id", eventId)
      .eq("user_id", userId)

    if (updateError) {
      console.error("Error updating participant:", updateError)
      return {
        success: false,
        error: "Fehler beim Aktualisieren des Teilnehmers",
      }
    }

    revalidatePath("/groups")

    return {
      success: true,
      message: successMessage,
    }
  } catch (error) {
    console.error("Unexpected error managing participant:", error)
    return {
      success: false,
      error: "Ein unerwarteter Fehler ist aufgetreten",
    }
  }
}

export async function addEventComment(eventId: string, comment: string) {
  try {
    const supabase = createServerClient()

    // Check if comments table exists
    const commentsTableExists = await tableExists(supabase, "community_event_comments")
    if (!commentsTableExists) {
      return {
        success: false,
        error: "Kommentare sind noch nicht verfügbar. Die Datenbank-Tabellen müssen erst erstellt werden.",
      }
    }

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: "Benutzer nicht authentifiziert",
      }
    }

    // Add the comment
    const { data: newComment, error: insertError } = await supabase
      .from("community_event_comments")
      .insert([
        {
          event_id: eventId,
          user_id: user.id,
          comment: comment.trim(),
        },
      ])
      .select(`
        *,
        user:users(name)
      `)
      .single()

    if (insertError) {
      console.error("Error adding comment:", insertError)
      return {
        success: false,
        error: "Fehler beim Hinzufügen des Kommentars",
      }
    }

    revalidatePath("/groups")

    return {
      success: true,
      data: newComment,
      message: "Kommentar wurde hinzugefügt",
    }
  } catch (error) {
    console.error("Unexpected error adding comment:", error)
    return {
      success: false,
      error: "Ein unerwarteter Fehler ist aufgetreten",
    }
  }
}

export async function getEventComments(eventId: string) {
  try {
    const supabase = createServerClient()

    // Check if comments table exists
    const commentsTableExists = await tableExists(supabase, "community_event_comments")
    if (!commentsTableExists) {
      return {
        success: true,
        data: [],
      }
    }

    const { data: comments, error } = await supabase
      .from("community_event_comments")
      .select(`
        *,
        user:users(name)
      `)
      .eq("event_id", eventId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching comments:", error)
      return {
        success: false,
        error: "Fehler beim Laden der Kommentare",
        data: [],
      }
    }

    return {
      success: true,
      data: comments || [],
    }
  } catch (error) {
    console.error("Unexpected error fetching comments:", error)
    return {
      success: false,
      error: "Ein unerwarteter Fehler ist aufgetreten",
      data: [],
    }
  }
}

export async function leaveEvent(eventId: string) {
  try {
    const supabase = createServerClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: "Benutzer nicht authentifiziert",
      }
    }

    // Remove user from event participants
    const { error: leaveError } = await supabase
      .from("community_event_participants")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", user.id)

    if (leaveError) {
      console.error("Error leaving event:", leaveError)
      return {
        success: false,
        error: "Fehler beim Verlassen des Events",
      }
    }

    revalidatePath("/groups")

    return {
      success: true,
      message: "Du hast das Event erfolgreich verlassen",
    }
  } catch (error) {
    console.error("Unexpected error leaving event:", error)
    return {
      success: false,
      error: "Ein unerwarteter Fehler ist aufgetreten",
    }
  }
}
