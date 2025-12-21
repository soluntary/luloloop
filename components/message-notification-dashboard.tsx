"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageCircle, Mail, Clock, User } from "lucide-react"
import { getMessageNotificationHistory } from "@/app/actions/message-notifications"
import { useUser } from "@/contexts/user-context"

interface NotificationHistoryItem {
  id: string
  notification_type: string
  sent_at: string
  email_sent: boolean
  email_error?: string
  message: {
    id: string
    message: string
    game_title: string
    offer_type: string
    created_at: string
    from_user: {
      name: string
      username: string
    }
  }
}

export function MessageNotificationDashboard() {
  const { user } = useUser()
  const [notifications, setNotifications] = useState<NotificationHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadNotificationHistory = async () => {
      if (!user?.id) return

      try {
        const history = await getMessageNotificationHistory(user.id)
        setNotifications(history)
      } catch (error) {
        console.error("Error loading notification history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadNotificationHistory()
  }, [user])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return "Vor wenigen Minuten"
    } else if (diffInHours < 24) {
      return `Vor ${Math.floor(diffInHours)} Stunden`
    } else {
      return date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    }
  }

  const getOfferTypeText = (type: string) => {
    switch (type) {
      case "lend":
        return "Verleihen"
      case "trade":
        return "Tauschen"
      case "sell":
        return "Verkaufen"
      case "search_buy":
        return "Suche Kauf"
      case "search_rent":
        return "Suche Leihe"
      case "search_trade":
        return "Suche Tausch"
      case "event_inquiry":
        return "Event-Anfrage"
      case "group_inquiry":
        return "Gruppen-Anfrage"
      default:
        return "Allgemeine Nachricht"
    }
  }

  const getOfferTypeColor = (type: string) => {
    switch (type) {
      case "lend":
        return "bg-teal-100 text-teal-800"
      case "trade":
        return "bg-orange-100 text-orange-800"
      case "sell":
        return "bg-pink-100 text-pink-800"
      case "search_buy":
      case "search_rent":
      case "search_trade":
        return "bg-purple-100 text-purple-800"
      case "event_inquiry":
        return "bg-blue-100 text-blue-800"
      case "group_inquiry":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-handwritten text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Nachrichten-Benachrichtigungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Lade Benachrichtigungsverlauf...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-handwritten text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Nachrichten-Benachrichtigungen
        </CardTitle>
        <CardDescription>Verlauf der gesendeten E-Mail-Benachrichtigungen für neue Nachrichten</CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-body">Noch keine Benachrichtigungen gesendet</p>
            <p className="text-sm text-gray-400 mt-2">
              E-Mail-Benachrichtigungen werden hier angezeigt, sobald du Nachrichten erhältst
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.slice(0, 10).map((notification) => (
              <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border">
                <div className="flex-shrink-0">
                  {notification.email_sent ? (
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4 text-red-600" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getOfferTypeColor(notification.message.offer_type)}>
                      {getOfferTypeText(notification.message.offer_type)}
                    </Badge>
                    <span className="text-sm font-medium text-gray-800">{notification.message.game_title}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <User className="h-3 w-3" />
                    <span>von {notification.message.from_user.username}</span>
                    <Clock className="h-3 w-3 ml-2" />
                    <span>{formatTime(notification.sent_at)}</span>
                  </div>

                  <p className="text-xs text-gray-700 truncate">{notification.message.message}</p>

                  {notification.email_error && (
                    <p className="text-xs text-red-600 mt-1">Fehler: {notification.email_error}</p>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <Badge variant={notification.email_sent ? "default" : "destructive"}>
                    {notification.email_sent ? "Gesendet" : "Fehler"}
                  </Badge>
                </div>
              </div>
            ))}

            {notifications.length > 10 && (
              <div className="text-center pt-4">
                <Button variant="outline" size="sm">
                  Mehr anzeigen ({notifications.length - 10} weitere)
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
