-- Add 'message' as the primary notification type for direct messages
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Updated constraint to include 'message' instead of 'new_message' for consistency with existing data
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'friend_request',
  'friend_accepted',
  'friend_declined',
  'game_shelf_request',
  'game_interaction_request',
  'event_invitation',
  'event_join_request',
  'event_join_accepted',
  'event_join_rejected',
  'event_participant_joined',
  'event_participant_immediate',
  'event_participant_left',
  'event_cancelled',
  'group_invitation',
  'group_join_request',
  'group_join_accepted',
  'group_join_rejected',
  'group_member_joined',
  'group_member_left',
  'group_poll_created',
  'community_invitation',
  'community_join_request',
  'poll_created',
  'poll_vote',
  'forum_reply',
  'forum_reaction',
  'comment_reply',
  'message',
  'message_group',
  'message_event',
  'message_search_ad',
  'message_offer',
  'marketplace_offer_request',
  'system_maintenance',
  'system_feature',
  'system_announcement'
));
