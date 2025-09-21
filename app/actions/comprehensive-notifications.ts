"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateSocialNotificationPreferences(preferences: {
  friend_requests?: { platform?: boolean; email?: boolean }
  friend_accepts?: { platform?: boolean; email?: boolean }
  friend_declines?: { platform?: boolean; email?: boolean }
  forum_replies?: { platform?: boolean; email?: boolean }
  forum_comment_replies?: { platform?: boolean; email?: boolean }
  shelf_access_requests?: { platform?: boolean; email?: boolean }
  message_notifications?: { platform?: boolean; email?: boolean }
  event_invitations?: { platform?: boolean; email?: boolean }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Get current settings
  const { data: userData, error: fetchError } = await supabase
    .from("users")
    .select("settings")
    .eq("id", user.id)
    .single()

  if (fetchError) throw new Error(`Error fetching current settings: ${fetchError.message}`)

  // Update social notification preferences in the settings JSONB
  const updatedSettings = {
    ...userData.settings,
    notifications: {
      ...userData.settings?.notifications,
      social: preferences,
    },
  }

  const { error } = await supabase.from("users").update({ settings: updatedSettings }).eq("id", user.id)

  if (error) throw error
  revalidatePath("/profile")
}

export async function updatePrivacySettings(settings: {
  profile_visibility?: string
  allow_friend_requests?: boolean
  allow_messages_from?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Get current settings
  const { data: userData, error: fetchError } = await supabase
    .from("users")
    .select("settings")
    .eq("id", user.id)
    .single()

  if (fetchError) throw new Error(`Error fetching current settings: ${fetchError.message}`)

  // Update privacy settings in the settings JSONB
  const updatedSettings = {
    ...userData.settings,
    privacy: {
      ...userData.settings?.privacy,
      ...settings,
    },
  }

  const { error } = await supabase.from("users").update({ settings: updatedSettings }).eq("id", user.id)

  if (error) throw error
  revalidatePath("/profile")
}

export async function updateSecuritySettings(settings: {
  security_events_notifications?: boolean
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Get current settings
  const { data: userData, error: fetchError } = await supabase
    .from("users")
    .select("settings")
    .eq("id", user.id)
    .single()

  if (fetchError) throw new Error(`Error fetching current settings: ${fetchError.message}`)

  // Update security settings in the settings JSONB
  const updatedSettings = {
    ...userData.settings,
    security: {
      ...userData.settings?.security,
      ...settings,
    },
  }

  const { error } = await supabase.from("users").update({ settings: updatedSettings }).eq("id", user.id)

  if (error) throw error
  revalidatePath("/profile")
}

export async function updateMarketingNotificationPreferences(preferences: {
  feature_announcements?: boolean
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Get current settings
  const { data: userData, error: fetchError } = await supabase
    .from("users")
    .select("settings")
    .eq("id", user.id)
    .single()

  if (fetchError) throw new Error(`Error fetching current settings: ${fetchError.message}`)

  // Update marketing notification preferences in the settings JSONB
  const updatedSettings = {
    ...userData.settings,
    notifications: {
      ...userData.settings?.notifications,
      marketing: preferences,
    },
  }

  const { error } = await supabase.from("users").update({ settings: updatedSettings }).eq("id", user.id)

  if (error) throw error
  revalidatePath("/profile")
}

export async function updateDeliveryMethodPreferences(preferences: {
  email_enabled?: boolean
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Get current settings
  const { data: userData, error: fetchError } = await supabase
    .from("users")
    .select("settings")
    .eq("id", user.id)
    .single()

  if (fetchError) throw new Error(`Error fetching current settings: ${fetchError.message}`)

  // Update delivery method preferences in the settings JSONB
  const updatedSettings = {
    ...userData.settings,
    notifications: {
      ...userData.settings?.notifications,
      delivery: preferences,
    },
  }

  const { error } = await supabase.from("users").update({ settings: updatedSettings }).eq("id", user.id)

  if (error) throw error
  revalidatePath("/profile")
}

// Get all notification preferences
export async function getAllNotificationPreferences() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data: userData, error } = await supabase.from("users").select("settings").eq("id", user.id).single()

  if (error) throw new Error(`Error fetching user settings: ${error.message}`)

  const settings = userData?.settings || {}

  return {
    social: settings.notifications?.social || {},
    privacy: settings.privacy || {},
    security: settings.security || {},
  }
}

export async function queueNotification(userId: string, type: string, title: string, message: string, data: any = {}) {
  const supabase = await createClient()

  // For now, we'll use the existing messages table to store notifications
  const { error } = await supabase.from("messages").insert({
    from_user_id: userId,
    to_user_id: userId,
    message: `${title}: ${message}`,
    game_title: type,
    read: false,
  })

  if (error) throw error
}
