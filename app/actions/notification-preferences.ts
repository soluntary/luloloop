"use server"

import { createClient } from "@/lib/supabase/server"

export type NotificationCategory =
  | "game_shelf"
  | "marketplace"
  | "messages"
  | "friends"
  | "events"
  | "groups"
  | "forum"
  | "system"

export interface NotificationPreferences {
  // Game Shelf & Marketplace
  game_shelf_requests: { inApp: boolean; email: boolean }
  game_interactions: { inApp: boolean; email: boolean }
  marketplace_messages: { inApp: boolean; email: boolean }

  // Messages
  direct_messages: { inApp: boolean; email: boolean }
  group_messages: { inApp: boolean; email: boolean }
  event_messages: { inApp: boolean; email: boolean }

  // Friends
  friend_requests: { inApp: boolean; email: boolean }
  friend_accepts: { inApp: boolean; email: boolean }

  // Events
  event_invitations: { inApp: boolean; email: boolean }
  event_join_requests: { inApp: boolean; email: boolean }
  event_confirmations: { inApp: boolean; email: boolean }
  event_participant_changes: { inApp: boolean; email: boolean }
  event_reminders: { inApp: boolean; email: boolean }

  // Groups
  group_invitations: { inApp: boolean; email: boolean }
  group_join_requests: { inApp: boolean; email: boolean }
  group_approvals: { inApp: boolean; email: boolean }
  group_messages: { inApp: boolean; email: boolean }
  group_polls: { inApp: boolean; email: boolean }
  group_member_leaves: { inApp: boolean; email: boolean }

  // Forum
  forum_replies: { inApp: boolean; email: boolean }
  forum_reactions: { inApp: boolean; email: boolean }

  // System
  system_announcements: { inApp: boolean; email: boolean }
  system_maintenance: { inApp: boolean; email: boolean }
  system_features: { inApp: boolean; email: boolean }
}

export async function getNotificationPreferences(userId?: string): Promise<NotificationPreferences> {
  const supabase = await createClient()

  let targetUserId = userId
  if (!targetUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")
    targetUserId = user.id
  }

  // Get preferences from the users settings table
  const { data, error } = await supabase.from("users").select("settings").eq("id", targetUserId).single()

  if (error) {
    console.error("Error fetching notification preferences:", error)
    // Return defaults
    return getDefaultPreferences()
  }

  return data?.settings?.notifications || getDefaultPreferences()
}

export async function updateNotificationPreferences(
  category: string,
  preferences: { inApp: boolean; email: boolean },
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  // Get current settings
  const { data: userData, error: fetchError } = await supabase
    .from("users")
    .select("settings")
    .eq("id", user.id)
    .single()

  if (fetchError) {
    return { success: false, error: fetchError.message }
  }

  // Update specific category
  const updatedSettings = {
    ...userData?.settings,
    notifications: {
      ...userData?.settings?.notifications,
      [category]: preferences,
    },
  }

  const { error: updateError } = await supabase.from("users").update({ settings: updatedSettings }).eq("id", user.id)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true }
}

function getDefaultPreferences(): NotificationPreferences {
  return {
    game_shelf_requests: { inApp: true, email: true },
    game_interactions: { inApp: true, email: true },
    marketplace_messages: { inApp: true, email: true },
    direct_messages: { inApp: true, email: true },
    group_messages: { inApp: true, email: false },
    event_messages: { inApp: true, email: true },
    friend_requests: { inApp: true, email: true },
    friend_accepts: { inApp: true, email: true },
    event_invitations: { inApp: true, email: true },
    event_join_requests: { inApp: true, email: true },
    event_confirmations: { inApp: true, email: true },
    event_participant_changes: { inApp: true, email: false },
    event_reminders: { inApp: true, email: true },
    group_invitations: { inApp: true, email: true },
    group_join_requests: { inApp: true, email: true },
    group_approvals: { inApp: true, email: true },
    group_messages: { inApp: true, email: false },
    group_polls: { inApp: true, email: false },
    group_member_leaves: { inApp: true, email: false },
    forum_replies: { inApp: true, email: true },
    forum_reactions: { inApp: true, email: false },
    system_announcements: { inApp: true, email: true },
    system_maintenance: { inApp: true, email: true },
    system_features: { inApp: true, email: false },
  }
}
