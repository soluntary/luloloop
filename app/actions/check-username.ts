"use server"

import { createClient } from "@/lib/supabase/server"

export async function checkUsernameAvailability(username: string): Promise<{ available: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Check if username already exists
    const { data, error } = await supabase.from("users").select("username").ilike("username", username).maybeSingle()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Error checking username:", error)
      return { available: false, error: "Fehler beim Überprüfen des Benutzernamens" }
    }

    // If data exists, username is taken
    if (data) {
      return { available: false }
    }

    // Username is available
    return { available: true }
  } catch (error) {
    console.error("[v0] Error in checkUsernameAvailability:", error)
    return { available: false, error: "Fehler beim Überprüfen des Benutzernamens" }
  }
}
