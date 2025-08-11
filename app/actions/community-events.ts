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

export async function createCommunityEvent(eventData: CommunityEventData) {
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

    // Prepare the event data for database insertion
    const dbEventData = {
      creator_id: user.id,
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

export async function getCommunityEvents() {
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

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

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
          if (!user) return false
          if (event.creator_id === user.id) return true
          if (event.selected_friends && event.selected_friends.includes(user.id)) return true
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
