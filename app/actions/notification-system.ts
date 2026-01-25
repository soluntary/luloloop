"use server"
import { createAdminClient } from "@/lib/supabase/admin"

export type NotificationType =
  // Social
  | "friend_request" // Neue Freundschaftsanfrage
  | "friend_accepted" // Freundschaftsanfrage angenommen
  | "friend_declined" // Freundschaftsanfrage abgelehnt
  // Community & Groups
  | "group_invitation" // Einladung zu einer Spielgruppe
  | "group_join_request" // Beitrittsanfrage zu einer Spielgruppe
  | "group_join_accepted" // Beitrittsanfrage angenommen
  | "group_join_rejected" // Beitrittsanfrage abgelehnt
  | "group_member_joined" // Neues Mitglied beigetreten
  | "group_member_left" // Jemand verlässt deine Gruppe
  | "group_poll_created" // Neue Abstimmung in Spielgruppen
  // Events
  | "event_invitation" // Event-Einladung
  | "event_join_request" // Teilnehmeranfrage zu einem Event
  | "event_join_accepted" // Teilnahmebestätigung
  | "event_join_rejected" // Teilnahmeabsage
  | "event_participant_joined" // Neue Anmeldung zu deinem Event
  | "event_participant_immediate" // Neues Mitglied (sofortiger Beitritt)
  | "event_participant_left" // Teilnehmer hat Event verlassen
  | "event_cancelled" // Event-Absage
  // Forum & Comments
  | "forum_reply" // Antwort auf eigenen Beitrag
  | "forum_reaction" // Reaktionen / Likes auf eigenen Beitrag
  | "comment_reply" // Antwort auf Kommentar
  // Messages
  | "message" // Neue direkte Nachricht
  | "message_group" // Nachricht bzgl. Spielgruppe
  | "message_event" // Nachricht bzgl. Event
  | "message_search_ad" // Nachricht bzgl. Suchanzeige
  | "message_offer" // Nachricht bzgl. Angebot
  // Game Interactions
  | "game_shelf_request" // Anfrage zum Freigeben des Spielregals
  | "game_interaction_request" // Anfrage zu einem Spiel im Spielregal
  | "marketplace_offer_request" // Anfrage für angebotenes Spiel
  // System
  | "system_maintenance" // Wartungsankündigungen
  | "system_feature" // Neue Features / wichtige Updates

interface NotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  actionUrl?: string
  data?: Record<string, any>
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: NotificationData) {
  try {
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from("notifications")
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: {
          ...params.data,
          actionUrl: params.actionUrl,
        },
        read: false,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating notification:", error)
      return { success: false, error: error.message }
    }

    return { success: true, notification: data }
  } catch (error: any) {
    console.error("[v0] Error in createNotification:", error)
    return { success: false, error: error.message }
  }
}

export async function notifyFriendRequest(toUserId: string, fromUsername: string, fromUserId: string) {
  return createNotification({
    userId: toUserId,
    type: "friend_request",
    title: "Neue Freundschaftsanfrage",
    message: `${fromUsername} möchte mit dir befreundet sein`,
    actionUrl: `/profile?user=${fromUserId}`,
    data: { fromUserId, fromUsername },
  })
}

export async function notifyFriendAccepted(toUserId: string, username: string, acceptedUserId: string) {
  return createNotification({
    userId: toUserId,
    type: "friend_accepted",
    title: "Freundschaftsanfrage angenommen",
    message: `${username} hat deine Freundschaftsanfrage angenommen`,
    actionUrl: `/profile?user=${acceptedUserId}`,
    data: { acceptedUserId, username },
  })
}

export async function notifyFriendDeclined(toUserId: string, username: string) {
  return createNotification({
    userId: toUserId,
    type: "friend_declined",
    title: "Freundschaftsanfrage abgelehnt",
    message: `${username} hat deine Freundschaftsanfrage abgelehnt`,
    data: { username },
  })
}

export async function notifyGroupInvitation(
  toUserId: string,
  groupName: string,
  inviterUsername: string,
  groupId: string,
) {
  return createNotification({
    userId: toUserId,
    type: "group_invitation",
    title: "Einladung zu einer Spielgruppe",
    message: `${inviterUsername} hat dich zur Spielgruppe "${groupName}" eingeladen`,
    actionUrl: `/ludo-gruppen?group=${groupId}`,
    data: { groupId, groupName, inviterUsername },
  })
}

