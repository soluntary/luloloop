"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Bell, Mail, Calendar, Users, MessageSquare, Book } from "lucide-react"
import { FaUserPlus as FaUserPlusIcon } from "react-icons/fa"

interface NotificationPreferences {
  [key: string]: boolean
}

interface NotificationsTabProps {
  notificationPreferences: NotificationPreferences
  onPreferenceChange: (key: string, value: boolean) => void
}

function NotificationPreferenceRow({
  label,
  inAppKey,
  emailKey,
  preferences,
  onPreferenceChange,
}: {
  label: string
  inAppKey: string
  emailKey: string
  preferences: NotificationPreferences
  onPreferenceChange: (key: string, value: boolean) => void
}) {
  const isEnabledInApp = preferences[inAppKey]
  const isEnabledEmail = preferences[emailKey]

  return (
    <div className="flex items-center justify-between py-3">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-400" />
          <Switch
            checked={!!isEnabledInApp}
            onCheckedChange={(checked) => onPreferenceChange(inAppKey, checked)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <Switch
            checked={!!isEnabledEmail}
            onCheckedChange={(checked) => onPreferenceChange(emailKey, checked)}
          />
        </div>
      </div>
    </div>
  )
}

export function NotificationsTab({ notificationPreferences, onPreferenceChange }: NotificationsTabProps) {
  return (
    <Card className="border-2 border-teal-200">
      <CardHeader>
        <CardTitle className="font-handwritten text-teal-700 text-base">Benachrichtigungen</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Notification Settings */}
          <div>
            <div className="mb-3">
              <div className="flex items-center gap-4 text-[10px] text-gray-500">
                <div className="flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  <span>In-App</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  <span>E-Mail</span>
                </div>
              </div>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-4 pr-3">
                {/* Soziales */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FaUserPlusIcon className="w-4 h-4 text-green-500" />
                    <h3 className="text-sm font-semibold">Soziales</h3>
                  </div>
                  <div className="space-y-1 text-xs">
                    <NotificationPreferenceRow
                      label="Freundschaftsanfrage erhalten"
                      inAppKey="friend_request_in_app"
                      emailKey="friend_request_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                    <NotificationPreferenceRow
                      label="Freundschaftsanfrage akzeptiert"
                      inAppKey="friend_accepted_in_app"
                      emailKey="friend_accepted_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                    <NotificationPreferenceRow
                      label="Freundschaftsanfrage abgelehnt"
                      inAppKey="friend_declined_in_app"
                      emailKey="friend_declined_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                  </div>
                </div>

                <Separator />

                {/* Spielgruppen */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <h3 className="text-sm font-semibold">Spielgruppen</h3>
                  </div>
                  <div className="space-y-1 text-xs">
                    <NotificationPreferenceRow
                      label="Einladung zu Spielgruppe"
                      inAppKey="group_invitation_in_app"
                      emailKey="group_invitation_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                    <NotificationPreferenceRow
                      label="Beitrittsanfrage erhalten"
                      inAppKey="group_join_request_in_app"
                      emailKey="group_join_request_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                    <NotificationPreferenceRow
                      label="Beitritt akzeptiert"
                      inAppKey="group_join_accepted_in_app"
                      emailKey="group_join_accepted_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                    <NotificationPreferenceRow
                      label="Beitritt abgelehnt"
                      inAppKey="group_join_rejected_in_app"
                      emailKey="group_join_rejected_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                    <NotificationPreferenceRow
                      label="Neues Mitglied beigetreten"
                      inAppKey="group_member_joined_in_app"
                      emailKey="group_member_joined_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                    <NotificationPreferenceRow
                      label="Mitglied hat Gruppe verlassen"
                      inAppKey="group_member_left_in_app"
                      emailKey="group_member_left_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                    <NotificationPreferenceRow
                      label="Neue Abstimmung in Spielgruppen"
                      inAppKey="group_poll_created_in_app"
                      emailKey="group_poll_created_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                  </div>
                </div>

                <Separator />

                {/* Events */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-semibold">Events</h3>
                  </div>
                  <div className="space-y-1 text-xs">
                    <NotificationPreferenceRow
                      label="Einladung zu Event"
                      inAppKey="event_invitation_in_app"
                      emailKey="event_invitation_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                    <NotificationPreferenceRow
                      label="Teilnahmeanfrage erhalten"
                      inAppKey="event_join_request_in_app"
                      emailKey="event_join_request_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                    <NotificationPreferenceRow
                      label="Teilnahme akzeptiert"
                      inAppKey="event_join_accepted_in_app"
                      emailKey="event_join_accepted_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                    <NotificationPreferenceRow
                      label="Teilnahme abgelehnt"
                      inAppKey="event_join_rejected_in_app"
                      emailKey="event_join_rejected_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                    <NotificationPreferenceRow
                      label="Neuer Teilnehmer angemeldet"
                      inAppKey="event_participant_joined_in_app"
                      emailKey="event_participant_joined_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                    <NotificationPreferenceRow
                      label="Teilnehmer abgemeldet"
                      inAppKey="event_participant_left_in_app"
                      emailKey="event_participant_left_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                    <NotificationPreferenceRow
                      label="Event abgesagt"
                      inAppKey="event_cancelled_in_app"
                      emailKey="event_cancelled_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                  </div>
                </div>

                <Separator />

                {/* Forum & Kommentare */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-teal-500" />
                    <h3 className="text-sm font-semibold">Forum & Kommentare</h3>
                  </div>
                  <div className="space-y-1 text-xs">
                    <NotificationPreferenceRow
                      label="Antwort auf eigenen Forumsbeitrag"
                      inAppKey="forum_reply_in_app"
                      emailKey="forum_reply_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                    <NotificationPreferenceRow
                      label="Reaktion auf eigenen Beitrag"
                      inAppKey="forum_reaction_in_app"
                      emailKey="forum_reaction_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                    <NotificationPreferenceRow
                      label="Antwort auf Kommentar"
                      inAppKey="comment_reply_in_app"
                      emailKey="comment_reply_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                  </div>
                </div>

                <Separator />

                {/* Spiel-Interaktionen */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Book className="w-4 h-4 text-orange-500" />
                    <h3 className="text-sm font-semibold">Spiel-Interaktionen</h3>
                  </div>
                  <div className="space-y-1 text-xs">
                    <NotificationPreferenceRow
                      label="Spielesammlung-Anfrage"
                      inAppKey="game_shelf_request_in_app"
                      emailKey="game_shelf_request_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                    <NotificationPreferenceRow
                      label="Spiel-Ausleihanfrage"
                      inAppKey="game_interaction_request_in_app"
                      emailKey="game_interaction_request_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                    <NotificationPreferenceRow
                      label="Interesse an Angebot"
                      inAppKey="marketplace_offer_request_in_app"
                      emailKey="marketplace_offer_request_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                  </div>
                </div>

                <Separator />

                {/* System */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-4 h-4 text-red-500" />
                    <h3 className="text-sm font-semibold">Systembenachrichtigungen</h3>
                  </div>
                  <div className="space-y-1 text-xs">
                    <NotificationPreferenceRow
                      label="Wartungsarbeiten & Updates"
                      inAppKey="system_maintenance_in_app"
                      emailKey="system_maintenance_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                    <NotificationPreferenceRow
                      label="Neue Funktionen"
                      inAppKey="system_feature_in_app"
                      emailKey="system_feature_email"
                      preferences={notificationPreferences}
                      onPreferenceChange={onPreferenceChange}
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
