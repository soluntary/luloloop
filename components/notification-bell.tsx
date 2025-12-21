"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  FaBell,
  FaCheck,
  FaTrash,
  FaExchangeAlt,
  FaStar,
  FaEnvelope,
  FaUserPlus,
  FaComments,
  FaBook,
  FaChartBar,
} from "react-icons/fa"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    loadNotifications()

    const supabase = createClient()

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          loadNotifications().catch((err) => {
            // Silently handle realtime subscription errors
          })

          // Show toast for new notification
          if (payload.new) {
            toast.info(payload.new.title || "Neue Benachrichtigung")
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          loadNotifications().catch((err) => {
            // Silently handle realtime subscription errors
          })
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const loadNotifications = async () => {
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return
      }

      const { data: notificationsData, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("NotificationBell: Error loading notifications:", error)
        return
      }

      const unread = notificationsData?.filter((n) => !n.is_read).length || 0

      setNotifications(notificationsData || [])
      setUnreadCount(unread)
    } catch (error) {
      console.error("NotificationBell: Error loading notifications:", error)
    }
  }

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      const supabase = createClient()
      await supabase.from("notifications").update({ is_read: true }).eq("id", notification.id)
    }

    // Navigate based on type
    switch (notification.type) {
      case "trade_match":
      case "trade_match_accepted":
        window.location.href = "/marketplace"
        break
      case "ai_recommendation":
        window.location.href = "/"
        break
      case "group_invitation":
        window.location.href = "/ludo-gruppen"
        break
      case "event_invitation":
        window.location.href = "/ludo-events"
        break
      case "message":
      case "new_message":
        window.location.href = "/messages"
        break
      case "friend_request":
      case "friend_accepted":
        window.location.href = "/ludo-mitglieder"
        break
      case "forum_reply":
      case "comment_reply":
        if (notification.data?.related_id) {
          window.location.href = `/ludo-forum/${notification.data.related_id}`
        } else {
          window.location.href = "/ludo-forum"
        }
        break
      case "game_shelf_request":
        window.location.href = "/library"
        break
      case "poll_created":
        if (notification.data?.community_id) {
          window.location.href = `/ludo-gruppen?group=${notification.data.community_id}`
        } else {
          window.location.href = "/ludo-gruppen"
        }
        break
    }

    setOpen(false)
    loadNotifications()
  }

  const handleMarkAllRead = async () => {
    setLoading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false)

      if (error) {
        toast.error("Fehler beim Markieren")
      } else {
        toast.success("Alle Benachrichtigungen als gelesen markiert")
        loadNotifications()
      }
    }
    setLoading(false)
  }

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    const supabase = createClient()
    const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

    if (error) {
      toast.error("Fehler beim Löschen")
    } else {
      toast.success("Benachrichtigung gelöscht")
      loadNotifications()
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "trade_match":
      case "trade_match_accepted":
        return <FaExchangeAlt className="text-blue-500" />
      case "ai_recommendation":
        return <FaStar className="text-yellow-500" />
      case "message":
      case "new_message":
        return <FaEnvelope className="text-purple-500" />
      case "friend_request":
      case "friend_accepted":
        return <FaUserPlus className="text-green-500" />
      case "forum_reply":
      case "comment_reply":
        return <FaComments className="text-teal-500" />
      case "game_shelf_request":
        return <FaBook className="text-orange-500" />
      case "poll_created":
        return <FaChartBar className="text-indigo-500" />
      default:
        return <FaBell className="text-gray-500" />
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Gerade eben"
    if (diffMins < 60) return `vor ${diffMins}m`
    if (diffHours < 24) return `vor ${diffHours}h`
    if (diffDays < 7) return `vor ${diffDays}d`
    return date.toLocaleDateString("de-DE")
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2">
        <FaBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold z-10 h-4 w-4">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-h-[500px] overflow-y-auto bg-white border rounded shadow">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold">Benachrichtigungen</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-800 text-sm"
              >
                <FaCheck className="w-4 h-4" />
                Alle gelesen
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FaBell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Du bist auf dem neuesten Stand</p>
            </div>
          ) : (
            <>
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 cursor-pointer ${!notification.is_read ? "bg-blue-50" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3 w-full">
                    <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold mb-1 text-xs">{notification.title}</p>
                      <p className="text-xs text-gray-600 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatTime(notification.created_at)}</p>
                    </div>
                    <button onClick={(e) => handleDelete(e, notification.id)} className="flex-shrink-0 h-8 w-8">
                      <FaTrash className="w-3 h-3 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