export async function notifyGroupJoinRequest(
  creatorId: string,
  requesterUsername: string,
  groupName: string,
  groupId: string,
  requestId: string,
) {
  return createNotification({
    userId: creatorId,
    type: "group_join_request",
    title: "Beitrittsanfrage zu deiner Spielgruppe",
    message: `${requesterUsername} möchte der Spielgruppe "${groupName}" beitreten`,
    actionUrl: `/ludo-gruppen?group=${groupId}&manage=true`,
    data: { groupId, groupName, requesterUsername, requestId },
  })
}

export async function notifyGroupJoinAccepted(userId: string, groupName: string, groupId: string) {
  return createNotification({
    userId,
    type: "group_join_accepted",
    title: "Beitrittsanfrage angenommen",
    message: `Deine Beitrittsanfrage zur Spielgruppe "${groupName}" wurde akzeptiert`,
    actionUrl: `/ludo-gruppen?group=${groupId}`,
    data: { groupId, groupName },
  })
}

export async function notifyGroupJoinRejected(userId: string, groupName: string) {
  return createNotification({
    userId,
    type: "group_join_rejected",
    title: "Beitrittsanfrage abgelehnt",
    message: `Deine Beitrittsanfrage zur Spielgruppe "${groupName}" wurde abgelehnt`,
    data: { groupName },
  })
}

export async function notifyGroupMemberJoined(
  creatorId: string,
  memberUsername: string,
  groupName: string,
  groupId: string,
) {
  return createNotification({
    userId: creatorId,
    type: "group_member_joined",
    title: "Neues Mitglied in deiner Spielgruppe",
    message: `${memberUsername} ist der Spielgruppe "${groupName}" beigetreten`,
    actionUrl: `/ludo-gruppen?group=${groupId}`,
    data: { groupId, groupName, memberUsername },
  })
}

export async function notifyGroupMemberLeft(
  creatorId: string,
  memberUsername: string,
  groupName: string,
  groupId: string,
) {
  return createNotification({
    userId: creatorId,
    type: "group_member_left",
    title: "Mitglied hat Spielgruppe verlassen",
    message: `${memberUsername} hat die Spielgruppe "${groupName}" verlassen`,
    actionUrl: `/ludo-gruppen?group=${groupId}`,
    data: { groupId, groupName, memberUsername },
  })
}

export async function notifyGroupPollCreated(
  memberIds: string[],
  pollQuestion: string,
  groupName: string,
  groupId: string,
  pollId: string,
) {
  const notifications = memberIds.map((memberId) =>
    createNotification({
      userId: memberId,
      type: "group_poll_created",
      title: "Neue Abstimmung in Spielgruppe",
      message: `Neue Abstimmung in "${groupName}": ${pollQuestion}`,
      actionUrl: `/ludo-gruppen?group=${groupId}&poll=${pollId}`,
      data: { groupId, groupName, pollQuestion, pollId },
    }),
  )
  return Promise.all(notifications)
}

export async function notifyEventInvitation(
  toUserId: string,
  eventTitle: string,
  inviterUsername: string,
  eventId: string,
) {
  return createNotification({
    userId: toUserId,
    type: "event_invitation",
    title: "Event-Einladung",
    message: `${inviterUsername} hat dich zum Event "${eventTitle}" eingeladen`,
    actionUrl: `/ludo-events?event=${eventId}`,
    data: { eventId, eventTitle, inviterUsername },
  })
}

export async function notifyEventJoinRequest(
  creatorId: string,
  requesterUsername: string,
  eventTitle: string,
  eventId: string,
  requestId: string,
) {
  return createNotification({
    userId: creatorId,
    type: "event_join_request",
    title: "Teilnahmeanfrage für dein Event",
    message: `${requesterUsername} möchte am Event "${eventTitle}" teilnehmen`,
    actionUrl: `/ludo-events?event=${eventId}&manage=true`,
    data: { eventId, eventTitle, requesterUsername, requestId },
  })
}

export async function notifyEventJoinAccepted(userId: string, eventTitle: string, eventId: string) {
  return createNotification({
    userId,
    type: "event_join_accepted",
    title: "Teilnahme bestätigt",
    message: `Deine Teilnahme am Event "${eventTitle}" wurde bestätigt`,
    actionUrl: `/ludo-events?event=${eventId}`,
    data: { eventId, eventTitle },
  })
}

export async function notifyEventJoinRejected(userId: string, eventTitle: string) {
  return createNotification({
    userId,
    type: "event_join_rejected",
    title: "Teilnahme abgelehnt",
    message: `Deine Teilnahmeanfrage für "${eventTitle}" wurde abgelehnt`,
    data: { eventTitle },
  })
}

