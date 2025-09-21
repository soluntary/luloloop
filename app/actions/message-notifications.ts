"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getMessageNotificationPreferences() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    const { data: userData, error } = await supabase.from("users").select("settings").eq("id", user.id).single()

    if (error) {
      throw new Error(`Error fetching user settings: ${error.message}`)
    }

    // Return default message notification preferences if not set
    const defaultPrefs = {
      privateMessages: true,
      marketplaceInquiries: true,
      eventInvitations: true,
      groupRequests: true,
      forumReplies: true,
      friendRequests: true,
      quietHours: {
        enabled: false,
        startTime: "22:00",
        endTime: "08:00",
      },
      weekendNotifications: true,
      digestMode: false,
      emailDelivery: true,
      pushDelivery: true,
      inAppDelivery: true,
    }

    const messagePrefs = userData?.settings?.notifications?.messages || defaultPrefs

    return { success: true, preferences: messagePrefs }
  } catch (error) {
    console.error("Error fetching message notification preferences:", error)
    return { success: false, error: error.message }
  }
}

export async function updateMessageNotificationPreferences(preferences: any) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    // Get current settings
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("settings")
      .eq("id", user.id)
      .single()

    if (fetchError) {
      throw new Error(`Error fetching current settings: ${fetchError.message}`)
    }

    // Update message notification preferences in the settings JSONB
    const updatedSettings = {
      ...userData.settings,
      notifications: {
        ...userData.settings?.notifications,
        messages: preferences,
      },
    }

    const { error: updateError } = await supabase.from("users").update({ settings: updatedSettings }).eq("id", user.id)

    if (updateError) {
      throw new Error(`Error updating message preferences: ${updateError.message}`)
    }

    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    console.error("Error updating message notification preferences:", error)
    return { success: false, error: error.message }
  }
}

export async function logMessageNotification(
  fromUserId: string,
  toUserId: string,
  messageType: string,
  content: string,
) {
  try {
    const supabase = await createClient()

    // Check if user wants this type of notification
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("settings")
      .eq("id", toUserId)
      .single()

    if (fetchError) {
      console.error("Error fetching user notification preferences:", fetchError)
      return { success: false }
    }

    const messagePrefs = userData?.settings?.notifications?.messages
    if (!messagePrefs) {
      return { success: false, reason: "No message preferences found" }
    }

    // Check if this type of notification is enabled
    let shouldNotify = false
    switch (messageType) {
      case "private_message":
        shouldNotify = messagePrefs.privateMessages
        break
      case "marketplace_inquiry":
        shouldNotify = messagePrefs.marketplaceInquiries
        break
      case "event_invitation":
        shouldNotify = messagePrefs.eventInvitations
        break
      case "group_request":
        shouldNotify = messagePrefs.groupRequests
        break
      case "forum_reply":
        shouldNotify = messagePrefs.forumReplies
        break
      case "friend_request":
        shouldNotify = messagePrefs.friendRequests
        break
      default:
        shouldNotify = messagePrefs.privateMessages
    }

    if (!shouldNotify) {
      return { success: false, reason: "Notification type disabled by user" }
    }

    // Check quiet hours
    if (messagePrefs.quietHours?.enabled) {
      const now = new Date()
      const currentTime = now.toTimeString().slice(0, 5)
      const startTime = messagePrefs.quietHours.startTime
      const endTime = messagePrefs.quietHours.endTime

      if (currentTime >= startTime || currentTime <= endTime) {
        return { success: false, reason: "Quiet hours active" }
      }
    }

    // Check weekend notifications
    if (!messagePrefs.weekendNotifications) {
      const now = new Date()
      const dayOfWeek = now.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Sunday or Saturday
        return { success: false, reason: "Weekend notifications disabled" }
      }
    }

    // Here you would typically send the actual notification (email, push, etc.)
    // For now, we'll just log it
    console.log(`[v0] Message notification logged: ${messageType} from ${fromUserId} to ${toUserId}`)

    return { success: true }
  } catch (error) {
    console.error("Error logging message notification:", error)
    return { success: false, error: error.message }
  }
}

export async function getMessageNotificationHistory() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    // Get recent messages to show notification history
    const { data: messages, error } = await supabase
      .from("messages")
      .select(`
        id,
        message,
        created_at,
        read,
        from_user:from_user_id(name, avatar),
        game_title,
        offer_type
      `)
      .eq("to_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      throw new Error(`Error fetching message history: ${error.message}`)
    }

    // Format the history for display
    const history =
      messages?.map((msg) => ({
        id: msg.id,
        type: "message",
        title: `Message from ${msg.from_user?.name || "Unknown User"}`,
        content: msg.message,
        timestamp: msg.created_at,
        read: msg.read,
        metadata: {
          gameTitle: msg.game_title,
          offerType: msg.offer_type,
          fromUser: msg.from_user,
        },
      })) || []

    return { success: true, history }
  } catch (error) {
    console.error("Error fetching message notification history:", error)
    return { success: false, error: error.message }
  }
}
