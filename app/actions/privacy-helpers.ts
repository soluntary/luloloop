"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Checks if a user can send a friend request to another user
 */
export async function canSendFriendRequest(senderId: string, recipientId: string): Promise<boolean> {
  const supabase = await createClient()

  try {
    const { data: recipientSettings, error } = await supabase
      .from("users")
      .select("settings")
      .eq("id", recipientId)
      .single()

    if (error) {
      console.error(`[v0] Error checking friend request permissions:`, error)
      return true
    }

    const allowFriendRequests = recipientSettings?.settings?.privacy?.allow_friend_requests ?? true
    return allowFriendRequests
  } catch (error) {
    console.error(`[v0] Error in canSendFriendRequest:`, error)
    return true
  }
}

/**
 * Checks if a user can send a message to another user
 * Based on the recipient's message privacy settings
 */
export async function canSendMessage(senderId: string, recipientId: string): Promise<boolean> {
  const supabase = await createClient()

  try {
    const { data: recipientSettings, error } = await supabase
      .from("users")
      .select("settings")
      .eq("id", recipientId)
      .single()

    if (error) {
      console.error(`[v0] Error checking message permissions:`, error)
      return true
    }

    const allowMessagesFrom = recipientSettings?.settings?.privacy?.allow_messages_from || "everyone"

    if (allowMessagesFrom === "everyone") {
      return true
    }

    if (allowMessagesFrom === "nobody") {
      return false
    }

    if (allowMessagesFrom === "friends") {
      const { data: friendship, error: friendshipError } = await supabase
        .from("friendships")
        .select("id")
        .or(`user_id.eq.${senderId},friend_id.eq.${senderId}`)
        .or(`user_id.eq.${recipientId},friend_id.eq.${recipientId}`)
        .eq("status", "accepted")
        .maybeSingle()

      if (friendshipError) {
        console.error(`[v0] Error checking friendship:`, friendshipError)
        return true
      }

      return !!friendship
    }

    return true
  } catch (error) {
    console.error(`[v0] Error in canSendMessage:`, error)
    return true
  }
}

/**
 * Checks if a user can view another user's profile
 * Based on the profile visibility settings
 */
export async function canViewProfile(viewerId: string, profileOwnerId: string): Promise<boolean> {
  if (viewerId === profileOwnerId) {
    return true
  }

  const supabase = await createClient()

  try {
    const { data: profileSettings, error } = await supabase
      .from("users")
      .select("settings")
      .eq("id", profileOwnerId)
      .single()

    if (error) {
      console.error(`[v0] Error checking profile visibility:`, error)
      return true
    }

    const profileVisibility = profileSettings?.settings?.privacy?.profile_visibility || "public"

    if (profileVisibility === "public") {
      return true
    }

    if (profileVisibility === "private") {
      return false
    }

    if (profileVisibility === "friends") {
      const { data: friendship, error: friendshipError } = await supabase
        .from("friendships")
        .select("id")
        .or(`user_id.eq.${viewerId},friend_id.eq.${viewerId}`)
        .or(`user_id.eq.${profileOwnerId},friend_id.eq.${profileOwnerId}`)
        .eq("status", "accepted")
        .maybeSingle()

      if (friendshipError) {
        console.error(`[v0] Error checking friendship:`, friendshipError)
        return true
      }

      return !!friendship
    }

    return true
  } catch (error) {
    console.error(`[v0] Error in canViewProfile:`, error)
    return true
  }
}