export async function notifyEventParticipantJoined(
  creatorId: string,
  participantUsername: string,
  eventTitle: string,
  eventId: string,
) {
  return createNotification({
    userId: creatorId,
    type: "event_participant_joined",
    title: "Neue Anmeldung für dein Event",
    message: `${participantUsername} hat sich für "${eventTitle}" angemeldet`,
    actionUrl: `/ludo-events?event=${eventId}`,
    data: { eventId, eventTitle, participantUsername },
  })
}

export async function notifyEventParticipantImmediate(
  creatorId: string,
  participantUsername: string,
  eventTitle: string,
  eventId: string,
) {
  return createNotification({
    userId: creatorId,
    type: "event_participant_immediate",
    title: "Neuer Teilnehmer bei deinem Event",
    message: `${participantUsername} nimmt jetzt an "${eventTitle}" teil`,
    actionUrl: `/ludo-events?event=${eventId}`,
    data: { eventId, eventTitle, participantUsername },
  })
}

export async function notifyEventParticipantLeft(
  creatorId: string,
  participantUsername: string,
  eventTitle: string,
  eventId: string,
) {
  return createNotification({
    userId: creatorId,
    type: "event_participant_left",
    title: "Teilnehmer hat Event verlassen",
    message: `${participantUsername} nimmt nicht mehr an "${eventTitle}" teil`,
    actionUrl: `/ludo-events?event=${eventId}`,
    data: { eventId, eventTitle, participantUsername },
  })
}

export async function notifyEventCancelled(
  participantIds: string[],
  eventTitle: string,
  eventDate: string,
  reason?: string,
) {
  const notifications = participantIds.map((participantId) =>
    createNotification({
      userId: participantId,
      type: "event_cancelled",
      title: "Event abgesagt",
      message: reason
        ? `Das Event "${eventTitle}" am ${eventDate} wurde abgesagt: ${reason}`
        : `Das Event "${eventTitle}" am ${eventDate} wurde abgesagt`,
      data: { eventTitle, eventDate, reason },
    }),
  )
  return Promise.all(notifications)
}

export async function notifyForumReply(
  postAuthorId: string,
  replierUsername: string,
  postTitle: string,
  postId: string,
  replyId: string,
) {
  return createNotification({
    userId: postAuthorId,
    type: "forum_reply",
    title: "Antwort auf deinen Beitrag",
    message: `${replierUsername} hat auf deinen Beitrag "${postTitle}" geantwortet`,
    actionUrl: `/ludo-forum/${postId}#reply-${replyId}`,
    data: { postId, postTitle, replierUsername, replyId },
  })
}

export async function notifyForumReaction(
  postAuthorId: string,
  reactorUsername: string,
  postTitle: string,
  postId: string,
  reactionType: string,
) {
  return createNotification({
    userId: postAuthorId,
    type: "forum_reaction",
    title: "Reaktion auf deinen Beitrag",
    message: `${reactorUsername} hat auf deinen Beitrag "${postTitle}" reagiert`,
    actionUrl: `/ludo-forum/${postId}`,
    data: { postId, postTitle, reactorUsername, reactionType },
  })
}

export async function notifyCommentReply(
  commentAuthorId: string,
  replierUsername: string,
  contextTitle: string,
  contextUrl: string,
  replyId: string,
) {
  return createNotification({
    userId: commentAuthorId,
    type: "comment_reply",
    title: "Antwort auf deinen Kommentar",
    message: `${replierUsername} hat auf deinen Kommentar zu "${contextTitle}" geantwortet`,
    actionUrl: `${contextUrl}#comment-${replyId}`,
    data: { contextTitle, replierUsername, replyId },
  })
}

export async function notifyMessageGroup(
  userId: string,
  senderUsername: string,
  groupName: string,
  groupId: string,
  messagePreview: string,
) {
  return createNotification({
    userId,
    type: "message_group",
    title: "Nachricht bzgl. Spielgruppe",
    message: `${senderUsername} hat dir eine Nachricht zur Spielgruppe "${groupName}" gesendet: ${messagePreview}`,
    actionUrl: `/messages?group=${groupId}`,
    data: { groupId, groupName, senderUsername, messagePreview },
  })
}

export async function notifyMessageEvent(
  userId: string,
  senderUsername: string,
  eventTitle: string,
  eventId: string,
  messagePreview: string,
) {
  return createNotification({
    userId,
    type: "message_event",
    title: "Nachricht bzgl. Event",
    message: `${senderUsername} hat dir eine Nachricht zum Event "${eventTitle}" gesendet: ${messagePreview}`,
    actionUrl: `/messages?event=${eventId}`,
    data: { eventId, eventTitle, senderUsername, messagePreview },
  })
}

