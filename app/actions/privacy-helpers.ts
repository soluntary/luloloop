"use server"

import { createClient } from "@/lib/supabase/server"

export async function canSendFriendRequest(
  fromUserId: string,
  toUserId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = await createClient()

  // Get the target user's privacy settings
  const { data: targetUser, error } = await supabase.from("users").select("settings").eq("id", toUserId).single()

  if (error || !targetUser) {
    return { allowed: false, reason: "Benutzer nicht gefunden" }
  }

  const allowFriendRequests = targetUser.settings?.privacy?.allow_friend_requests ?? true

  if (!allowFriendRequests) {
    return { allowed: false, reason: "Dieser Benutzer akzeptiert keine Freundschaftsanfragen" }
  }

  return { allowed: true }
}

export async function canSendMessage(
  fromUserId: string,
  toUserId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = await createClient()

  // Get the target user's privacy settings
  const { data: targetUser, error } = await supabase.from("users").select("settings").eq("id", toUserId).single()

  if (error || !targetUser) {
    return { allowed: false, reason: "Benutzer nicht gefunden" }
  }

  const allowMessagesFrom = targetUser.settings?.privacy?.allow_messages_from ?? "everyone"

  if (allowMessagesFrom === "nobody") {
    return { allowed: false, reason: "Dieser Benutzer akzeptiert keine Nachrichten" }
  }

  if (allowMessagesFrom === "friends") {
    // Check if they are friends
    const { data: friendship } = await supabase
      .from("friends")
      .select("id")
      .eq("user_id", toUserId)
      .eq("friend_id", fromUserId)
      .eq("status", "active")
      .maybeSingle()

    if (!friendship) {
      return { allowed: false, reason: "Dieser Benutzer akzeptiert nur Nachrichten von Freunden" }
    }
  }

  return { allowed: true }
}

export async function canViewProfile(
  viewerId: string | null,
  profileUserId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = await createClient()

  // Get the profile user's privacy settings
  const { data: profileUser, error } = await supabase.from("users").select("settings").eq("id", profileUserId).single()

  if (error || !profileUser) {
    return { allowed: false, reason: "Benutzer nicht gefunden" }
  }

  const profileVisibility = profileUser.settings?.privacy?.profile_visibility ?? "public"

  // If profile is public, anyone can view
  if (profileVisibility === "public") {
    return { allowed: true }
  }

  // If no viewer (not logged in), can't view non-public profiles
  if (!viewerId) {
    return { allowed: false, reason: "Dieses Profil ist nicht öffentlich" }
  }

  // If viewing own profile, always allowed
  if (viewerId === profileUserId) {
    return { allowed: true }
  }

  // If profile is private, only the owner can view
  if (profileVisibility === "private") {
    return { allowed: false, reason: "Dieses Profil ist privat" }
  }

  // If profile is friends-only, check friendship
  if (profileVisibility === "friends") {
    const { data: friendship } = await supabase
      .from("friends")
      .select("id")
      .eq("user_id", profileUserId)
      .eq("friend_id", viewerId)
      .eq("status", "active")
      .maybeSingle()

    if (!friendship) {
      return { allowed: false, reason: "Dieses Profil ist nur für Freunde sichtbar" }
    }
  }

  return { allowed: true }
}
