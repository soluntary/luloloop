"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath, revalidateTag } from "next/cache"

export async function updateUserProfile(userId: string, updates: any) {
  const supabase = await createClient()

  try {
    console.log("[v0] Server: Updating user profile:", userId, updates)

    const cleanedUpdates = { ...updates }

    // Handle date fields that might be empty strings
    const dateFields = ["birth_date", "created_at", "updated_at"]
    dateFields.forEach((field) => {
      if (cleanedUpdates[field] === "") {
        cleanedUpdates[field] = null
      }
    })

    console.log("[v0] Server: Cleaned updates:", cleanedUpdates)

    const { data, error } = await supabase.from("users").update(cleanedUpdates).eq("id", userId).select().single()

    if (error) throw error

    // Comprehensive cache invalidation
    revalidateTag(`user-${userId}`)
    revalidateTag(`profile-${userId}`)
    revalidateTag("users")
    revalidateTag("friends")
    revalidateTag("participants")
    revalidateTag("members")

    // Revalidate specific paths that might show user data
    revalidatePath("/profile")
    revalidatePath("/friends")
    revalidatePath("/events")
    revalidatePath("/forum")
    revalidatePath("/messages")

    console.log("[v0] Server: Profile updated successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Server: Error updating profile:", error)
    return { success: false, error: error.message }
  }
}

// Batch update multiple users (for admin operations)
export async function batchUpdateUsers(updates: Array<{ id: string; data: any }>) {
  const supabase = await createClient()

  try {
    const results = await Promise.all(
      updates.map(async ({ id, data }) => {
        const { error } = await supabase.from("users").update(data).eq("id", id)

        if (error) throw error

        // Invalidate cache for each user
        revalidateTag(`user-${id}`)
        revalidateTag(`profile-${id}`)

        return { id, success: true }
      }),
    )

    // Global cache invalidation
    revalidateTag("users")
    revalidateTag("friends")
    revalidateTag("participants")
    revalidateTag("members")

    return { success: true, results }
  } catch (error) {
    console.error("[v0] Server: Error in batch update:", error)
    return { success: false, error: error.message }
  }
}