export async function notifyMessageSearchAd(
  userId: string,
  senderUsername: string,
  adTitle: string,
  adId: string,
  messagePreview: string,
) {
  return createNotification({
    userId,
    type: "message_search_ad",
    title: "Nachricht bzgl. Suchanzeige",
    message: `${senderUsername} hat dir eine Nachricht zu deiner Suchanzeige "${adTitle}" gesendet: ${messagePreview}`,
    actionUrl: `/messages?ad=${adId}`,
    data: { adId, adTitle, senderUsername, messagePreview },
  })
}

export async function notifyMessageOffer(
  userId: string,
  senderUsername: string,
  offerTitle: string,
  offerId: string,
  messagePreview: string,
) {
  return createNotification({
    userId,
    type: "message_offer",
    title: "Nachricht bzgl. Angebot",
    message: `${senderUsername} hat dir eine Nachricht zu deinem Angebot "${offerTitle}" gesendet: ${messagePreview}`,
    actionUrl: `/messages?offer=${offerId}`,
    data: { offerId, offerTitle, senderUsername, messagePreview },
  })
}

export async function notifyGameShelfRequest(
  ownerId: string,
  requesterUsername: string,
  requesterId: string,
  requestId: string,
) {
  return createNotification({
    userId: ownerId,
    type: "game_shelf_request",
    title: "Anfrage zum Freigeben deines Spielregals",
    message: `${requesterUsername} möchte Zugriff auf dein Spielregal erhalten`,
    actionUrl: `/profile?tab=library&request=${requestId}`,
    data: { requesterUsername, requesterId, requestId },
  })
}

export async function notifyGameInteractionRequest(
  ownerId: string,
  requesterUsername: string,
  gameTitle: string,
  interactionType: string,
  requestId: string,
) {
  return createNotification({
    userId: ownerId,
    type: "game_interaction_request",
    title: "Anfrage zu deinem Spiel",
    message: `${requesterUsername} möchte "${gameTitle}" ${interactionType === "borrow" ? "ausleihen" : interactionType === "buy" ? "kaufen" : "tauschen"}`,
    actionUrl: `/library?request=${requestId}`,
    data: { requesterUsername, gameTitle, interactionType, requestId },
  })
}

export async function notifyMarketplaceOfferRequest(
  ownerId: string,
  requesterUsername: string,
  offerTitle: string,
  offerId: string,
  requestType: string,
) {
  return createNotification({
    userId: ownerId,
    type: "marketplace_offer_request",
    title: "Anfrage für dein Angebot",
    message: `${requesterUsername} interessiert sich für dein Angebot "${offerTitle}"`,
    actionUrl: `/marketplace?offer=${offerId}`,
    data: { requesterUsername, offerTitle, offerId, requestType },
  })
}

export async function notifySystemMaintenance(
  userIds: string[],
  maintenanceTitle: string,
  maintenanceDate: string,
  details: string,
) {
  const notifications = userIds.map((userId) =>
    createNotification({
      userId,
      type: "system_maintenance",
      title: "Wartungsankündigung",
      message: `${maintenanceTitle} am ${maintenanceDate}: ${details}`,
      data: { maintenanceTitle, maintenanceDate, details },
    }),
  )
  return Promise.all(notifications)
}

export async function notifySystemFeature(
  userIds: string[],
  featureTitle: string,
  featureDescription: string,
  featureUrl?: string,
) {
  const notifications = userIds.map((userId) =>
    createNotification({
      userId,
      type: "system_feature",
      title: "Neue Features verfügbar!",
      message: `${featureTitle}: ${featureDescription}`,
      actionUrl: featureUrl,
      data: { featureTitle, featureDescription },
    }),
  )
  return Promise.all(notifications)
}

export async function notifyNewMessage(userId: string, senderUsername: string, messagePreview: string, senderId?: string) {
  return createNotification({
    userId,
    type: "message" as NotificationType,
    title: "Neue Nachricht",
    message: `${senderUsername} hat dir eine Nachricht gesendet: ${messagePreview}`,
    actionUrl: senderId ? `/messages?user=${senderId}` : `/messages`,
    data: { senderUsername, messagePreview, sender_id: senderId },
  })
}

export const notifyGroupJoinApproved = notifyGroupJoinAccepted
