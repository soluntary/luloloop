"use server"

import { createClient } from "@/lib/supabase/server"

export type NotificationType =
  | "trade_match"
  | "trade_match_accepted"
  | "ai_recommendation"
  | "group_invitation"
  | "event_invitation"
  | "message" // Added message type for direct messages
  | "new_message"

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
}

/**
 * Create a new notification for a user
 */
export async function createNotification(params: CreateNotificationParams): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("notifications").insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data || {},
      read: false,
    })

    if (error) {
      console.error("[v0] Error creating notification:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error in createNotification:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all notifications for the current user
 */
export async function getUserNotifications(): Promise<{
  success: boolean
  notifications: any[]
  unreadCount: number
  error?: string
}> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, notifications: [], unreadCount: 0, error: "Not authenticated" }
    }

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("[v0] Error fetching notifications:", error)
      return { success: false, notifications: [], unreadCount: 0, error: error.message }
    }

    const unreadCount = notifications?.filter((n) => !n.read).length || 0

    return { success: true, notifications: notifications || [], unreadCount }
  } catch (error: any) {
    console.error("[v0] Error in getUserNotifications:", error)
    return { success: false, notifications: [], unreadCount: 0, error: error.message }
  }
}

/**
 * Mark notification(s) as read
 */
export async function markNotificationAsRead(notificationIds: string[]): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("notifications").update({ read: true }).in("id", notificationIds)

    if (error) {
      console.error("[v0] Error marking notifications as read:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error in markNotificationAsRead:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsAsRead(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false)

    if (error) {
      console.error("[v0] Error marking all notifications as read:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error in markAllNotificationsAsRead:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

    if (error) {
      console.error("[v0] Error deleting notification:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error in deleteNotification:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Send notification for new trade match
 */
export async function notifyTradeMatch(
  userId: string,
  matchId: string,
  offerTitle: string,
  partnerName: string,
): Promise<{
  success: boolean
  error?: string
}> {
  return createNotification({
    userId,
    type: "trade_match",
    title: "Perfektes Tausch-Match gefunden!",
    message: `${partnerName} sucht genau das Spiel, das du anbietest: "${offerTitle}"`,
    data: { matchId, offerTitle, partnerName },
  })
}

/**
 * Send notification when match is accepted
 */
export async function notifyTradeMatchAccepted(
  userId: string,
  matchId: string,
  offerTitle: string,
  partnerName: string,
): Promise<{
  success: boolean
  error?: string
}> {
  return createNotification({
    userId,
    type: "trade_match_accepted",
    title: "Tausch-Match akzeptiert!",
    message: `${partnerName} hat deinen Tausch für "${offerTitle}" akzeptiert. Zeit, die Details zu besprechen!`,
    data: { matchId, offerTitle, partnerName },
  })
}

/**
 * Send notification for new AI recommendations
 */
export async function notifyNewRecommendations(
  userId: string,
  recommendationType: "game" | "group" | "event",
  count: number,
): Promise<{
  success: boolean
  error?: string
}> {
  const typeText = recommendationType === "game" ? "Spiele" : recommendationType === "group" ? "Spielgruppen" : "Events"

  return createNotification({
    userId,
    type: "ai_recommendation",
    title: "Neue KI-Empfehlungen für dich!",
    message: `Wir haben ${count} neue ${typeText} gefunden, die perfekt zu dir passen könnten.`,
    data: { recommendationType, count },
  })
}
