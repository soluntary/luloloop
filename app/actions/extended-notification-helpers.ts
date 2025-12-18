"use server"
import { createNotificationIfEnabled } from "@/app/actions/notification-helpers"

/**
 * Extended notification types covering all user requirements
 */
export type ExtendedNotificationType =
  // Game Shelf & Marketplace
  | "game_shelf_request" // Anfrage zum Freigeben meines Spielregals
  | "game_shelf_approved" // Anfrage genehmigt
  | "game_shelf_denied" // Anfrage abgelehnt
  | "game_interaction_request" // Anfrage zu einem Spiel in meinem Spielregal
  | "marketplace_message" // Anfrage für ein Marketplace-Angebot

  // Messages
  | "new_message" // Neue Nachricht bekommen
  | "group_message" // Nachricht in Bezug auf Spielgruppe
  | "event_message" // Nachricht in Bezug auf Event
  | "search_ad_message" // Nachricht in Bezug auf Suchanzeige
  | "offer_message" // Nachricht in Bezug auf Angebot

  // Friends
  | "friend_request" // Freundschaftsanfrage bekommen
  | "friend_accepted" // Freundschaftsanfrage angenommen
  | "friend_declined" // Freundschaftsanfrage abgelehnt

  // Events
  | "event_invitation" // Einladung zu einem Event
  | "event_join_request" // Teilnehmeranfrage zu einem Event
  | "event_join_confirmed" // Teilnahme bestätigt
  | "event_join_cancelled" // Teilnahme abgesagt
  | "event_participant_joined" // Neues Mitglied beigetreten (sofortiger Beitritt)
  | "event_participant_left" // Jemand hat das Event verlassen
  | "event_reminder" // Event-Erinnerung
  | "event_updated" // Event wurde aktualisiert
  | "event_cancelled" // Event wurde abgesagt

  // Groups
  | "group_invitation" // Einladung zu einer Spielgruppe
  | "group_join_request" // Beitrittsanfrage zu einer Spielgruppe
  | "group_join_approved" // Aufnahme in eine Spielgruppe bestätigt
  | "group_join_rejected" // Beitrittsanfrage abgelehnt
  | "group_message" // Neue Nachricht in der Gruppe
  | "group_poll" // Neue Abstimmung in der Gruppe
  | "group_member_left" // Jemand verlässt deine Gruppe

  // Forum
  | "forum_reply" // Antwort auf deinen Beitrag
  | "forum_reaction" // Reaktionen / Likes auf deinen Beitrag

  // System
  | "system_maintenance" // Wartungsankündigungen
  | "system_feature" // Neue Features / wichtige Updates

/**
 * Create notification with proper type mapping
 */
export async function createExtendedNotification(
  userId: string,
  type: ExtendedNotificationType,
  title: string,
  message: string,
  data?: any,
  actionUrl?: string,
) {
  return await createNotificationIfEnabled(userId, type as any, title, message, {
    ...data,
    action_url: actionUrl,
  })
}

/**
 * Specific notification creators for each category
 */

// Game Shelf & Marketplace
export async function notifyGameShelfRequest(
  ownerId: string,
  requesterName: string,
  gameTitle: string,
  requestId: string,
) {
  return createExtendedNotification(
    ownerId,
    "game_shelf_request",
    "Anfrage zum Spielregal",
    `${requesterName} möchte auf dein Spiel "${gameTitle}" zugreifen`,
    { requestId, gameTitle, requesterName },
    `/library?request=${requestId}`,
  )
}

export async function notifyMarketplaceInquiry(
  sellerId: string,
  buyerName: string,
  gameTitle: string,
  offerId: string,
) {
  return createExtendedNotification(
    sellerId,
    "marketplace_message",
    "Neue Marketplace-Anfrage",
    `${buyerName} interessiert sich für dein Angebot: "${gameTitle}"`,
    { offerId, gameTitle, buyerName },
    `/marketplace?offer=${offerId}`,
  )
}

// Messages
export async function notifyNewMessage(
  recipientId: string,
  senderName: string,
  context: "general" | "group" | "event" | "search_ad" | "offer",
  contextId?: string,
) {
  const typeMap = {
    general: "new_message" as const,
    group: "group_message" as const,
    event: "event_message" as const,
    search_ad: "search_ad_message" as const,
    offer: "offer_message" as const,
  }

  return createExtendedNotification(
    recipientId,
    typeMap[context],
    "Neue Nachricht",
    `${senderName} hat dir eine Nachricht gesendet`,
    { senderName, context, contextId },
    "/messages",
  )
}

// Events
export async function notifyEventInvitation(guestId: string, eventTitle: string, inviterName: string, eventId: string) {
  return createExtendedNotification(
    guestId,
    "event_invitation",
    "Event-Einladung",
    `${inviterName} hat dich zu "${eventTitle}" eingeladen`,
    { eventId, eventTitle, inviterName },
    `/ludo-events?event=${eventId}`,
  )
}

export async function notifyEventJoinRequest(
  organizerId: string,
  requesterName: string,
  eventTitle: string,
  eventId: string,
) {
  return createExtendedNotification(
    organizerId,
    "event_join_request",
    "Neue Teilnahmeanfrage",
    `${requesterName} möchte an "${eventTitle}" teilnehmen`,
    { eventId, eventTitle, requesterName },
    `/ludo-events?event=${eventId}&tab=participants`,
  )
}

