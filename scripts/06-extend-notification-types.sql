-- Extend social_notification_preferences with missing notification types

-- Add missing columns to social_notification_preferences
ALTER TABLE social_notification_preferences
ADD COLUMN IF NOT EXISTS game_shelf_approval BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS game_shelf_rejection BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS marketplace_messages BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS event_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS event_updates BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS event_cancellations BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS event_participant_changes BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS group_member_leaves BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS game_interactions BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS direct_messages BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS system_announcements BOOLEAN DEFAULT true;

-- Update notification_helpers to include all types
COMMENT ON COLUMN social_notification_preferences.friend_requests IS 'Freundschaftsanfrage bekommen';
COMMENT ON COLUMN social_notification_preferences.friend_accepts IS 'Freundschaftsanfrage angenommen';
COMMENT ON COLUMN social_notification_preferences.game_shelf_approval IS 'Anfrage zum Freigeben meines Spielregals genehmigt';
COMMENT ON COLUMN social_notification_preferences.game_shelf_rejection IS 'Anfrage zum Freigeben meines Spielregals abgelehnt';
COMMENT ON COLUMN social_notification_preferences.shelf_access_requests IS 'Anfrage zum Freigeben meines Spielregals';
COMMENT ON COLUMN social_notification_preferences.marketplace_messages IS 'Anfrage für ein in Marketplace angebotene Spiel';
COMMENT ON COLUMN social_notification_preferences.direct_messages IS 'Neue Nachricht bekommen';
COMMENT ON COLUMN social_notification_preferences.community_invitations IS 'Einladung zu einer Spielgruppe';
COMMENT ON COLUMN social_notification_preferences.community_member_joins IS 'Neues Mitglied beigetreten (bei Events mit sofortiger Beitritt)';
COMMENT ON COLUMN social_notification_preferences.community_posts IS 'Neue Nachricht / Abstimmung in der Gruppe';
COMMENT ON COLUMN social_notification_preferences.community_events IS 'Einladung zu einem Event / Event-Benachrichtigungen';
COMMENT ON COLUMN social_notification_preferences.event_reminders IS 'Event-Erinnerungen';
COMMENT ON COLUMN social_notification_preferences.event_updates IS 'Event wurde aktualisiert';
COMMENT ON COLUMN social_notification_preferences.event_cancellations IS 'Event wurde abgesagt';
COMMENT ON COLUMN social_notification_preferences.event_participant_changes IS 'Jemand tritt deinem Event bei oder verlässt es';
COMMENT ON COLUMN social_notification_preferences.group_member_leaves IS 'Jemand verlässt deine Gruppe';
COMMENT ON COLUMN social_notification_preferences.forum_replies IS 'Antwort auf deinen Beitrag';
COMMENT ON COLUMN social_notification_preferences.forum_post_likes IS 'Reaktionen / Likes auf deinen Beitrag';
COMMENT ON COLUMN social_notification_preferences.game_interactions IS 'Anfrage zu einer Spiel in meinem Spielregal';
COMMENT ON COLUMN social_notification_preferences.system_announcements IS 'Systeminfos (Wartungsankündigungen, neue Features)';
