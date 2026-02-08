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

// Sync username across all tables that store it
export async function syncUsernameAcrossTables(userId: string, newUsername: string) {
  const supabase = await createClient()

  try {
    const scoreTables = [
      "mastermind_scores",
      "game_2048_scores",
      "minesweeper_scores",
      "pattern_match_scores",
      "lights_out_scores",
      "sudoku_scores",
    ]

    const results = await Promise.allSettled(
      scoreTables.map(async (table) => {
        const { error } = await supabase
          .from(table)
          .update({ username: newUsername })
          .eq("user_id", userId)
        if (error) {
          console.error(`[v0] Error updating username in ${table}:`, error)
          throw error
        }
        return table
      })
    )

    // Also update forum posts, replies, messages, etc.
    const otherTables = [
      { table: "forum_posts", column: "user_id" },
      { table: "forum_replies", column: "user_id" },
      { table: "game_reviews", column: "user_id" },
      { table: "game_questions", column: "user_id" },
    ]

    await Promise.allSettled(
      otherTables.map(async ({ table, column }) => {
        const { error } = await supabase
          .from(table)
          .update({ username: newUsername })
          .eq(column, userId)
        if (error) {
          // Not all tables may have a username column, ignore errors
          console.log(`[v0] Note: Could not update username in ${table}:`, error.message)
        }
      })
    )

    const failed = results.filter((r) => r.status === "rejected")
    if (failed.length > 0) {
      console.error(`[v0] Failed to sync username in ${failed.length} tables`)
    }

    // Invalidate caches
    revalidateTag(`user-${userId}`)
    revalidateTag("users")
    revalidatePath("/profile")
    revalidatePath("/spielarena")

    return { success: true, tablesUpdated: scoreTables.length - failed.length }
  } catch (error: any) {
    console.error("[v0] Error syncing username:", error)
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