export async function notifyEventJoinConfirmed(participantId: string, eventTitle: string, eventId: string) {
  return createExtendedNotification(
    participantId,
    "event_join_confirmed",
    "Teilnahme bestätigt",
    `Deine Teilnahme an "${eventTitle}" wurde bestätigt`,
    { eventId, eventTitle },
    `/ludo-events?event=${eventId}`,
  )
}

export async function notifyEventParticipantJoined(
  organizerId: string,
  participantName: string,
  eventTitle: string,
  eventId: string,
) {
  return createExtendedNotification(
    organizerId,
    "event_participant_joined",
    "Neuer Teilnehmer",
    `${participantName} nimmt jetzt an "${eventTitle}" teil`,
    { eventId, eventTitle, participantName },
    `/ludo-events?event=${eventId}&tab=participants`,
  )
}

// Groups
export async function notifyGroupInvitation(memberId: string, groupName: string, inviterName: string, groupId: string) {
  return createExtendedNotification(
    memberId,
    "group_invitation",
    "Spielgruppen-Einladung",
    `${inviterName} hat dich zu "${groupName}" eingeladen`,
    { groupId, groupName, inviterName },
    `/ludo-gruppen?group=${groupId}`,
  )
}

export async function notifyGroupJoinRequest(
  organizerId: string,
  requesterName: string,
  groupName: string,
  groupId: string,
) {
  return createExtendedNotification(
    organizerId,
    "group_join_request",
    "Neue Beitrittsanfrage",
    `${requesterName} möchte der Gruppe "${groupName}" beitreten`,
    { groupId, groupName, requesterName },
    `/ludo-gruppen?group=${groupId}&tab=members`,
  )
}

export async function notifyGroupJoinApproved(memberId: string, groupName: string, groupId: string) {
  return createExtendedNotification(
    memberId,
    "group_join_approved",
    "Aufnahme bestätigt",
    `Du wurdest in die Gruppe "${groupName}" aufgenommen`,
    { groupId, groupName },
    `/ludo-gruppen?group=${groupId}`,
  )
}

export async function notifyGroupMemberLeft(
  organizerId: string,
  memberName: string,
  groupName: string,
  groupId: string,
) {
  return createExtendedNotification(
    organizerId,
    "group_member_left",
    "Mitglied hat Gruppe verlassen",
    `${memberName} hat die Gruppe "${groupName}" verlassen`,
    { groupId, groupName, memberName },
    `/ludo-gruppen?group=${groupId}&tab=members`,
  )
}

export async function notifyGroupPoll(memberId: string, pollTitle: string, groupName: string, groupId: string) {
  return createExtendedNotification(
    memberId,
    "group_poll",
    "Neue Abstimmung",
    `Neue Abstimmung in "${groupName}": ${pollTitle}`,
    { groupId, groupName, pollTitle },
    `/ludo-gruppen?group=${groupId}&tab=polls`,
  )
}

// Forum
export async function notifyForumReply(authorId: string, replierName: string, postTitle: string, postId: string) {
  return createExtendedNotification(
    authorId,
    "forum_reply",
    "Neue Antwort",
    `${replierName} hat auf deinen Beitrag "${postTitle}" geantwortet`,
    { postId, postTitle, replierName },
    `/ludo-forum/${postId}`,
  )
}

export async function notifyForumReaction(
  authorId: string,
  reactorName: string,
  postTitle: string,
  postId: string,
  reactionType: string,
) {
  return createExtendedNotification(
    authorId,
    "forum_reaction",
    "Neue Reaktion",
    `${reactorName} hat auf deinen Beitrag "${postTitle}" reagiert`,
    { postId, postTitle, reactorName, reactionType },
    `/ludo-forum/${postId}`,
  )
}

// Friends
export async function notifyFriendRequest(recipientId: string, requesterName: string, requesterId: string) {
  return createExtendedNotification(
    recipientId,
    "friend_request",
    "Neue Freundschaftsanfrage",
    `${requesterName} möchte dein Freund sein`,
    { requesterId, requesterName },
    `/ludo-mitglieder?request=${requesterId}`,
  )
}

export async function notifyFriendAccepted(requesterId: string, accepterName: string, accepterId: string) {
  return createExtendedNotification(
    requesterId,
    "friend_accepted",
    "Freundschaftsanfrage angenommen",
    `${accepterName} hat deine Freundschaftsanfrage angenommen`,
    { accepterId, accepterName },
    `/ludo-mitglieder?user=${accepterId}`,
  )
}

// System
export async function notifySystemMaintenance(userId: string, title: string, message: string, scheduledFor?: Date) {
  return createExtendedNotification(
    userId,
    "system_maintenance",
    `Wartungsankündigung: ${title}`,
    message,
    { scheduledFor },
    "/system-status",
  )
}

export async function notifyNewFeature(userId: string, featureName: string, description: string) {
  return createExtendedNotification(
    userId,
    "system_feature",
    `Neues Feature: ${featureName}`,
    description,
    { featureName },
    "/whats-new",
  )
}
