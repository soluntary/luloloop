"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function deleteAccountAction(userId: string) {
  try {
    const supabase = await createClient()

    // Verify the user is authenticated and matches the userId
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return {
        success: false,
        error: "Nicht autorisiert",
      }
    }

    // Delete user data from the users table
    // Note: Related data in other tables should be handled by database CASCADE rules
    // or you can manually delete related data here
    const { error: deleteError } = await supabase.from("users").delete().eq("id", userId)

    if (deleteError) {
      console.error("[v0] Error deleting user data:", deleteError)
      return {
        success: false,
        error: "Fehler beim Löschen der Benutzerdaten",
      }
    }

    // Delete the auth user account
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      console.error("[v0] Error deleting auth user:", authDeleteError)
      return {
        success: false,
        error: "Fehler beim Löschen des Kontos",
      }
    }

    // Sign out the user
    await supabase.auth.signOut()

    revalidatePath("/")

    return {
      success: true,
    }
  } catch (error) {
    console.error("[v0] Error in deleteAccountAction:", error)
    return {
      success: false,
      error: "Ein unerwarteter Fehler ist aufgetreten",
    }
  }
}
