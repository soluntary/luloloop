"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Bell, MessageCircle, Users, MessageSquare, BookOpen, Calendar } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { formatDistanceToNow } from "date-fns"
import { de } from "date-fns/locale"
import EventInvitationsDialog from "./event-invitations-dialog"

interface Notification {
  id: string
  type:
    | "friend_request"
    | "friend_accepted"
    | "forum_reply"
    | "comment_reply"
    | "game_shelf_request"
    | "message"
    | "event_invitation"
  title: string
  message: string
  created_at: string
  read: boolean
  data?: any
}

interface NotificationDropdownProps {
  className?: string
}

export default function NotificationDropdown({ className }: NotificationDropdownProps) {
  const { user } = useAuth() || { user: null }
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [showEventInvitations, setShowEventInvitations] = useState(false)

  useEffect(() => {
    if (user) {
      loadNotifications()
      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const loadNotifications = async () => {
    if (!user) return

    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from("notifications")
        .select(`
          id,
          type,
          title,
          message,
          created_at,
          read,
          data
        `)
        .eq("user_id", user.id)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("Error loading notifications:", error)
        return
      }

      const processedNotifications =
        data?.map((notification) => ({
          ...notification,
          related_id: notification.data?.related_id || null,
        })) || []

      setNotifications(processedNotifications)
      setUnreadCount(processedNotifications.length || 0)
    } catch (error) {
      console.error("Error loading notifications:", error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!user) return

    try {
      const supabase = await createClient()
      await supabase.from("notifications").update({ read: true }).eq("id", notificationId).eq("user_id", user.id)

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      const supabase = await createClient()
      await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false)

      setNotifications([])
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "friend_request":
      case "friend_accepted":
        return <Users className="w-4 h-4 text-blue-500" />
      case "forum_reply":
      case "comment_reply":
        return <MessageSquare className="w-4 h-4 text-green-500" />
      case "game_shelf_request":
        return <BookOpen className="w-4 h-4 text-purple-500" />
      case "message":
        return <MessageCircle className="w-4 h-4 text-orange-500" />
      case "event_invitation":
        return <Calendar className="w-4 h-4 text-teal-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)

    switch (notification.type) {
      case "friend_request":
        window.location.href = "/ludo-mitglieder"
        break
      case "forum_reply":
      case "comment_reply":
        if (notification.related_id) {
          window.location.href = `/ludo-forum/${notification.related_id}`
        } else {
          window.location.href = "/ludo-forum"
        }
        break
      case "game_shelf_request":
        window.location.href = "/library"
        break
      case "message":
        window.location.href = "/messages"
        break
      case "event_invitation":
        setShowEventInvitations(true)
        break
      default:
        break
    }
    setIsOpen(false)
  }

  const handleInvitationUpdate = () => {
    loadNotifications()
  }

  if (!user) return null

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={`relative p-2 rounded-lg hover:bg-teal-50 hover:text-teal-600 transform hover:scale-105 hover:-rotate-1 transition-all ${className}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold text-sm">Benachrichtigungen</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-teal-600 hover:text-teal-700"
              >
                Alle als gelesen markieren
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">Zurzeit keine Benachrichtigung</div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <DropdownMenuItem
                    className="p-3 cursor-pointer hover:bg-gray-50 bg-blue-50 border-l-4 border-l-blue-500"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3 w-full">
                      <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p>
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: de,
                          })}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  {index < notifications.length - 1 && <DropdownMenuSeparator />}
                </div>
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {user && (
        <EventInvitationsDialog
          userId={user.id}
          isOpen={showEventInvitations}
          onClose={() => setShowEventInvitations(false)}
          onUpdate={handleInvitationUpdate}
        />
      )}
    </>
  )
}
