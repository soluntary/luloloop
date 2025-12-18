-- Add all required notification types to existing notifications table
-- This script extends the notification system with all requested notification types

-- First, ensure the notifications table supports all these types
-- The table already exists, we just need to ensure it can handle our new types

-- Update notification types comment to document all supported types
COMMENT ON COLUMN notifications.type IS 'Notification type - supports: 
Social:
- friend_request: Neue Freundschaftsanfrage
- friend_accepted: Freundschaftsanfrage angenommen  
- friend_declined: Freundschaftsanfrage abgelehnt

Community & Events:
- group_invitation: Einladung zu einer Spielgruppe
- group_join_request: Beitrittsanfrage zu einer Spielgruppe
- group_join_accepted: Beitrittsanfrage angenommen
- group_join_rejected: Beitrittsanfrage abgelehnt
- group_member_joined: Neues Mitglied beigetreten
- group_member_left: Jemand verlässt deine Gruppe
- group_poll_created: Neue Abstimmung in Spielgruppen

Events:
- event_invitation: Event-Einladung
- event_join_request: Teilnehmeranfrage zu einem Event
- event_join_accepted: Teilnahmebestätigung
- event_join_rejected: Teilnahmeabsage
- event_participant_joined: Neue Anmeldung zu deinem Event
- event_participant_immediate: Neues Mitglied beigetreten (sofortiger Beitritt)
- event_participant_left: Teilnehmer hat Event verlassen
- event_cancelled: Event wurde abgesagt

Forum & Comments:
- forum_reply: Antwort auf eigenen Beitrag
- forum_reaction: Reaktionen / Likes auf eigenen Beitrag
- comment_reply: Antwort auf Kommentar

Messages:
- message_group: Nachricht bzgl. Spielgruppe
- message_event: Nachricht bzgl. Event
- message_search_ad: Nachricht bzgl. Suchanzeige
- message_offer: Nachricht bzgl. Angebot

Game Interactions:
- game_shelf_request: Anfrage zum Freigeben des Spielregals
- game_interaction_request: Anfrage zu einem Spiel im Spielregal
- marketplace_offer_request: Anfrage für angebotenes Spiel

System:
- system_maintenance: Wartungsankündigungen
- system_feature: Neue Features / wichtige Updates
';

-- Add index for better notification query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
