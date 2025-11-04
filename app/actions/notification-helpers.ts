"use server"

import { createClient } from "@/lib/supabase/server"

type NotificationType =
  | "friend_request"
  | "friend_accepted"
  | "friend_declined"
  | "forum_reply"
  | "comment_reply"
  | "game_shelf_request"
  | "event_invitation"
  | "event_reminder"
  | "group_join_request"
  | "group_join_approved"
  | "group_join_rejected"
  | "group_created"
  | "group_join"
  | "group_leave"
  | "message"
  | "poll_created"
  | "event_join_request"

/**
 * Checks if a user has enabled a specific notification type
 * Returns true if the user wants to receive this notification, false otherwise
 */
export async function shouldSendNotification(userId: string, notificationType: NotificationType): Promise<boolean> {
  const supabase = await createClient()

  try {
    // Map notification types to their preference tables and columns
    const preferenceMapping: Record<NotificationType, { table: string; column: string; defaultValue: boolean }> = {
      friend_request: { table: "social_notification_preferences", column: "friend_requests", defaultValue: true },
      friend_accepted: { table: "social_notification_preferences", column: "friend_accepts", defaultValue: true },
      friend_declined: { table: "social_notification_preferences", column: "friend_accepts", defaultValue: true },
      forum_reply: { table: "social_notification_preferences", column: "forum_replies", defaultValue: true },
      comment_reply: { table: "social_notification_preferences", column: "forum_replies", defaultValue: true },
      game_shelf_request: {
        table: "social_notification_preferences",
        column: "shelf_access_requests",
        defaultValue: true,
      },
      event_invitation: { table: "social_notification_preferences", column: "community_events", defaultValue: true },
      event_reminder: { table: "social_notification_preferences", column: "event_reminders", defaultValue: true },
      group_join_request: {
        table: "social_notification_preferences",
        column: "community_invitations",
        defaultValue: true,
      },
      group_join_approved: {
        table: "social_notification_preferences",
        column: "community_invitations",
        defaultValue: true,
      },
      group_join_rejected: {
        table: "social_notification_preferences",
        column: "community_invitations",
        defaultValue: true,
      },
      group_created: { table: "social_notification_preferences", column: "community_posts", defaultValue: true },
      group_join: { table: "social_notification_preferences", column: "community_member_joins", defaultValue: true },
      group_leave: { table: "social_notification_preferences", column: "community_member_joins", defaultValue: true },
      message: { table: "social_notification_preferences", column: "friend_requests", defaultValue: true }, // Using friend_requests as proxy for messages
      poll_created: { table: "social_notification_preferences", column: "community_posts", defaultValue: true },
      event_join_request: { table: "social_notification_preferences", column: "community_events", defaultValue: true },
    }

    const mapping = preferenceMapping[notificationType]
    if (!mapping) {
      console.warn(`[v0] Unknown notification type: ${notificationType}, defaulting to true`)
      return true
    }

    // Check if user has preferences set
    const { data, error } = await supabase
      .from(mapping.table)
      .select(mapping.column)
      .eq("user_id", userId)
      .maybeSingle()

    if (error) {
      console.error(`[v0] Error checking notification preferences:`, error)
      return mapping.defaultValue
    }

    // If no preferences found, return default value (true - send notification)
    if (!data) {
      return mapping.defaultValue
    }

    // Return the user's preference
    return data[mapping.column] ?? mapping.defaultValue
  } catch (error) {
    console.error(`[v0] Error in shouldSendNotification:`, error)
    return true // Default to sending notification on error
  }
}

/**
 * Creates a notification if the user has enabled that notification type
 */
export async function createNotificationIfEnabled(
  userId: string,
  notificationType: NotificationType,
  title: string,
  message: string,
  data?: any,
) {
  const shouldSend = await shouldSendNotification(userId, notificationType)

  if (!shouldSend) {
    console.log(`[v0] Notification ${notificationType} skipped for user ${userId} (disabled in preferences)`)
    return null
  }

  const supabase = await createClient()

  const { data: notification, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type: notificationType,
      title,
      message,
      data: data || {},
      read: false,
    })
    .select()
    .single()

  if (error) {
    console.error(`[v0] Error creating notification:`, error)
    return null
  }

  console.log(`[v0] Notification ${notificationType} created for user ${userId}`)
  return notification
}
