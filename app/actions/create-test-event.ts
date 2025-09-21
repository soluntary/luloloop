"use server"

import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function createTestEvent() {
  console.log("[v0] Creating test event...")

  try {
    const supabase = await createServerClient(cookies())

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Authentication error:", authError)
      return { success: false, error: "User not authenticated" }
    }

    console.log("[v0] Current authenticated user:", user.id)

    const testEvent = {
      id: crypto.randomUUID(),
      creator_id: user.id, // Use current user's ID instead of hardcoded ID
      title: "Test Ludo Event",
      description: "This is a test event to verify the system works",
      event_date: "2025-01-15",
      start_time: "19:00",
      end_time: "22:00",
      location: "Test Location",
      max_players: 4,
      frequency: "single",
      is_public: true,
      is_online: false,
      requires_approval: false,
      rules: "Test rules for the event",
      selected_games: [{ id: "783f36da-e3f2-4d16-9656-ca188829462d", title: "Cabo" }],
      image_url: "",
      created_at: new Date().toISOString(),
    }

    console.log("[v0] Inserting test event:", testEvent)

    const { data, error } = await supabase.from("ludo_events").insert([testEvent]).select()

    if (error) {
      console.error("[v0] Error creating test event:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Test event created successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Exception creating test event:", error)
    return { success: false, error: "Failed to create test event" }
  }
}
