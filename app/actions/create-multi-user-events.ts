"use server"

import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function createMultiUserEvents() {
  console.log("[v0] Creating events from multiple users...")

  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // First, let's create the users if they don't exist
    const users = [
      {
        id: "11111111-1111-1111-1111-111111111111",
        username: "spielmeister",
        name: "Der Spielmeister",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=spielmeister",
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        username: "boardgame_queen",
        name: "Board Game Queen",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=queen",
      },
      {
        id: "33333333-3333-3333-3333-333333333333",
        username: "dice_master",
        name: "Dice Master",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=dice",
      },
    ]

    // Insert users (ignore if they already exist)
    for (const user of users) {
      const { error: userError } = await supabase.from("users").upsert(user, { onConflict: "id" })

      if (userError) {
        console.log(`[v0] User ${user.username} might already exist:`, userError.message)
      } else {
        console.log(`[v0] User ${user.username} created/updated successfully`)
      }
    }

    // Create diverse events from different users
    const events = [
      {
        creator_id: "11111111-1111-1111-1111-111111111111",
        title: "Catan Turnier",
        description: "Großes Catan Turnier mit Preisen für die Gewinner!",
        max_players: 8,
        event_date: "2025-01-20",
        start_time: "14:00:00",
        end_time: "18:00:00",
        location: "Spielcafé München",
        is_online: false,
        is_public: true,
        requires_approval: false,
        frequency: "single",
        selected_games: JSON.stringify([{ id: "catan-001", title: "Die Siedler von Catan" }]),
        custom_games: JSON.stringify([]),
      },
      {
        creator_id: "22222222-2222-2222-2222-222222222222",
        title: "Wöchentlicher Spieleabend",
        description: "Jeden Freitag treffen wir uns zum gemeinsamen Spielen",
        max_players: 6,
        event_date: "2025-01-17",
        start_time: "19:00:00",
        end_time: "23:00:00",
        location: "Brettspielbar Berlin",
        is_online: false,
        is_public: true,
        requires_approval: true,
        frequency: "regular",
        selected_games: JSON.stringify([
          { id: "azul-001", title: "Azul" },
          { id: "wingspan-001", title: "Wingspan" },
        ]),
        custom_games: JSON.stringify([]),
      },
      {
        creator_id: "33333333-3333-3333-3333-333333333333",
        title: "Online Dungeons & Dragons",
        description: "Epische D&D Kampagne für Anfänger und Fortgeschrittene",
        max_players: 5,
        event_date: "2025-01-18",
        start_time: "20:00:00",
        end_time: "24:00:00",
        location: "Online",
        is_online: true,
        online_platform: "Discord",
        is_public: true,
        requires_approval: true,
        frequency: "recurring",
        selected_games: JSON.stringify([{ id: "dnd-001", title: "Dungeons & Dragons" }]),
        custom_games: JSON.stringify([]),
      },
    ]

    // Insert events
    const { data: eventsData, error: eventsError } = await supabase.from("ludo_events").insert(events).select()

    if (eventsError) {
      console.log("[v0] Error creating multi-user events:", eventsError.message)
      return { success: false, error: eventsError.message }
    }

    console.log("[v0] Successfully created", eventsData?.length || 0, "events from multiple users")
    return { success: true, count: eventsData?.length || 0 }
  } catch (error: any) {
    console.log("[v0] Exception creating multi-user events:", error.message)
    return { success: false, error: error.message }
  }
}
