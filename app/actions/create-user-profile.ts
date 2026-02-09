"use server"

import { createAdminClient } from "@/lib/supabase/admin"

interface CreateProfileInput {
  id: string
  email: string
  name: string
  username?: string | null
  avatar?: string | null
}

/**
 * Creates a user profile in the users table using the admin client.
 * This bypasses RLS, which is important because during sign-up the
 * client-side session may not be established yet, causing INSERT
 * failures with RLS policies that require auth.uid() = id.
 */
export async function createUserProfile(input: CreateProfileInput) {
  try {
    const supabase = createAdminClient()

    // Check if user already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("id", input.id)
      .maybeSingle()

    if (existing) {
      // User already exists, return their profile
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", input.id)
        .single()
      return { success: true, profile: data }
    }

    const newProfile = {
      id: input.id,
      email: input.email,
      name: input.name,
      username: input.username || null,
      avatar: input.avatar || null,
      bio: null,
      website: null,
      twitter: null,
      instagram: null,
      settings: {
        notifications: { email: true, push: true, marketing: false, security: true },
        privacy: { profileVisible: true, emailVisible: false, onlineStatus: true, allowMessages: true },
        security: { twoFactor: false, loginNotifications: true, sessionTimeout: 30 },
      },
    }

    const { data, error } = await supabase
      .from("users")
      .insert([newProfile])
      .select()
      .single()

    if (error) {
      console.error("[create-user-profile] Insert error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, profile: data }
  } catch (error: any) {
    console.error("[create-user-profile] Unexpected error:", error)
    return { success: false, error: error.message || "Unknown error" }
  }
}
