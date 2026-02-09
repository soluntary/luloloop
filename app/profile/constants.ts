export const AVATAR_STYLES = [
  {
    id: "avataaars",
    name: "Flat (Vektorstil)",
    description: "Flachiger 2D-Stil ohne Tiefenwirkung; klare Konturen, leuchtende Vollfarben.",
  },
  { id: "micah", name: "Modern", description: "Stilvolle, minimalistische Avatare" },
  { id: "lorelei", name: "Minimalistisch", description: "Einfache Avatare, wenige Farben." },
  { id: "lorelei-neutral", name: "Klassisch", description: "Zeitlose, neutrale Avatare" },
  {
    id: "adventurer",
    name: "Cartoon / Comic",
    description: "Vereinfachte, oft humorvolle Zeichnungen mit ubertriebenen Figuren.",
  },
  { id: "croodles", name: "Skizziert", description: "Handgezeichnete, verspielte Avatare" },
  { id: "croodles-neutral", name: "Doodle", description: "Bewusst roh und handgezeichnet wirkend." },
  { id: "notionists", name: "Professionell", description: "Schlichte, klare Avatare" },
  { id: "open-peeps", name: "Illustriert", description: "Handgezeichnete Illustrationen" },
]

export const AVATAR_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#98D8C8",
  "#FFEAA7",
  "#DDA0DD",
  "#98C8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
  "#F8B500",
  "#00CED1",
  "#FF69B4",
  "#32CD32",
  "#FF4500",
]

export interface ActivityData {
  createdEvents: any[]
  eventParticipations: any[]
  friendRequests: any[]
  eventJoinRequests: any[]
  memberCommunities: any[]
  createdCommunities: any[]
  marketplaceOffers: any[]
  searchAds: any[]
  communityMemberships: any[]
}

export interface ActivityItem {
  id: string
  type: "event" | "friend_request" | "community" | "marketplace"
  title: string
  description: string
  timestamp: Date
  icon: any
  status?: string
}

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  // Soziales
  friend_request_in_app: true,
  friend_request_email: true,
  friend_accepted_in_app: true,
  friend_accepted_email: false,
  friend_declined_in_app: true,
  friend_declined_email: false,

  // Spielgruppen
  group_invitation_in_app: true,
  group_invitation_email: true,
  group_join_request_in_app: true,
  group_join_request_email: true,
  group_join_accepted_in_app: true,
  group_join_accepted_email: true,
  group_join_rejected_in_app: true,
  group_join_rejected_email: false,
  group_member_joined_in_app: true,
  group_member_joined_email: false,
  group_member_left_in_app: true,
  group_member_left_email: false,
  group_poll_created_in_app: true,
  group_poll_created_email: false,

  // Events
  event_invitation_in_app: true,
  event_invitation_email: true,
  event_join_request_in_app: true,
  event_join_request_email: true,
  event_join_accepted_in_app: true,
  event_join_accepted_email: true,
  event_join_rejected_in_app: true,
  event_join_rejected_email: false,
  event_participant_joined_in_app: true,
  event_participant_joined_email: false,
  event_participant_immediate_in_app: true,
  event_participant_immediate_email: false,
  event_participant_left_in_app: true,
  event_participant_left_email: false,
  event_cancelled_in_app: true,
  event_cancelled_email: false,

  // Forum & Kommentare
  forum_reply_in_app: true,
  forum_reply_email: true,
  forum_reaction_in_app: true,
  forum_reaction_email: false,
  comment_reply_in_app: true,
  comment_reply_email: false,

  // Spiel-Interaktionen
  game_shelf_request_in_app: true,
  game_shelf_request_email: true,
  game_interaction_request_in_app: true,
  game_interaction_request_email: true,
  marketplace_offer_request_in_app: true,
  marketplace_offer_request_email: true,

  // System
  system_maintenance_in_app: true,
  system_maintenance_email: true,
  system_feature_in_app: true,
  system_feature_email: false,
}
